import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioRecorder from './AudioRecorder';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mic, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LoadingView from './LoadingView';
import ErrorView from './ErrorView';
import ResultsView from './ResultsView';
import { IdentificationResult } from '../../../shared/schema';

interface SoundIdentificationViewProps {
  onBackToCamera: () => void;
}

export default function SoundIdentificationView({ onBackToCamera }: SoundIdentificationViewProps) {
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [tab, setTab] = useState<string>('record');
  const { toast } = useToast();
  
  const handleAudioCaptured = (audioData: string) => {
    setAudioData(audioData);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type and size
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (mp3, wav, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Audio file should be less than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      setAudioData(reader.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the audio file",
        variant: "destructive",
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  const identifyBird = async () => {
    if (!audioData) return;
    
    try {
      setError(null);
      setIsIdentifying(true);
      
      const response = await apiRequest('POST', '/api/identify-sound', {
        audio: audioData,
        source: tab === 'record' ? 'recorder' : 'upload',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error identifying bird sound');
      }
      
      const result = await response.json();
      setResult(result);
    } catch (err: any) {
      console.error('Error identifying bird sound:', err);
      setError(err.message || 'Failed to identify bird from sound');
      toast({
        title: "Identification failed",
        description: err.message || 'There was an error identifying the bird',
        variant: "destructive",
      });
    } finally {
      setIsIdentifying(false);
    }
  };
  
  const handleTryAgain = () => {
    setAudioData(null);
    setError(null);
    setResult(null);
  };
  
  const goBack = () => {
    onBackToCamera();
  };

  // Case 1: Loading state
  if (isIdentifying) {
    return <LoadingView message="Analyzing bird sound..." />;
  }
  
  // Case 2: Error state
  if (error) {
    return <ErrorView message={error} onTryAgain={handleTryAgain} />;
  }
  
  // Case 3: Results state
  if (result) {
    return <ResultsView result={result} onBackToCamera={goBack} />;
  }
  
  // Case 4: Recording/Upload state
  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Bird Sound Identification</CardTitle>
          <CardDescription>
            Identify bird species by their sounds
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="record">
                <Mic className="mr-2 h-4 w-4" />
                Record
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="record" className="mt-0">
              <AudioRecorder onAudioCaptured={handleAudioCaptured} />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      Upload an audio file of a bird call
                    </p>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="max-w-xs"
                    />
                    {isUploading && (
                      <div className="mt-4 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Processing audio...</span>
                      </div>
                    )}
                    {audioData && !isUploading && (
                      <div className="mt-4 text-sm text-green-600 flex items-center">
                        <span>Audio file ready for identification</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex justify-between p-4">
          <Button variant="outline" onClick={goBack}>
            Back to Camera
          </Button>
          
          <Button 
            onClick={identifyBird} 
            disabled={!audioData || isIdentifying}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isIdentifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Identifying...
              </>
            ) : (
              'Identify Bird'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
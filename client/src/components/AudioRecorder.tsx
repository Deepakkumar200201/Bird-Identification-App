import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MicIcon, Square as StopIcon, PlayIcon, PauseIcon, Trash2Icon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onAudioCaptured: (audioData: string) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

export default function AudioRecorder({ onAudioCaptured, maxDuration = 15 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(50).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Set up audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('timeupdate', () => {
      setPlaybackTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });
    
    return () => {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audio.src = '';
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Update visualizer during recording
  const updateVisualizer = () => {
    if (!analyserRef.current || !isRecording) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sampling frequency data for visualization
    const sampleSize = Math.floor(dataArray.length / 50);
    const samples = Array(50).fill(0);
    
    for (let i = 0; i < 50; i++) {
      const startIndex = i * sampleSize;
      let sum = 0;
      for (let j = 0; j < sampleSize; j++) {
        sum += dataArray[startIndex + j] || 0;
      }
      samples[i] = sum / sampleSize / 255; // Normalize to 0-1
    }
    
    setVisualizerData(samples);
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      // Start visualizer
      updateVisualizer();
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (audioRef.current) {
          audioRef.current.src = url;
        }
        
        // Stop the audio track
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Convert to base64 for API submission
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onAudioCaptured(base64Audio);
        };
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Set up recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 0.1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };
  
  // Play recorded audio
  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  // Seek to position in recording
  const seekAudio = (value: number[]) => {
    if (!audioRef.current || !audioUrl) return;
    
    audioRef.current.currentTime = value[0];
    setPlaybackTime(value[0]);
  };
  
  // Clear recording
  const clearRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setPlaybackTime(0);
    setIsPlaying(false);
  };
  
  // Format time (seconds) to mm:ss format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center mb-4">
          {!isRecording && !audioUrl && (
            <Button 
              size="lg" 
              onClick={startRecording}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <MicIcon className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button 
              size="lg" 
              variant="destructive" 
              onClick={stopRecording}
            >
              <StopIcon className="mr-2 h-5 w-5" />
              Stop Recording ({formatTime(recordingTime)})
            </Button>
          )}
          
          {!isRecording && audioUrl && (
            <div className="flex space-x-2">
              <Button 
                size="icon" 
                onClick={togglePlayPause}
                variant="outline"
              >
                {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
              </Button>
              
              <Button 
                size="icon" 
                variant="outline" 
                onClick={clearRecording}
                className="text-destructive"
              >
                <Trash2Icon className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Recording visualizer */}
        {isRecording && (
          <div className="mb-4 h-12 bg-muted rounded-md flex items-center overflow-hidden px-2">
            <div className="w-full flex items-end space-x-[2px]">
              {visualizerData.map((value, index) => (
                <div 
                  key={index} 
                  className="bg-primary flex-1 rounded-sm"
                  style={{ height: `${Math.max(4, value * 100)}%` }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Playback progress */}
        {audioUrl && audioDuration > 0 && (
          <div className="space-y-2">
            <Slider
              value={[playbackTime]}
              max={audioDuration}
              step={0.1}
              onValueChange={seekAudio}
              className="mt-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(playbackTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        )}
        
        {/* Recording progress */}
        {isRecording && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(recordingTime)}</span>
              <span>{formatTime(maxDuration)}</span>
            </div>
          </div>
        )}
        
        <div className={cn("text-center mt-4", !audioUrl && !isRecording ? "block" : "hidden")}>
          <p className="text-sm text-muted-foreground">
            Record a bird call to identify the species
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
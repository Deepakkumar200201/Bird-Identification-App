import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CameraView from "@/components/CameraView";
import UploadView from "@/components/UploadView";
import LoadingView from "@/components/LoadingView";
import ResultsView from "@/components/ResultsView";
import ErrorView from "@/components/ErrorView";
import { IdentificationResult } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { identifyBirdImage } from "@/lib/birdApi";
import { useToast } from "@/hooks/use-toast";

type AppState = "camera" | "upload" | "loading" | "results" | "error";

const Home = () => {
  const [appState, setAppState] = useState<AppState>("camera");
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const identifyMutation = useMutation({
    mutationFn: identifyBirdImage,
    onSuccess: (data) => {
      setIdentificationResult(data);
      setAppState("results");
    },
    onError: (error) => {
      console.error("Error identifying bird:", error);
      toast({
        variant: "destructive",
        title: "Identification Failed",
        description: "We couldn't identify the bird in your image. Please try again.",
      });
      setAppState("error");
    },
  });

  const handleCapturePhoto = (imageData: string) => {
    setCapturedImage(imageData);
    setAppState("loading");
    identifyMutation.mutate({ image: imageData, source: "camera" });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      setCapturedImage(base64Image);
      setAppState("loading");
      identifyMutation.mutate({ image: base64Image, source: "upload" });
    };
    reader.readAsDataURL(file);
  };

  const navigateTo = (state: AppState) => {
    setAppState(state);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-1 container mx-auto p-4">
        {appState === "camera" && (
          <CameraView 
            onCapturePhoto={handleCapturePhoto} 
            onNavigateToUpload={() => navigateTo("upload")}
          />
        )}
        
        {appState === "upload" && (
          <UploadView 
            onFileUpload={handleFileUpload} 
            onBackToCamera={() => navigateTo("camera")}
          />
        )}
        
        {appState === "loading" && (
          <LoadingView />
        )}
        
        {appState === "results" && identificationResult && (
          <ResultsView 
            result={identificationResult}
            onBackToCamera={() => navigateTo("camera")}
          />
        )}
        
        {appState === "error" && (
          <ErrorView 
            onTryAgain={() => navigateTo("camera")}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;

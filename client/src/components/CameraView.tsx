import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useMobile from "@/hooks/use-mobile";

interface CameraViewProps {
  onCapturePhoto: (imageData: string) => void;
  onNavigateToUpload: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapturePhoto, onNavigateToUpload }) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    // Check for camera permissions
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCameraPermission(true))
      .catch(() => setCameraPermission(false));
  }, []);

  const handleCapturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapturePhoto(imageSrc);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to capture image. Please try again.",
        });
      }
    }
  }, [webcamRef, onCapturePhoto, toast]);

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

  const requestCameraPermission = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setCameraPermission(true))
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Camera access is required to take photos.",
        });
      });
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-lg mb-4">
        <div className="camera-container rounded-lg bg-black border-4 border-white shadow-xl mx-auto relative">
          {cameraPermission === true ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center text-white p-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path>
              </svg>
              <h3 className="text-xl font-montserrat font-semibold mb-2">Camera Access Required</h3>
              <p className="mb-4">Please allow camera access to identify birds through photos.</p>
              <Button
                onClick={requestCameraPermission}
                className="bg-primary hover:bg-primary-dark"
              >
                Enable Camera
              </Button>
            </div>
          )}

          {/* Camera guides */}
          {cameraPermission === true && (
            <>
              <div className="absolute inset-0 border-2 border-white border-opacity-30 rounded-lg pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-2 border-white border-opacity-50 rounded-full"></div>
              </div>
            </>
          )}

          {/* Camera Controls */}
          {cameraPermission === true && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center space-x-6">
              <button
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-primary"
                onClick={onNavigateToUpload}
                aria-label="Open photo gallery"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>

              <button
                className="camera-button w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-primary shadow-lg"
                onClick={handleCapturePhoto}
                aria-label="Capture photo"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
              </button>

              {isMobile && (
                <button
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-primary"
                  onClick={handleFlipCamera}
                  aria-label="Flip camera"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 15h.01"></path>
                    <path d="M11 19L2 12l9-7"></path>
                    <path d="M22 19l-9-7"></path>
                    <path d="M13 5l-3-3"></path>
                    <path d="M18 10l3 3"></path>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="w-full max-w-lg mb-6">
        <CardContent className="p-5">
          <h2 className="font-montserrat font-semibold text-xl text-primary mb-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 12c0 0 .6-3.6-3-4.5-3-1.5-6 0-6 4.5 0 .5 0 1 .1 1.5C6.6 15.2 8 17.5 8 17.5"></path>
              <path d="M15 12c0 0 .6 3.6-3 4.5-3 1.5-6 0-6-4.5"></path>
              <path d="M18 12c-.1-4.3-3.9-8-8-8s-8 3.7-8 8a8 8 0 1 0 16 0Z"></path>
            </svg>
            Identify Birds Instantly
          </h2>
          <p className="text-neutral-700 mb-4">
            Snap a photo or upload an existing image to identify the bird species using Gemini AI technology.
          </p>
          <div className="flex flex-wrap -mx-2">
            <div className="w-full md:w-1/2 px-2 mb-3">
              <div className="flex items-start">
                <div className="mt-1 mr-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-montserrat font-medium text-neutral-800">Take a Photo</h3>
                  <p className="text-sm text-neutral-600">Position the bird in the frame and tap the capture button</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 px-2 mb-3">
              <div className="flex items-start">
                <div className="mt-1 mr-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-montserrat font-medium text-neutral-800">Upload an Image</h3>
                  <p className="text-sm text-neutral-600">Select an existing bird photo from your gallery</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Identifications */}
      <div className="w-full max-w-lg">
        <h3 className="font-montserrat font-semibold text-lg text-neutral-800 mb-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Recent Identifications
        </h3>

        {/* Empty state for recent identifications */}
        <Card className="text-center">
          <CardContent className="p-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-neutral-300 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 12c0 0 .6-3.6-3-4.5-3-1.5-6 0-6 4.5 0 .5 0 1 .1 1.5C6.6 15.2 8 17.5 8 17.5"></path>
              <path d="M15 12c0 0 .6 3.6-3 4.5-3 1.5-6 0-6-4.5"></path>
              <path d="M18 12c-.1-4.3-3.9-8-8-8s-8 3.7-8 8a8 8 0 1 0 16 0Z"></path>
            </svg>
            <h4 className="font-montserrat font-medium text-neutral-600 mb-1">No Recent Identifications</h4>
            <p className="text-sm text-neutral-500">Your identified birds will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraView;

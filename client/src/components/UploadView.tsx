import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  onBackToCamera: () => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onFileUpload, onBackToCamera }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndUploadFile(files[0]);
    }
  };

  const validateAndUploadFile = (file: File) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or HEIC image.",
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 10MB.",
      });
      return;
    }

    onFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndUploadFile(files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4">
        <button 
          className="flex items-center text-secondary font-medium"
          onClick={onBackToCamera}
        >
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
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to Camera
        </button>
      </div>
      
      <div 
        className={`upload-overlay rounded-lg border-2 border-dashed ${
          isDragging ? 'border-primary' : 'border-neutral-300'
        } p-8 text-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-primary mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m16 16-4-4-4 4"></path>
          </svg>
          <h3 className="font-montserrat font-semibold text-xl mb-2">Upload Bird Image</h3>
          <p className="text-neutral-600 mb-4">Drag and drop your bird photo or click to browse</p>
          
          <Button 
            className="bg-primary hover:bg-primary-dark"
            onClick={handleFileSelection}
          >
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
              <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6"></path>
              <path d="M14 3v5h5M18 21v-6M15 18h6"></path>
            </svg>
            Choose Photo
          </Button>
          <input 
            type="file" 
            id="fileInput" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/jpeg,image/png,image/heic,image/heif" 
            onChange={handleFileChange}
          />
        </div>
        
        <div className="text-neutral-500 text-sm">
          <p>Supported formats: JPG, PNG, HEIC</p>
          <p>Maximum file size: 10MB</p>
        </div>
      </div>
    </div>
  );
};

export default UploadView;

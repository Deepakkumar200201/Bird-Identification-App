import { Button } from "@/components/ui/button";

interface ErrorViewProps {
  onTryAgain: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ onTryAgain }) => {
  return (
    <div className="w-full max-w-lg mx-auto text-center py-8">
      <div className="bg-white rounded-lg p-8 shadow-md">
        <div className="w-20 h-20 mx-auto bg-error bg-opacity-10 rounded-full flex items-center justify-center text-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <h3 className="font-montserrat font-semibold text-xl mb-3">Identification Failed</h3>
        <p className="text-neutral-600 mb-6">
          We couldn't identify the bird in your photo. The image may be unclear or the bird might not be visible enough.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
          <Button 
            className="bg-primary hover:bg-primary-dark"
            onClick={onTryAgain}
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
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            onClick={() => window.open("https://support.birds.app/tips-for-better-photos", "_blank")}
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            View Tips
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorView;

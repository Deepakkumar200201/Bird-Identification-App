import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 mt-auto py-4 px-4">
      <div className="container mx-auto text-center text-neutral-600 text-sm">
        <p>© {new Date().getFullYear()} Bird Identifier - Powered by Gemini API</p>
        <div className="mt-3 flex justify-center space-x-4">
          <Link href="/">
            <div className="text-green-600 hover:text-green-700 cursor-pointer">Home</div>
          </Link>
          <Link href="/dashboard">
            <div className="text-green-600 hover:text-green-700 cursor-pointer">Dashboard</div>
          </Link>
        </div>
        <div className="mt-2 text-xs text-neutral-500">
          Identify birds instantly with AI-powered recognition
        </div>
      </div>
    </footer>
  );
};

export default Footer;

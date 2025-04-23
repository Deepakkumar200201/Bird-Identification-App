const LoadingView: React.FC = () => {
  return (
    <div className="w-full max-w-lg mx-auto text-center py-12">
      <div className="mb-6">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
      <h3 className="font-montserrat font-semibold text-xl mb-2">Identifying Bird...</h3>
      <p className="text-neutral-600">Our AI is analyzing your photo using Gemini</p>
    </div>
  );
};

export default LoadingView;

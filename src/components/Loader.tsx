import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-transparent z-50">
      <div className="flex bg-transparent gap-2">
        <div className="w-6 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:0s]"></div>
        <div className="w-6 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]"></div>
        <div className="w-6 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
      </div>
    </div>
  );
};

export default Loader;

// src/components/FallbackUI.tsx

import React from 'react';

const FallbackUI = () => (
  <div className="flex flex-col items-center justify-center h-screen p-4">
    <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
    <p className="text-lg">Please try refreshing the page or contact support.</p>
  </div>
);

export default FallbackUI;

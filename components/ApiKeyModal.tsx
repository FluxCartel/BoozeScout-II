
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onKeySaved: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length < 10) { // Basic validation
      setError('Please enter a valid Gemini API key.');
      return;
    }
    setError('');
    onKeySaved(apiKey.trim());
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Welcome to BoozeScout Agent</h1>
        <p className="text-center text-gray-400 mb-6">To get started, please enter your Google Gemini API key.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-3"
              placeholder="Enter your API key here"
              aria-describedby="api-key-description"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
          
          <p id="api-key-description" className="text-xs text-gray-500">
            Your API key is stored securely in your browser's session storage and is never shared. You can get a key from Google AI Studio.
          </p>

          <button
            type="submit"
            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-md text-lg hover:bg-cyan-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
          >
            Save &amp; Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;

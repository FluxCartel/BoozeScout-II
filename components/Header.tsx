
import React from 'react';

interface HeaderProps {
  onLogoClick: () => void;
}

const BottleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v1.172l1.34-1.341a1 1 0 111.414 1.414L12.414 6.5l1.342 1.34a1 1 0 11-1.414 1.414L11 7.914V16a1 1 0 01-2 0V7.914l-1.34 1.34a1 1 0 11-1.414-1.414L7.586 6.5 6.244 5.159a1 1 0 111.414-1.414L9 5.172V4a1 1 0 011-1zm-4.75 8.634a.75.75 0 00-.53 1.28l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06L10 13.19l-2.72-2.72a.75.75 0 00-1.06.214.75.75 0 00-.22 1.05z" clipRule="evenodd" />
        <path d="M5 12.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5H5z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onLogoClick}
          >
            <BottleIcon />
            <h1 className="text-2xl font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">
              BoozeScout Agent
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

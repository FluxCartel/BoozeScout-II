
import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <div className="bg-gray-700/50 p-6 rounded-lg text-center transform hover:scale-105 hover:bg-gray-700 transition-all duration-300">
        <div className="flex justify-center items-center mb-4 text-cyan-400">
            {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

const PriceScoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 11a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
);

const ChatAssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const LiveAgentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);


interface HomeScreenProps {
  onStartScouting: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartScouting }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
        Welcome to <span className="text-cyan-400">BoozeScout Agent</span>
      </h1>
      <p className="text-lg text-gray-300 max-w-2xl mb-12">
        Your personal AI assistant for finding the best deals on beer, wine, and spirits in your area.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-5xl">
        <FeatureCard 
            icon={<PriceScoutIcon />}
            title="Price Scout"
            description="Search for specific products, scan barcodes, and compare prices from local stores instantly."
        />
        <FeatureCard 
            icon={<ChatAssistantIcon />}
            title="Chat Assistant"
            description="Ask for recommendations, food pairings, or any beverage-related questions you have."
        />
        <FeatureCard 
            icon={<LiveAgentIcon />}
            title="Live Agent"
            description="Go hands-free. Just tell the agent what you're looking for and let it do the searching for you."
        />
      </div>

      <button 
        onClick={onStartScouting}
        className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-cyan-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
      >
        Start Scouting for Prices
      </button>
    </div>
  );
};

export default HomeScreen;

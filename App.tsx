
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import HomeScreen from './views/HomeScreen';
import PriceScoutView from './views/PriceScoutView';
import ChatAssistantView from './views/ChatAssistantView';
import LiveAgentView from './views/LiveAgentView';
import { PriceScoutInitialState, PriceScoutSearchState } from './types';
import { TABS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TABS.HOME);
  const [priceScoutState, setPriceScoutState] = useState<PriceScoutSearchState>(PriceScoutInitialState);

  const handleNavigateToPriceScout = useCallback(() => {
    setActiveTab(TABS.PRICE_SCOUT);
  }, []);

  const handleVoiceSearch = useCallback((product: string, location: string) => {
    setPriceScoutState(prevState => ({
      ...prevState,
      // Reset previous results but keep filters, set new query
      results: [],
      error: null,
      isLoading: true, // Start loading immediately
      query: {
        ...prevState.query,
        product,
        location,
      },
      // A key to force re-fetch in PriceScoutView
      searchTrigger: Date.now() 
    }));
    setActiveTab(TABS.PRICE_SCOUT);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case TABS.PRICE_SCOUT:
        return <PriceScoutView initialState={priceScoutState} setGlobalState={setPriceScoutState} />;
      case TABS.CHAT_ASSISTANT:
        return <ChatAssistantView />;
      case TABS.LIVE_AGENT:
        return <LiveAgentView onSearchTrigger={handleVoiceSearch} />;
      case TABS.HOME:
      default:
        return <HomeScreen onStartScouting={handleNavigateToPriceScout} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header onLogoClick={() => setActiveTab(TABS.HOME)} />
      <main className="container mx-auto p-4 md:p-6">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 md:p-8 min-h-[70vh]">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} BoozeScout Agent. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;

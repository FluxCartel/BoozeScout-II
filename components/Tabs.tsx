
import React from 'react';
import { TABS } from '../constants';

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabItems = [TABS.PRICE_SCOUT, TABS.CHAT_ASSISTANT, TABS.LIVE_AGENT];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">Select a tab</label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-600 bg-gray-700 text-white focus:border-cyan-500 focus:ring-cyan-500"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          {tabItems.map((tab) => (
            <option key={tab}>{tab}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabItems.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Tabs;


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CATEGORY_DATA, PACKAGE_SIZES } from '../constants';
import { fetchPrices } from '../services/geminiService';
import type { PriceScoutSearchState, PriceResult, QueryEcho } from '../types';
import Spinner from '../components/Spinner';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

interface PriceScoutViewProps {
    initialState: PriceScoutSearchState;
    setGlobalState: React.Dispatch<React.SetStateAction<PriceScoutSearchState>>;
}

const SortIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h9m-9 4h13M3 20h5" />
    </svg>
);
const BarcodeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-16v16M4 8h4m-4 4h4m-4 4h4M20 8h-4m4 4h-4m4 4h-4" />
    </svg>
);
const LocationIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);


const PriceScoutView: React.FC<PriceScoutViewProps> = ({ initialState, setGlobalState }) => {
    const [state, setState] = useState<PriceScoutSearchState>(initialState);
    const { results, queryEcho, isLoading, error, query } = state;
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<'price_asc' | 'price_desc' | 'distance'>('price_asc');

    const handleSearch = useCallback(async () => {
        if (!query.product && !query.category) {
            setState(s => ({ ...s, error: "Please enter a product name or select a category." }));
            return;
        }
        if (!query.location) {
            setState(s => ({ ...s, error: "Please provide a location to search near." }));
            return;
        }

        setState(s => ({ ...s, isLoading: true, error: null, results: [] }));
        try {
            const response = await fetchPrices(query);
            setState(s => ({ ...s, results: response.results, queryEcho: response.queryEcho, isLoading: false }));
        } catch (err: any) {
            setState(s => ({ ...s, error: err.message, isLoading: false }));
        }
    }, [query]);

    useEffect(() => {
        // This effect listens for search triggers from external components (like Live Agent)
        if (initialState.searchTrigger > state.searchTrigger) {
            setState(initialState);
            // Directly call handleSearch if the new state has enough info
            if (initialState.query.product && initialState.query.location) {
                 handleSearch();
            }
        }
    }, [initialState, state.searchTrigger, handleSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setState(s => ({
            ...s,
            query: { ...s.query, [name]: name === 'radius' ? parseInt(value) : value }
        }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        setState(s => ({
            ...s,
            query: { ...s.query, category, subCategory: '', variety: '' }
        }));
    };

    const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subCategory = e.target.value;
        setState(s => ({
            ...s,
            query: { ...s.query, subCategory, variety: '' }
        }));
    };

    const handleClear = () => {
        const clearedState = {
            ...initialState,
            query: { ...initialState.query }
        };
        setState(clearedState);
        setGlobalState(clearedState);
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: "Geolocation is not supported by your browser." }));
            return;
        }
        setState(s => ({ ...s, isLoading: true, error: null }));
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationString = `${latitude},${longitude}`;
                setState(s => ({ ...s, query: { ...s.query, location: locationString }}));
                // Use a callback with setState to ensure the state is updated before searching
                setState(currentState => {
                    // Create a temporary query object to pass to fetchPrices
                    const searchQuery = { ...currentState.query, location: locationString };
                    fetchPrices(searchQuery)
                        .then(response => {
                             setState(s => ({ ...s, results: response.results, queryEcho: response.queryEcho, isLoading: false }));
                        })
                        .catch(err => {
                             setState(s => ({ ...s, error: err.message, isLoading: false }));
                        });
                    return currentState;
                });
            },
            () => {
                setState(s => ({ ...s, error: "Unable to retrieve your location. Please check your browser permissions.", isLoading: false }));
            }
        );
    };

    const handleBarcodeScan = (decodedText: string) => {
        setScannerOpen(false);
        setState(s => ({ ...s, query: { ...s.query, product: decodedText } }));
        // Using useEffect to trigger search after state update
    };
    
    useEffect(() => {
        if(isScannerOpen) return; // Don't search while scanner is active
        const shouldSearch = query.product.match(/^\d+$/); // Simple check if it's a barcode
        if (shouldSearch && query.location) {
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.product, query.location, isScannerOpen]);

    const subCategories = query.category ? Object.keys(CATEGORY_DATA[query.category as keyof typeof CATEGORY_DATA] || {}) : [];
    const varieties = (query.category && query.subCategory)
        ? CATEGORY_DATA[query.category as keyof typeof CATEGORY_DATA]?.[query.subCategory as keyof {}] || []
        : [];
        
    const sortedResults = useMemo(() => {
        const resultsCopy = [...results];
        return resultsCopy.sort((a, b) => {
            switch (sortOrder) {
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'distance':
                    const distA = parseFloat(a.distance || '9999');
                    const distB = parseFloat(b.distance || '9999');
                    return distA - distB;
                default:
                    return 0;
            }
        });
    }, [results, sortOrder]);


    return (
        <div className="space-y-8">
            {isScannerOpen && <BarcodeScannerModal onScanSuccess={handleBarcodeScan} onClose={() => setScannerOpen(false)} />}
            
            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Product Input */}
                <div className="md:col-span-2 lg:col-span-2">
                    <label htmlFor="product" className="block text-sm font-medium text-gray-300">Product Name or Barcode</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            name="product"
                            id="product"
                            value={query.product}
                            onChange={handleInputChange}
                            className="flex-1 block w-full min-w-0 rounded-none rounded-l-md bg-gray-700 border-gray-600 text-white sm:text-sm focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="e.g., Penfolds Bin 389"
                        />
                        <button onClick={() => setScannerOpen(true)} type="button" className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500">
                           <BarcodeIcon />
                        </button>
                    </div>
                </div>
                {/* Category Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4 md:col-span-2 lg:col-span-2 items-end">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
                        <select id="category" name="category" value={query.category} onChange={handleCategoryChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                            <option value="">Any</option>
                            {Object.keys(CATEGORY_DATA).map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subCategory" className="block text-sm font-medium text-gray-300">Sub-Category</label>
                        <select id="subCategory" name="subCategory" value={query.subCategory} onChange={handleSubCategoryChange} disabled={!subCategories.length} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md disabled:opacity-50">
                            <option value="">Any</option>
                            {subCategories.map(sub => <option key={sub}>{sub}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="variety" className="block text-sm font-medium text-gray-300">Variety</label>
                        <select id="variety" name="variety" value={query.variety} onChange={handleInputChange} disabled={!varieties.length} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md disabled:opacity-50">
                            <option value="">Any</option>
                            {varieties.map(v => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="packageSize" className="block text-sm font-medium text-gray-300">Package Size</label>
                        <select id="packageSize" name="packageSize" value={query.packageSize} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                            <option value="">Any</option>
                            {PACKAGE_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                 {/* Location & Radius */}
                <div className="md:col-span-2 lg:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-300">Suburb or Postcode/Zip</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" name="location" id="location" value={query.location} onChange={handleInputChange} className="flex-1 block w-full min-w-0 rounded-none rounded-l-md bg-gray-700 border-gray-600 text-white sm:text-sm focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Southport" />
                        <button onClick={handleUseMyLocation} type="button" className="inline-flex items-center px-3 border border-l-0 border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500">
                            <LocationIcon />
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="radius" className="block text-sm font-medium text-gray-300">Radius (km)</label>
                    <input type="number" name="radius" id="radius" value={query.radius} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
                </div>
                {/* Controls */}
                <div className="flex items-end space-x-2">
                    <button onClick={handleSearch} disabled={isLoading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50">
                        {isLoading ? 'Searching...' : 'Search Prices'}
                    </button>
                    <button onClick={handleClear} className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Clear
                    </button>
                </div>
            </div>

            {/* Results Display */}
            <div className="mt-8">
                {isLoading && <Spinner message="Scouting for the best prices..." />}
                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md">{error}</div>}
                
                {!isLoading && !error && results.length > 0 && (
                    <div>
                        {queryEcho && <p className="text-lg text-gray-400 mb-4">Showing results for <span className="font-semibold text-cyan-400">'{queryEcho.product}'</span> near <span className="font-semibold text-cyan-400">'{queryEcho.location}'</span>.</p>}
                        
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center space-x-2">
                                <SortIcon className="h-5 w-5 text-gray-400" />
                                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-gray-700 border-gray-600 text-white text-sm rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="distance">Distance</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedResults.map((item: PriceResult, index: number) => (
                                <div key={index} className="bg-gray-700/50 rounded-lg shadow-md p-5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{item.productName}</h3>
                                        <p className="text-3xl font-extrabold text-cyan-400 my-2">${item.price.toFixed(2)}</p>
                                        <p className="text-gray-400">{item.packSize}</p>
                                        <div className="mt-4 border-t border-gray-600 pt-4">
                                            <p className="font-semibold text-gray-200">{item.storeName}</p>
                                            <p className="text-gray-400">{item.address}</p>
                                            {item.distance && <p className="text-gray-400">~{item.distance} away</p>}
                                        </div>
                                    </div>
                                    <div className="mt-5 flex space-x-2 text-sm">
                                        {item.mapUrl && <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 px-3 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">View on Map</a>}
                                        {item.websiteUrl && <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 px-3 bg-cyan-600 hover:bg-cyan-700 rounded-md text-white transition-colors">Visit Website</a>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && !error && results.length === 0 && queryEcho && (
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-semibold text-gray-300">No Results Found</h3>
                        <p className="text-gray-400 mt-2">Try adjusting your search query or expanding the radius.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceScoutView;

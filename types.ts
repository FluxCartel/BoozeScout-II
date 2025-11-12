
import type { Html5QrcodeScanner } from 'html5-qrcode';

export interface PriceResult {
  productName: string;
  price: number;
  packSize: string;
  storeName: string;
  address: string;
  distance?: string;
  mapUrl?: string;
  websiteUrl?: string;
}

export interface QueryEcho {
  product: string;
  location: string;
}

export interface BoozeScoutResponse {
  results: PriceResult[];
  queryEcho: QueryEcho;
}

export interface SearchQuery {
  product: string;
  category: string;
  subCategory: string;
  variety: string;
  packageSize: string;
  location: string;
  radius: number;
}

export interface PriceScoutSearchState {
  results: PriceResult[];
  queryEcho: QueryEcho | null;
  isLoading: boolean;
  error: string | null;
  query: SearchQuery;
  searchTrigger: number; // Used to trigger search from external components
}

export const PriceScoutInitialState: PriceScoutSearchState = {
  results: [],
  queryEcho: null,
  isLoading: false,
  error: null,
  query: {
    product: '',
    category: '',
    subCategory: '',
    variety: '',
    packageSize: '',
    location: '',
    radius: 10,
  },
  searchTrigger: 0,
};

export interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export type Scanner = Html5QrcodeScanner;


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'model';
  isPlayingAudio?: boolean;
}

export interface LiveTranscriptEntry {
  id: string;
  text: string;
  sender: 'user' | 'model';
}

export type LiveAgentStatus = 'Idle' | 'Connecting' | 'Connected' | 'Error' | 'Processing';

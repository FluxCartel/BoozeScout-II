
import { GoogleGenAI, Type, FunctionDeclaration, Chat, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { SearchQuery, BoozeScoutResponse } from '../types';

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


export const fetchPrices = async (query: SearchQuery): Promise<BoozeScoutResponse> => {
    const aiClient = getAiClient();
    const { product, category, subCategory, variety, packageSize, location, radius } = query;

    const fullQuery = [
        product,
        packageSize,
        variety,
        subCategory,
        category,
    ].filter(Boolean).join(', ');

    const prompt = `Find the best prices for "${fullQuery}" available at bottle shops and liquor stores near "${location}" within a ${radius}km radius.`;

    const systemInstruction = `You are 'BoozeScout Agent', an AI expert at finding local beverage prices. Your task is to use Google Search and Google Maps to find real-world, current pricing and availability.
- Prioritize major, well-known liquor store chains but also include independent shops.
- You MUST return your findings as a single, clean JSON object. Do not include any markdown formatting (like \`\`\`json) or explanatory text outside of the JSON structure.
- If you cannot find any results, return a JSON object with an empty "results" array.
- The JSON object must conform to the following TypeScript interface:
interface PriceResult {
  productName: string; // Full product name including brand and vintage if applicable.
  price: number; // Price in local currency as a number (e.g., 45.99).
  packSize: string; // Package size (e.g., '700ml Bottle', '6 Pack 375ml Cans').
  storeName: string; // The name of the retail store.
  address: string; // The full street address of the store.
  distance?: string; // Optional. Estimated distance from the search location (e.g., '2.5 km').
  mapUrl?: string; // Optional. A direct Google Maps URL for the store's location.
  websiteUrl?: string; // Optional. A direct URL to the product page on the store's website.
}

interface QueryEcho {
  product: string; // The product name the AI interpreted from the user's query.
  location: string; // The location the AI interpreted from the user's query.
}

interface BoozeScoutResponse {
  results: PriceResult[];
  queryEcho: QueryEcho;
}`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
            toolConfig: location ? {
                retrievalConfig: {
                    // Dummy lat/lng, the model uses the location string primarily with Maps
                    latLng: { latitude: 0, longitude: 0 } 
                }
            } : undefined,
        },
    });
    
    try {
        const textResponse = response.text.trim();
        // The model might still wrap the JSON in markdown, so let's try to strip it.
        const jsonMatch = textResponse.match(/```(?:json)?\n([\s\S]*?)\n```/);
        const parsableText = jsonMatch ? jsonMatch[1] : textResponse;
        return JSON.parse(parsableText) as BoozeScoutResponse;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", e);
        console.error("Raw response text:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
};

export const getChatSession = (): Chat => {
    if(!chat){
        const aiClient = getAiClient();
        chat = aiClient.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a friendly and knowledgeable beverage assistant. You can recommend drinks, explain differences, suggest food pairings, and answer general questions about beer, wine, and spirits. Keep your answers concise and conversational.",
            },
        });
    }
    return chat;
};

export const streamChatMessage = async (message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const chatSession = getChatSession();
    return chatSession.sendMessageStream({ message });
}

export const textToSpeech = async (text: string): Promise<string> => {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say it clearly: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if(!base64Audio){
        throw new Error("No audio data returned from TTS API.");
    }
    return base64Audio;
};


const updateAndSearchPriceScout: FunctionDeclaration = {
    name: 'updateAndSearchPriceScout',
    parameters: {
      type: Type.OBJECT,
      description: 'Triggers a price search for a specific beverage product near a given location.',
      properties: {
        product: {
          type: Type.STRING,
          description:
            'The name of the beverage to search for. e.g., "Jameson Whiskey", "Penfolds Bin 389".',
        },
        location: {
          type: Type.STRING,
          description:
            'The suburb, postcode, city, or area to search within. e.g., "Southport", "Sydney CBD".',
        },
      },
      required: ['product', 'location'],
    },
};

export const liveAgentConnect = async (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => Promise<void>;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}) => {
    const aiClient = getAiClient();
    return aiClient.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [updateAndSearchPriceScout] }],
            systemInstruction: `You are a hands-free "Live Agent" for BoozeScout.
- Your primary goal is to help the user perform a price search by voice.
- Be conversational. Guide the user if they are unsure. For example, ask "What beverage are you looking for?" and then "And what location should I search near?".
- Once you have both the product and location, you MUST call the 'updateAndSearchPriceScout' function. Do not provide a verbal answer instead of calling the function.
- After calling the function, confirm to the user that you are starting the search, for example by saying "Okay, scouting for prices now."`,
        },
    });
};

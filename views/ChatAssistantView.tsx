
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamChatMessage, textToSpeech } from '../services/geminiService';
import { ChatMessage } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const SpeakerIcon: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isPlaying ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" />
        {isPlaying && <path d="M10 15a1 1 0 110-2 1 1 0 010 2z" />}
    </svg>
);

const ChatAssistantView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Fix for webkitAudioContext TypeScript error
    const [audioPlayer, setAudioPlayer] = useState<{ context: AudioContext, source: AudioBufferSourceNode | null }>({ context: new (window.AudioContext || (window as any).webkitAudioContext)(), source: null });
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages]);

    const stopCurrentAudio = useCallback(() => {
        if (audioPlayer.source) {
            audioPlayer.source.stop();
            audioPlayer.source.disconnect();
            setAudioPlayer(prev => ({ ...prev, source: null }));
            setPlayingMessageId(null);
        }
    }, [audioPlayer.source]);

    const handlePlayAudio = useCallback(async (message: ChatMessage) => {
        if (playingMessageId === message.id) {
            stopCurrentAudio();
            return;
        }
        
        stopCurrentAudio();
        setPlayingMessageId(message.id);

        try {
            const base64Audio = await textToSpeech(message.text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioPlayer.context, 24000, 1);
            
            const source = audioPlayer.context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioPlayer.context.destination);
            source.onended = () => {
                setPlayingMessageId(null);
                setAudioPlayer(prev => ({ ...prev, source: null }));
            };
            source.start();
            setAudioPlayer(prev => ({ ...prev, source }));

        } catch (error) {
            console.error("Error playing audio:", error);
            setPlayingMessageId(null);
        }
    }, [playingMessageId, stopCurrentAudio, audioPlayer.context]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const modelMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: modelMessageId, text: '', sender: 'model' }]);

        try {
            const stream = await streamChatMessage(input);
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: msg.text + chunkText } : msg
                ));
            }
        } catch (error) {
            console.error("Error streaming chat message:", error);
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, text: 'Sorry, I encountered an error.' } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh]">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'model' && (
                            <button onClick={() => handlePlayAudio(msg)} className="self-start p-1 rounded-full hover:bg-gray-600 transition-colors">
                                <SpeakerIcon isPlaying={playingMessageId === msg.id} />
                            </button>
                        )}
                        <div className={`max-w-xs md:max-w-md lg:max-w-xl px-4 py-2 rounded-2xl ${
                            msg.sender === 'user' 
                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                : 'bg-gray-700 text-gray-200 rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.text || '...'}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 bg-gray-700 border-gray-600 text-white rounded-full py-2 px-4 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-cyan-600 text-white p-2 rounded-full hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatAssistantView;


import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveAgentStatus, LiveTranscriptEntry } from '../types';
import { liveAgentConnect } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import type { LiveServerMessage } from '@google/genai';

interface LiveAgentViewProps {
  onSearchTrigger: (product: string, location: string) => void;
}

const LiveAgentView: React.FC<LiveAgentViewProps> = ({ onSearchTrigger }) => {
    const [status, setStatus] = useState<LiveAgentStatus>('Idle');
    const [transcripts, setTranscripts] = useState<LiveTranscriptEntry[]>([]);
    
    const sessionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopPlayback = useCallback(() => {
        if (outputAudioContextRef.current) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
            }
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    }, []);

    const cleanup = useCallback(() => {
        console.log('Cleaning up resources...');
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        stopPlayback();
        setStatus('Idle');
    }, [stopPlayback]);
    
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handleStart = async () => {
        if (status !== 'Idle' && status !== 'Error') return;

        setStatus('Connecting');
        setTranscripts([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const sessionPromise = liveAgentConnect({
                onopen: () => {
                    setStatus('Connected');
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContextRef.current.createMediaStreamSource(stream);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    }
                    
                    if (message.serverContent?.turnComplete) {
                        const fullInput = currentInputTranscriptionRef.current.trim();
                        const fullOutput = currentOutputTranscriptionRef.current.trim();
                        if (fullInput) setTranscripts(prev => [...prev, {id: `user-${Date.now()}`, text: fullInput, sender: 'user'}]);
                        if (fullOutput) setTranscripts(prev => [...prev, {id: `model-${Date.now()}`, text: fullOutput, sender: 'model'}]);
                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }

                    if (message.toolCall?.functionCalls) {
                        for(const fc of message.toolCall.functionCalls){
                            if(fc.name === 'updateAndSearchPriceScout'){
                                const { product, location } = fc.args;
                                onSearchTrigger(product, location);
                                sessionPromise.then(session => session.sendToolResponse({functionResponses: {id: fc.id, name: fc.name, response: {result: 'ok, search triggered'}}}));
                            }
                        }
                    }

                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        if (!outputAudioContextRef.current) {
                           outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        }
                        const ctx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e) => {
                    console.error('Live agent error:', e);
                    setStatus('Error');
                    cleanup();
                },
                onclose: () => {
                    cleanup();
                },
            });

            sessionRef.current = await sessionPromise;

        } catch (error) {
            console.error("Failed to start live agent:", error);
            setStatus('Error');
            cleanup();
        }
    };

    const handleStop = () => {
        cleanup();
    };
    
    const isSessionActive = status === 'Connecting' || status === 'Connected' || status === 'Processing';

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex space-x-4">
                <button
                    onClick={handleStart}
                    disabled={isSessionActive}
                    className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                >
                    Start Agent
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isSessionActive}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                >
                    Stop Agent
                </button>
            </div>
            
            <div className="flex items-center space-x-2 text-lg">
                <span className={`h-3 w-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                <span className="text-gray-300">Status: <span className="font-semibold">{status}</span></span>
            </div>

            <div className="w-full max-w-2xl h-64 bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-700">
                {transcripts.length === 0 && (
                    <p className="text-gray-500 text-center pt-20">Conversation transcript will appear here...</p>
                )}
                <div className="space-y-2">
                {transcripts.map(t => (
                    <div key={t.id} className={`text-sm ${t.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
                        <span className="font-bold capitalize">{t.sender}: </span>
                        <span>{t.text}</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};

export default LiveAgentView;

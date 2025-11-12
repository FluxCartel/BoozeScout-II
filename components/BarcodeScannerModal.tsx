
import React, { useEffect, useRef } from 'react';
import type { BarcodeScannerProps, Scanner } from '../types';

declare const Html5QrcodeScanner: any;

const BarcodeScannerModal: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Scanner | null>(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [0] // 0 for all supported types
            },
            false
        );
        scannerRef.current = scanner;

        const successCallback = (decodedText: string) => {
            onScanSuccess(decodedText);
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner.", error);
            });
        };

        const errorCallback = (errorMessage: string) => {
            // handle scan error
        };

        scanner.render(successCallback, errorCallback);
        
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner on unmount.", error);
                });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <h2 className="text-xl font-bold text-white mb-4">Scan Barcode</h2>
                <div id="reader" className="w-full"></div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;

// Inject Hedera provider into web pages
(() => {
    'use strict';

    class HederaProvider {
        constructor() {
            this.isHedera = true;
            this.isConnected = false;
            this.selectedAddress = null;
            this.networkVersion = 'testnet';
        }

        async request({ method, params = [] }) {
            return new Promise((resolve, reject) => {
                const id = Math.random().toString(36).substring(7);
                
                // Send message to content script
                window.postMessage({
                    type: 'HEDERA_PROVIDER_REQUEST',
                    id,
                    method,
                    params
                }, '*');

                // Listen for response
                const handler = (event) => {
                    if (event.data.type === 'HEDERA_PROVIDER_RESPONSE' && event.data.id === id) {
                        window.removeEventListener('message', handler);
                        
                        if (event.data.error) {
                            reject(new Error(event.data.error));
                        } else {
                            resolve(event.data.result);
                        }
                    }
                };
                
                window.addEventListener('message', handler);
            });
        }

        async connect() {
            try {
                const result = await this.request({ method: 'hedera_requestAccounts' });
                this.isConnected = true;
                this.selectedAddress = result[0];
                return result;
            } catch (error) {
                this.isConnected = false;
                throw error;
            }
        }

        async getAccountInfo() {
            return this.request({ method: 'hedera_getAccountInfo' });
        }

        async sendTransaction(transactionData) {
            return this.request({ 
                method: 'hedera_sendTransaction', 
                params: [transactionData] 
            });
        }

        async signMessage(message) {
            return this.request({ 
                method: 'hedera_signMessage', 
                params: [message] 
            });
        }

        // Event emitter functionality
        on(event, callback) {
            if (!this._events) this._events = {};
            if (!this._events[event]) this._events[event] = [];
            this._events[event].push(callback);
        }

        emit(event, data) {
            if (!this._events || !this._events[event]) return;
            this._events[event].forEach(callback => callback(data));
        }
    }

    // Create Hedera provider instance
    const hederaProvider = new HederaProvider();

    // Inject into window
    Object.defineProperty(window, 'hedera', {
        value: hederaProvider,
        writable: false,
        configurable: false
    });

    // Also provide as 'hederaWallet' for compatibility
    Object.defineProperty(window, 'hederaWallet', {
        value: hederaProvider,
        writable: false,
        configurable: false
    });

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('hederaWalletReady', {
        detail: hederaProvider
    }));

    console.log('Hedera Wallet Provider injected');
})();

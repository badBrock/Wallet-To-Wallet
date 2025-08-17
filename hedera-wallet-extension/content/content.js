// Content script to bridge between injected script and background
(() => {
    'use strict';

    // Listen for messages from injected script
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        if (event.data.type !== 'HEDERA_PROVIDER_REQUEST') return;

        const { id, method, params } = event.data;

        try {
            let result;

            switch (method) {
                case 'hedera_requestAccounts':
                    result = await requestAccounts();
                    break;
                
                case 'hedera_getAccountInfo':
                    result = await getAccountInfo();
                    break;
                
                case 'hedera_sendTransaction':
                    result = await sendTransaction(params[0]);
                    break;
                
                case 'hedera_signMessage':
                    result = await signMessage(params[0]);
                    break;
                
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }

            // Send success response
            window.postMessage({
                type: 'HEDERA_PROVIDER_RESPONSE',
                id,
                result
            }, '*');

        } catch (error) {
            // Send error response
            window.postMessage({
                type: 'HEDERA_PROVIDER_RESPONSE',
                id,
                error: error.message
            }, '*');
        }
    });

    async function requestAccounts() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'requestConnection',
                data: { origin: window.location.origin }
            }, (response) => {
                if (response.success) {
                    resolve([response.data.accountId]);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async function getAccountInfo() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'getAccountInfo'
            }, (response) => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async function sendTransaction(transactionData) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'signTransaction',
                data: transactionData
            }, (response) => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async function signMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'signMessage',
                data: { message }
            }, (response) => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }
})();

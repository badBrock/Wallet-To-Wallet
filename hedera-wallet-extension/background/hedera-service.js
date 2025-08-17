class HederaService {
    constructor() {
        this.currentNetwork = 'testnet';
        this.currentAccount = null;
        this.client = null;
    }

    async importWallet({ accountId, privateKey, password }) {
        try {
            // Encrypt and store private key
            const encryptedKey = await this.encryptPrivateKey(privateKey, password);
            
            // Store wallet data
            await this.storeWalletData({
                accountId,
                encryptedPrivateKey: encryptedKey,
                network: this.currentNetwork
            });

            // Initialize client
            await this.initializeClient(accountId, privateKey);

            return { success: true, data: { accountId } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async initializeClient(accountId, privateKey) {
        // Note: In browser extension, we'll use the Hedera REST API instead of SDK
        // due to browser limitations with the full SDK
        this.currentAccount = {
            accountId,
            privateKey // In production, keep this encrypted in memory
        };
    }

    async getAccountInfo() {
        if (!this.currentAccount) {
            const walletData = await this.getWalletData();
            if (!walletData) {
                return { success: false, error: 'No wallet found' };
            }
            this.currentAccount = walletData;
        }

        return { 
            success: true, 
            data: { 
                accountId: this.currentAccount.accountId,
                network: this.currentNetwork
            } 
        };
    }

    async getBalance() {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            // Use Hedera Mirror Node API
            const mirrorNodeUrl = this.currentNetwork === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : 'https://mainnet-public.mirrornode.hedera.com';

            const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${this.currentAccount.accountId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to fetch balance');

            const hbarBalance = (data.balance.balance / 100000000).toFixed(8); // Convert from tinybars to HBAR

            return { 
                success: true, 
                data: { 
                    hbars: hbarBalance,
                    tinybars: data.balance.balance
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTokens() {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            const mirrorNodeUrl = this.currentNetwork === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : 'https://mainnet-public.mirrornode.hedera.com';

            const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${this.currentAccount.accountId}/tokens`);
            const data = await response.json();

            if (!response.ok) throw new Error('Failed to fetch tokens');

            const tokens = data.tokens.map(token => ({
                tokenId: token.token_id,
                balance: token.balance,
                symbol: token.symbol || 'Unknown',
                name: token.name || 'Unknown Token'
            }));

            return { success: true, data: tokens };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTransactions() {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            const mirrorNodeUrl = this.currentNetwork === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : 'https://mainnet-public.mirrornode.hedera.com';

            const response = await fetch(`${mirrorNodeUrl}/api/v1/transactions?account.id=${this.currentAccount.accountId}&limit=10`);
            const data = await response.json();

            if (!response.ok) throw new Error('Failed to fetch transactions');

            const transactions = data.transactions.map(tx => ({
                transactionId: tx.transaction_id,
                type: tx.name,
                timestamp: tx.consensus_timestamp,
                result: tx.result,
                fee: tx.charged_tx_fee
            }));

            return { success: true, data: transactions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendTransaction({ recipientId, amount, asset, memo }) {
        try {
            // For browser extension, we need to use the Hedera REST API
            // or implement a lightweight transaction builder
            
            // This is a simplified example - in production you'd need to:
            // 1. Build the transaction properly
            // 2. Sign it with the private key
            // 3. Submit to the network
            
            // For now, return a mock success response
            return { 
                success: true, 
                data: { 
                    transactionId: `0.0.${Date.now()}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                    status: 'SUCCESS'
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async switchNetwork(network) {
        this.currentNetwork = network;
        
        // Update stored network preference
        const walletData = await this.getWalletData();
        if (walletData) {
            walletData.network = network;
            await this.storeWalletData(walletData);
        }

        return { success: true, data: { network } };
    }

    async encryptPrivateKey(privateKey, password) {
        // Simple encryption - in production use proper encryption
        const encoder = new TextEncoder();
        const data = encoder.encode(privateKey);
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password.padEnd(32, '0')),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    async storeWalletData(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ walletData: data }, resolve);
        });
    }

    async getWalletData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['walletData'], (result) => {
                resolve(result.walletData);
            });
        });
    }
}

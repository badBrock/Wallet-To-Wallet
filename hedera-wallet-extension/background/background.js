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

            // Initialize client with browser SDK
            await this.initializeClient(accountId, privateKey);

            return { success: true, data: { accountId } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async initializeClient(accountId, privateKey) {
        try {
            // Use browser-compatible SDK
            this.client = HederaBrowser.Client.forTestnet();
            const key = HederaBrowser.PrivateKey.fromStringECDSA(privateKey);
            this.client.setOperator(accountId, key);
            
            this.currentAccount = {
                accountId,
                privateKey
            };

            console.log('✅ Client initialized with browser SDK');
        } catch (error) {
            console.error('❌ Client initialization failed:', error);
            throw error;
        }
    }

    async getAccountInfo() {
        if (!this.currentAccount) {
            const walletData = await this.getWalletData();
            if (!walletData) {
                return { success: false, error: 'No wallet found' };
            }
            
            // Decrypt private key and initialize
            const decryptedKey = await this.decryptPrivateKey(walletData.encryptedPrivateKey, 'user_password');
            await this.initializeClient(walletData.accountId, decryptedKey);
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

            // Use browser SDK for balance query
            const balanceQuery = new HederaBrowser.AccountBalanceQuery()
                .setAccountId(this.currentAccount.accountId);
            
            const balance = await balanceQuery.execute(this.client);
            
            return { 
                success: true, 
                data: { 
                    hbars: balance.hbars.toString(),
                    tinybars: balance.hbars.toTinybars()
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTokens() {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            // Use Mirror Node API for tokens
            const mirrorNodeUrl = this.currentNetwork === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : 'https://mainnet-public.mirrornode.hedera.com';

            const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${this.currentAccount.accountId}/tokens`);
            
            if (!response.ok) {
                // If no tokens found, return empty array
                if (response.status === 404) {
                    return { success: true, data: [] };
                }
                throw new Error('Failed to fetch tokens');
            }

            const data = await response.json();
            const tokens = data.tokens ? data.tokens.map(token => ({
                tokenId: token.token_id,
                balance: token.balance,
                symbol: token.symbol || 'Unknown',
                name: token.name || 'Unknown Token'
            })) : [];

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
            
            if (!response.ok) {
                if (response.status === 404) {
                    return { success: true, data: [] };
                }
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            const transactions = data.transactions ? data.transactions.map(tx => ({
                transactionId: tx.transaction_id,
                type: tx.name,
                timestamp: tx.consensus_timestamp,
                result: tx.result,
                fee: tx.charged_tx_fee
            })) : [];

            return { success: true, data: transactions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendTransaction({ recipientId, amount, asset, memo }) {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            // Use browser SDK for transaction
            const transferTx = new HederaBrowser.TransferTransaction();

            if (asset === 'HBAR') {
                // HBAR transfer
                const hbarAmount = new HederaBrowser.Hbar(amount);
                transferTx
                    .addHbarTransfer(this.currentAccount.accountId, hbarAmount.negated())
                    .addHbarTransfer(recipientId, hbarAmount);
            } else {
                // Token transfer
                transferTx
                    .addTokenTransfer(asset, this.currentAccount.accountId, -amount)
                    .addTokenTransfer(asset, recipientId, amount);
            }

            if (memo) {
                transferTx.setTransactionMemo(memo);
            }

            // Execute transaction
            const privateKey = HederaBrowser.PrivateKey.fromStringECDSA(this.currentAccount.privateKey);
            const frozenTx = transferTx.freezeWith(this.client);
            const signedTx = await frozenTx.sign(privateKey);
            const txResponse = await signedTx.execute(this.client);
            const receipt = await txResponse.getReceipt();

            return { 
                success: true, 
                data: { 
                    transactionId: txResponse.transactionId,
                    status: receipt.status
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createToken({ tokenName, tokenSymbol, decimals, initialSupply }) {
        try {
            if (!this.currentAccount) throw new Error('No account connected');

            // Use browser SDK for token creation
            const privateKey = HederaBrowser.PrivateKey.fromStringECDSA(this.currentAccount.privateKey);
            
            const tokenTx = new HederaBrowser.TokenCreateTransaction()
                .setTokenName(tokenName)
                .setTokenSymbol(tokenSymbol)
                .setDecimals(decimals)
                .setInitialSupply(initialSupply)
                .setTreasuryAccountId(this.currentAccount.accountId)
                .setAdminKey(privateKey.publicKey)
                .setSupplyKey(privateKey.publicKey);

            const frozenTx = tokenTx.freezeWith(this.client);
            const signedTx = await frozenTx.sign(privateKey);
            const txResponse = await signedTx.execute(this.client);
            const receipt = await txResponse.getReceipt();

            return { 
                success: true, 
                data: { 
                    tokenId: receipt.tokenId,
                    status: receipt.status,
                    transactionId: txResponse.transactionId
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async switchNetwork(network) {
        this.currentNetwork = network;
        
        // Reinitialize client with new network
        if (this.currentAccount) {
            this.client = network === 'testnet' 
                ? HederaBrowser.Client.forTestnet()
                : HederaBrowser.Client.forMainnet();
                
            const key = HederaBrowser.PrivateKey.fromStringECDSA(this.currentAccount.privateKey);
            this.client.setOperator(this.currentAccount.accountId, key);
        }
        
        // Update stored network preference
        const walletData = await this.getWalletData();
        if (walletData) {
            walletData.network = network;
            await this.storeWalletData(walletData);
        }

        return { success: true, data: { network } };
    }

    // Encryption/Storage helper methods
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

    async decryptPrivateKey(encryptedData, password) {
        // Decrypt private key
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        const key = await crypto.subtle.importKey(
            'raw', 
            encoder.encode(password.padEnd(32, '0')),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            key,
            new Uint8Array(encryptedData.encrypted)
        );
        
        return decoder.decode(decrypted);
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

// Make sure it's available to background script
if (typeof self !== 'undefined') {
    self.HederaService = HederaService;
}

const hederaService = new HederaService();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, data } = request;

    if (hederaService[action]) {
        hederaService[action](data)
            .then(sendResponse)
            .catch(error => sendResponse({ success: false, error: error.message }));
    } else {
        sendResponse({ success: false, error: 'Invalid action' });
    }

    return true; // Indicates that the response is sent asynchronously
});
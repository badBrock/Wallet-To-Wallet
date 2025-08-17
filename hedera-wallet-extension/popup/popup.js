class HederaWalletPopup {
    constructor() {
        this.currentAccount = null;
        this.currentNetwork = 'testnet';
        this.isLocked = false;
        
        this.init();
    }

    async init() {
        // Check if wallet is set up
        const isSetup = await this.checkWalletSetup();
        
        if (!isSetup) {
            this.showSetupScreen();
        } else {
            await this.loadWalletData();
            this.setupEventListeners();
            this.setupTabNavigation();
        }
    }

    async checkWalletSetup() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['walletSetup'], (result) => {
                resolve(result.walletSetup || false);
            });
        });
    }

    showSetupScreen() {
        document.getElementById('setupScreen').classList.remove('hidden');
        document.querySelector('.wallet-container > *:not(#setupScreen)').style.display = 'none';
        
        // Setup screen event listeners
        document.getElementById('importWalletBtn').addEventListener('click', () => {
            this.showImportModal();
        });
        
        document.getElementById('createWalletBtn').addEventListener('click', () => {
            this.createNewWallet();
        });
    }

    showImportModal() {
        document.getElementById('importModal').classList.remove('hidden');
        
        document.getElementById('importForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.importWallet();
        });
        
        document.getElementById('cancelImport').addEventListener('click', () => {
            document.getElementById('importModal').classList.add('hidden');
        });
    }

    async importWallet() {
        const accountId = document.getElementById('importAccountId').value;
        const privateKey = document.getElementById('importPrivateKey').value;
        const password = document.getElementById('walletPassword').value;

        try {
            // Validate account ID and private key format
            if (!this.validateAccountId(accountId)) {
                throw new Error('Invalid Account ID format');
            }

            if (!this.validatePrivateKey(privateKey)) {
                throw new Error('Invalid Private Key format');
            }

            // Send to background script for processing
            const response = await this.sendMessage({
                action: 'importWallet',
                data: { accountId, privateKey, password }
            });

            if (response.success) {
                // Save wallet setup flag
                chrome.storage.local.set({ walletSetup: true });
                
                // Hide modals and setup screen
                document.getElementById('importModal').classList.add('hidden');
                document.getElementById('setupScreen').classList.add('hidden');
                
                // Show main interface
                document.querySelector('.wallet-container > *:not(#setupScreen)').style.display = '';
                
                await this.loadWalletData();
                this.setupEventListeners();
                this.setupTabNavigation();
                
                this.showNotification('Wallet imported successfully!', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Import failed: ${error.message}`, 'error');
        }
    }

    async loadWalletData() {
        try {
            // Get account info from background script
            const accountInfo = await this.sendMessage({ action: 'getAccountInfo' });
            
            if (accountInfo.success) {
                this.currentAccount = accountInfo.data;
                this.updateUI();
                await this.loadBalances();
                await this.loadTokens();
                await this.loadRecentTransactions();
            }
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    }

    updateUI() {
        if (this.currentAccount) {
            document.getElementById('accountId').textContent = this.currentAccount.accountId;
            document.getElementById('networkName').textContent = 
                this.currentNetwork.charAt(0).toUpperCase() + this.currentNetwork.slice(1);
        }
    }

    async loadBalances() {
        try {
            const balanceInfo = await this.sendMessage({ action: 'getBalance' });
            
            if (balanceInfo.success) {
                const hbarBalance = balanceInfo.data.hbars;
                document.getElementById('hbarBalance').textContent = hbarBalance;
                document.getElementById('mainBalance').textContent = `${hbarBalance} HBAR`;
                
                // Update USD value (you can integrate with price API)
                const usdValue = await this.getHbarUsdValue(hbarBalance);
                document.getElementById('balanceUsd').textContent = `$${usdValue.toFixed(2)} USD`;
            }
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    }

    async loadTokens() {
        try {
            const tokenInfo = await this.sendMessage({ action: 'getTokens' });
            
            if (tokenInfo.success) {
                const tokenList = document.getElementById('tokenList');
                tokenList.innerHTML = '';
                
                if (tokenInfo.data.length === 0) {
                    tokenList.innerHTML = '<div class="loading">No tokens found</div>';
                    return;
                }
                
                tokenInfo.data.forEach(token => {
                    const tokenElement = this.createTokenElement(token);
                    tokenList.appendChild(tokenElement);
                });
                
                // Update send form asset options
                this.updateSendAssetOptions(tokenInfo.data);
            }
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
    }

    createTokenElement(token) {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.innerHTML = `
            <div class="token-info">
                <div>
                    <div class="token-symbol">${token.symbol}</div>
                    <div class="token-name">${token.name}</div>
                </div>
            </div>
            <div class="token-balance">
                <div>${token.balance}</div>
                <div class="token-id">${token.tokenId}</div>
            </div>
        `;
        return div;
    }

    async loadRecentTransactions() {
        try {
            const transactionInfo = await this.sendMessage({ action: 'getTransactions' });
            
            if (transactionInfo.success) {
                const transactionList = document.getElementById('transactionList');
                transactionList.innerHTML = '';
                
                if (transactionInfo.data.length === 0) {
                    transactionList.innerHTML = '<div class="no-transactions">No recent transactions</div>';
                    return;
                }
                
                transactionInfo.data.slice(0, 5).forEach(tx => {
                    const txElement = this.createTransactionElement(tx);
                    transactionList.appendChild(txElement);
                });
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Send form
        document.getElementById('sendForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSendTransaction();
        });
        
        // Copy account ID
        document.getElementById('copyAccountId').addEventListener('click', () => {
            this.copyToClipboard(this.currentAccount.accountId);
        });
        
        // Receive button
        document.getElementById('receiveBtn').addEventListener('click', () => {
            this.showReceiveModal();
        });
        
        // Network selector
        document.getElementById('networkSelect').addEventListener('change', (e) => {
            this.switchNetwork(e.target.value);
        });
        
        // Lock wallet
        document.getElementById('lockWalletBtn').addEventListener('click', () => {
            this.lockWallet();
        });

        // Token creation
        document.getElementById('createTokenBtn').addEventListener('click', () => {
            document.getElementById('createTokenModal').classList.remove('hidden');
        });

        document.getElementById('cancelCreateToken').addEventListener('click', () => {
            document.getElementById('createTokenModal').classList.add('hidden');
        });

        document.getElementById('createTokenForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateToken();
        });
    }

    async handleSendTransaction() {
        const recipientId = document.getElementById('recipientId').value;
        const amount = document.getElementById('sendAmount').value;
        const asset = document.getElementById('sendAsset').value;
        const memo = document.getElementById('sendMemo').value;

        try {
            if (!this.validateAccountId(recipientId)) {
                throw new Error('Invalid recipient Account ID');
            }

            if (!amount || parseFloat(amount) <= 0) {
                throw new Error('Invalid amount');
            }

            // Show loading state
            const submitBtn = document.querySelector('#sendForm .submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            this.showProgressBar('Sending transaction...');

            // Send transaction request to background script
            const response = await this.sendMessage({
                action: 'sendTransaction',
                data: {
                    recipientId,
                    amount: parseFloat(amount),
                    asset,
                    memo
                }
            });

            if (response.success) {
                this.showNotification('Transaction sent successfully!', 'success');
                
                // Clear form
                document.getElementById('sendForm').reset();
                
                // Refresh balances
                await this.loadBalances();
                await this.loadRecentTransactions();
                
                // Switch to overview tab
                document.querySelector('[data-tab="overview"]').click();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Transaction failed: ${error.message}`, 'error');
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('#sendForm .submit-btn');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            this.hideProgressBar();
        }
    }

    async handleCreateToken() {
        const tokenName = document.getElementById('tokenName').value;
        const tokenSymbol = document.getElementById('tokenSymbol').value;
        const initialSupply = document.getElementById('initialSupply').value;
        const decimals = document.getElementById('decimals').value;

        try {
            if (!tokenName || !tokenSymbol || !initialSupply) {
                throw new Error('Please fill out all fields');
            }

            this.showProgressBar('Creating token...');

            const response = await this.sendMessage({
                action: 'createToken',
                data: {
                    tokenName,
                    tokenSymbol,
                    initialSupply: parseInt(initialSupply),
                    decimals: parseInt(decimals)
                }
            });

            if (response.success) {
                this.showNotification('Token created successfully!', 'success');
                document.getElementById('createTokenModal').classList.add('hidden');
                document.getElementById('createTokenForm').reset();
                await this.loadTokens();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Token creation failed: ${error.message}`, 'error');
        } finally {
            this.hideProgressBar();
        }
    }

    async sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        this.showNotification('Copied to clipboard!', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease-out'
        });
        
        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#ff9800'
        };
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showProgressBar(message) {
        document.getElementById('progressBar').classList.remove('hidden');
        document.getElementById('progressLabel').textContent = message;
        document.getElementById('progressBarFill').style.width = '50%'; // Indeterminate progress
    }

    hideProgressBar() {
        document.getElementById('progressBar').classList.add('hidden');
    }

    updateProgressBar(percent) {
        document.getElementById('progressBarFill').style.width = `${percent}%`;
    }

    validateAccountId(accountId) {
        // Hedera account ID format: shard.realm.account (e.g., 0.0.123456)
        return /^\d+\.\d+\.\d+$/.test(accountId);
    }

    validatePrivateKey(privateKey) {
        // Basic validation for hex private key (64 characters)
        return /^[a-fA-F0-9]{64}$/.test(privateKey);
    }

    async getHbarUsdValue(hbarAmount) {
        // Placeholder - integrate with actual price API
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd');
            const data = await response.json();
            const hbarPrice = data['hedera-hashgraph'].usd;
            return parseFloat(hbarAmount) * hbarPrice;
        } catch (error) {
            return 0;
        }
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HederaWalletPopup();
});

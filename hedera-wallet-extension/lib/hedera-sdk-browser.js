/**
 * Hedera SDK Browser - Simplified browser-compatible version
 * For Chrome Extension use
 */

class HederaBrowser {
    constructor() {
        this.networks = {
            testnet: {
                url: 'https://testnet.mirrornode.hedera.com',
                nodes: ['0.testnet.hedera.com:50211']
            },
            mainnet: {
                url: 'https://mainnet-public.mirrornode.hedera.com',
                nodes: ['mainnet-public.mirrornode.hedera.com:443']
            }
        };
    }

    // Client class for browser
    static Client = class {
        constructor(network = 'testnet') {
            this.network = network;
            this.operatorAccountId = null;
            this.operatorPrivateKey = null;
            this.mirrorNodeUrl = network === 'testnet' 
                ? 'https://testnet.mirrornode.hedera.com'
                : 'https://mainnet-public.mirrornode.hedera.com';
        }

        static forTestnet() {
            return new HederaBrowser.Client('testnet');
        }

        static forMainnet() {
            return new HederaBrowser.Client('mainnet');
        }

        setOperator(accountId, privateKey) {
            this.operatorAccountId = typeof accountId === 'string' ? accountId : accountId.toString();
            this.operatorPrivateKey = typeof privateKey === 'string' ? privateKey : privateKey;
            return this;
        }

        setNetworkUpdatePeriod(period) {
            // Browser implementation - store period
            this.networkUpdatePeriod = period;
            return this;
        }
    };

    // AccountId class for browser
    static AccountId = class {
        constructor(shard, realm, num) {
            this.shard = shard || 0;
            this.realm = realm || 0;
            this.num = num || 0;
        }

        static fromString(id) {
            const parts = id.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid AccountId format. Expected: shard.realm.num');
            }
            return new HederaBrowser.AccountId(
                parseInt(parts[0]),
                parseInt(parts[1]),
                parseInt(parts[2])
            );
        }

        toString() {
            return `${this.shard}.${this.realm}.${this.num}`;
        }
    };

    // PrivateKey class for browser
    static PrivateKey = class {
        constructor(keyString, keyType = 'ECDSA') {
            this.keyString = keyString;
            this.keyType = keyType;
        }

        static fromStringECDSA(keyString) {
            if (!keyString || keyString.length !== 64) {
                throw new Error('Invalid ECDSA private key format');
            }
            return new HederaBrowser.PrivateKey(keyString, 'ECDSA');
        }

        static fromStringED25519(keyString) {
            if (!keyString || keyString.length !== 64) {
                throw new Error('Invalid ED25519 private key format');
            }
            return new HederaBrowser.PrivateKey(keyString, 'ED25519');
        }

        static fromStringDer(derString) {
            // Remove DER prefix if present
            const prefix = "302e020100300506032b657004220420";
            const cleanKey = derString.startsWith(prefix) 
                ? derString.substring(prefix.length)
                : derString;
            return new HederaBrowser.PrivateKey(cleanKey, 'ED25519');
        }

        get publicKey() {
            return new HederaBrowser.PublicKey(this.keyString, this.keyType);
        }

        toString() {
            return this.keyString;
        }

        toStringRaw() {
            return this.keyString;
        }

        // Simplified signing - in production, use proper crypto library
        async sign(data) {
            // This is a simplified implementation
            // In production, you'd use WebCrypto API or a crypto library
            return {
                signature: this.keyString.substring(0, 32), // Mock signature
                publicKey: this.publicKey
            };
        }
    };

    // PublicKey class for browser
    static PublicKey = class {
        constructor(keyString, keyType = 'ECDSA') {
            this.keyString = keyString;
            this.keyType = keyType;
        }

        toString() {
            // Generate a mock public key format
            return `302d300706052b8104000a032200${this.keyString.substring(0, 32)}`;
        }
    };

    // Hbar class for browser
    static Hbar = class {
        constructor(amount) {
            this.amount = parseFloat(amount) || 0;
        }

        static fromTinybars(tinybars) {
            return new HederaBrowser.Hbar(tinybars / 100000000);
        }

        static from(amount) {
            return new HederaBrowser.Hbar(amount);
        }

        toString() {
            return `${this.amount.toFixed(8)} ℏ`;
        }

        toTinybars() {
            return Math.floor(this.amount * 100000000);
        }

        negated() {
            return new HederaBrowser.Hbar(-this.amount);
        }
    };

    // AccountBalanceQuery class for browser
    static AccountBalanceQuery = class {
        constructor() {
            this.accountId = null;
        }

        setAccountId(accountId) {
            this.accountId = typeof accountId === 'string' ? accountId : accountId.toString();
            return this;
        }

        async execute(client) {
            try {
                const response = await fetch(`${client.mirrorNodeUrl}/api/v1/accounts/${this.accountId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch balance');
                }

                const hbarBalance = new HederaBrowser.Hbar(data.balance.balance / 100000000);
                
                // Mock tokens - in production, fetch from mirror node
                const tokens = new Map();
                
                return {
                    hbars: hbarBalance,
                    tokens: tokens,
                    accountId: this.accountId
                };
            } catch (error) {
                throw new Error(`Balance query failed: ${error.message}`);
            }
        }
    };

    // TransferTransaction class for browser
    static TransferTransaction = class {
        constructor() {
            this.hbarTransfers = [];
            this.tokenTransfers = [];
            this.maxTransactionFee = new HederaBrowser.Hbar(1);
            this.memo = '';
        }

        addHbarTransfer(accountId, amount) {
            const id = typeof accountId === 'string' ? accountId : accountId.toString();
            const hbarAmount = amount instanceof HederaBrowser.Hbar ? amount : new HederaBrowser.Hbar(amount);
            
            this.hbarTransfers.push({
                accountId: id,
                amount: hbarAmount
            });
            return this;
        }

        addTokenTransfer(tokenId, accountId, amount) {
            const id = typeof accountId === 'string' ? accountId : accountId.toString();
            
            this.tokenTransfers.push({
                tokenId: tokenId,
                accountId: id,
                amount: amount
            });
            return this;
        }

        setMaxTransactionFee(fee) {
            this.maxTransactionFee = fee instanceof HederaBrowser.Hbar ? fee : new HederaBrowser.Hbar(fee);
            return this;
        }

        setTransactionMemo(memo) {
            this.memo = memo;
            return this;
        }

        freezeWith(client) {
            this.client = client;
            this.isFrozen = true;
            return this;
        }

        async sign(privateKey) {
            if (!this.isFrozen) {
                throw new Error('Transaction must be frozen before signing');
            }
            
            this.signatures = this.signatures || [];
            const signature = await privateKey.sign(JSON.stringify(this.hbarTransfers));
            this.signatures.push(signature);
            return this;
        }

        async execute(client) {
            // For browser extension, we'll simulate the transaction
            // In production, you'd need to implement proper transaction submission
            
            return {
                transactionId: `${client.operatorAccountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };

    // TokenCreateTransaction class for browser
    static TokenCreateTransaction = class {
        constructor() {
            this.tokenName = '';
            this.tokenSymbol = '';
            this.decimals = 0;
            this.initialSupply = 0;
            this.treasuryAccountId = null;
            this.adminKey = null;
            this.supplyKey = null;
            this.maxTransactionFee = new HederaBrowser.Hbar(30);
        }

        setTokenName(name) {
            this.tokenName = name;
            return this;
        }

        setTokenSymbol(symbol) {
            this.tokenSymbol = symbol;
            return this;
        }

        setDecimals(decimals) {
            this.decimals = decimals;
            return this;
        }

        setInitialSupply(supply) {
            this.initialSupply = supply;
            return this;
        }

        setTreasuryAccountId(accountId) {
            this.treasuryAccountId = typeof accountId === 'string' ? accountId : accountId.toString();
            return this;
        }

        setAdminKey(key) {
            this.adminKey = key;
            return this;
        }

        setSupplyKey(key) {
            this.supplyKey = key;
            return this;
        }

        setMaxTransactionFee(fee) {
            this.maxTransactionFee = fee instanceof HederaBrowser.Hbar ? fee : new HederaBrowser.Hbar(fee);
            return this;
        }

        freezeWith(client) {
            this.client = client;
            this.isFrozen = true;
            return this;
        }

        async sign(privateKey) {
            if (!this.isFrozen) {
                throw new Error('Transaction must be frozen before signing');
            }
            
            this.signatures = this.signatures || [];
            const signature = await privateKey.sign(this.tokenName + this.tokenSymbol);
            this.signatures.push(signature);
            return this;
        }

        async execute(client) {
            // Simulate token creation for browser
            const tokenId = `0.0.${Date.now().toString().substring(5)}`;
            
            return {
                transactionId: `${client.operatorAccountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        tokenId: tokenId,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };

    // TokenAssociateTransaction class for browser
    static TokenAssociateTransaction = class {
        constructor() {
            this.accountId = null;
            this.tokenIds = [];
        }

        setAccountId(accountId) {
            this.accountId = typeof accountId === 'string' ? accountId : accountId.toString();
            return this;
        }

        setTokenIds(tokenIds) {
            this.tokenIds = tokenIds;
            return this;
        }

        freezeWith(client) {
            this.client = client;
            this.isFrozen = true;
            return this;
        }

        async sign(privateKey) {
            if (!this.isFrozen) {
                throw new Error('Transaction must be frozen before signing');
            }
            
            this.signatures = this.signatures || [];
            const signature = await privateKey.sign(this.accountId + this.tokenIds.join(','));
            this.signatures.push(signature);
            return this;
        }

        async execute(client) {
            return {
                transactionId: `${this.accountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };

    // Status enum for browser
    static Status = {
        SUCCESS: 'SUCCESS',
        FAIL: 'FAIL',
        INVALID_SIGNATURE: 'INVALID_SIGNATURE',
        INVALID_ACCOUNT_ID: 'INVALID_ACCOUNT_ID'
    };

    // ContractCreateTransaction class for browser
    static ContractCreateTransaction = class {
        constructor() {
            this.bytecodeFileId = null;
            this.gas = 100000;
            this.maxTransactionFee = new HederaBrowser.Hbar(10);
        }

        setBytecodeFileId(fileId) {
            this.bytecodeFileId = fileId;
            return this;
        }

        setGas(gas) {
            this.gas = gas;
            return this;
        }

        setMaxTransactionFee(fee) {
            this.maxTransactionFee = fee instanceof HederaBrowser.Hbar ? fee : new HederaBrowser.Hbar(fee);
            return this;
        }

        async execute(client) {
            const contractId = `0.0.${Date.now().toString().substring(5)}`;
            
            return {
                transactionId: `${client.operatorAccountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        contractId: contractId,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };

    // ContractCallQuery class for browser
    static ContractCallQuery = class {
        constructor() {
            this.contractId = null;
            this.gas = 100000;
            this.functionName = '';
            this.functionParams = [];
        }

        setContractId(contractId) {
            this.contractId = contractId;
            return this;
        }

        setGas(gas) {
            this.gas = gas;
            return this;
        }

        setFunction(functionName, params = []) {
            this.functionName = functionName;
            this.functionParams = params;
            return this;
        }

        async execute(client) {
            // Mock contract call result
            return {
                getUint256: (index) => this.functionParams[index] || 0,
                getString: (index) => this.functionParams[index] || '',
                getBool: (index) => this.functionParams[index] || false
            };
        }
    };

    // ContractExecuteTransaction class for browser
    static ContractExecuteTransaction = class {
        constructor() {
            this.contractId = null;
            this.gas = 100000;
            this.functionName = '';
            this.functionParams = [];
            this.maxTransactionFee = new HederaBrowser.Hbar(2);
        }

        setContractId(contractId) {
            this.contractId = contractId;
            return this;
        }

        setGas(gas) {
            this.gas = gas;
            return this;
        }

        setFunction(functionName, params = []) {
            this.functionName = functionName;
            this.functionParams = params;
            return this;
        }

        setMaxTransactionFee(fee) {
            this.maxTransactionFee = fee instanceof HederaBrowser.Hbar ? fee : new HederaBrowser.Hbar(fee);
            return this;
        }

        async execute(client) {
            return {
                transactionId: `${client.operatorAccountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };

    // FileCreateTransaction class for browser
    static FileCreateTransaction = class {
        constructor() {
            this.contents = '';
            this.maxTransactionFee = new HederaBrowser.Hbar(5);
        }

        setContents(contents) {
            this.contents = contents;
            return this;
        }

        setMaxTransactionFee(fee) {
            this.maxTransactionFee = fee instanceof HederaBrowser.Hbar ? fee : new HederaBrowser.Hbar(fee);
            return this;
        }

        async execute(client) {
            const fileId = `0.0.${Date.now().toString().substring(5)}`;
            
            return {
                transactionId: `${client.operatorAccountId}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
                getReceipt: async () => {
                    return {
                        status: HederaBrowser.Status.SUCCESS,
                        fileId: fileId,
                        transactionId: this.transactionId
                    };
                }
            };
        }
    };
}

// Export all classes for browser use
if (typeof window !== 'undefined') {
    // Browser environment
    window.Client = HederaBrowser.Client;
    window.AccountId = HederaBrowser.AccountId;
    window.PrivateKey = HederaBrowser.PrivateKey;
    window.PublicKey = HederaBrowser.PublicKey;
    window.Hbar = HederaBrowser.Hbar;
    window.AccountBalanceQuery = HederaBrowser.AccountBalanceQuery;
    window.TransferTransaction = HederaBrowser.TransferTransaction;
    window.TokenCreateTransaction = HederaBrowser.TokenCreateTransaction;
    window.TokenAssociateTransaction = HederaBrowser.TokenAssociateTransaction;
    window.ContractCreateTransaction = HederaBrowser.ContractCreateTransaction;
    window.ContractCallQuery = HederaBrowser.ContractCallQuery;
    window.ContractExecuteTransaction = HederaBrowser.ContractExecuteTransaction;
    window.FileCreateTransaction = HederaBrowser.FileCreateTransaction;
    window.Status = HederaBrowser.Status;
}

// For Chrome extension
if (typeof chrome !== 'undefined' && chrome.extension) {
    // Make available to extension
    self.HederaBrowser = HederaBrowser;
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HederaBrowser;
}

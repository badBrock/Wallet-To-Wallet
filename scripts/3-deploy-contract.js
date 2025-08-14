const { 
    Client, 
    ContractCreateTransaction,
    FileCreateTransaction,
    Hbar 
} = require("@hashgraph/sdk");
const { getAccountDetails, logTransaction } = require("./utils");
const solc = require("solc");
const fs = require("fs");

require("dotenv").config();

async function deployContract() {
    try {
        const client = Client.forTestnet();
        const { accountId: operatorId, privateKey: operatorKey } = getAccountDetails('operator');
        client.setOperator(operatorId, operatorKey);

        console.log("✅ Client setup successful!");

        // Compile Solidity contract
        console.log("🔨 Compiling Solidity contract...");
        const contractSource = fs.readFileSync("contracts/SimpleStorage.sol", "utf8");
        
        const input = {
            language: 'Solidity',
            sources: {
                'SimpleStorage.sol': {
                    content: contractSource
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
        const contract = compiled.contracts['SimpleStorage.sol']['SimpleStorage'];
        const bytecode = contract.evm.bytecode.object;

        console.log("✅ Contract compiled successfully!");

        // Upload bytecode to Hedera File Service
        console.log("📤 Uploading bytecode to Hedera File Service...");
        const fileCreateTx = new FileCreateTransaction()
            .setContents(bytecode)
            .setMaxTransactionFee(new Hbar(5));

        const fileResponse = await fileCreateTx.execute(client);
        const fileReceipt = await fileResponse.getReceipt(client);
        const fileId = fileReceipt.fileId;

        logTransaction("File Upload", fileResponse.transactionId.toString(), fileReceipt.status.toString(), `File ID: ${fileId}`);

        // Deploy contract
        console.log("🚀 Deploying smart contract...");
        const contractCreateTx = new ContractCreateTransaction()
            .setBytecodeFileId(fileId)
            .setGas(100000)
            .setMaxTransactionFee(new Hbar(10));

        const contractResponse = await contractCreateTx.execute(client);
        const contractReceipt = await contractResponse.getReceipt(client);
        const contractId = contractReceipt.contractId;

        logTransaction("Contract Deployment", contractResponse.transactionId.toString(), contractReceipt.status.toString(), `Contract ID: ${contractId}`);

        // Update .env file with contract ID
        const envContent = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envContent.replace(/CONTRACT_ID=.*/, `CONTRACT_ID=${contractId}`);
        fs.writeFileSync('.env', updatedEnv);

        console.log("🎉 Smart contract deployed successfully!");
        console.log(`📋 Contract ID: ${contractId}`);
        console.log("💡 Contract ID has been saved to your .env file");

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.message.includes('compilation')) {
            console.log("💡 Make sure your Solidity contract syntax is correct");
        }
    }
}

deployContract();

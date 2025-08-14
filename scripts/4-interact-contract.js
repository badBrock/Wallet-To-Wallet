const { 
    Client, 
    ContractCallQuery,
    ContractExecuteTransaction,
    Hbar 
} = require("@hashgraph/sdk");
const { getAccountDetails, logTransaction } = require("./utils");

require("dotenv").config();

async function interactWithContract() {
    try {
        const client = Client.forTestnet();
        const { accountId: operatorId, privateKey: operatorKey } = getAccountDetails('operator');
        client.setOperator(operatorId, operatorKey);

        const contractId = process.env.CONTRACT_ID;
        
        if (!contractId) {
            throw new Error("CONTRACT_ID not found in .env file. Deploy contract first!");
        }

        console.log("✅ Client setup successful!");
        console.log(`📋 Using Contract ID: ${contractId}`);

        // Function 1: Read initial value
        console.log("\n📖 Reading initial stored value...");
        const getQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("get");

        const getResult = await getQuery.execute(client);
        const initialValue = getResult.getUint256(0);
        console.log(`Initial stored value: ${initialValue}`);

        // Function 2: Set a new value
        const newValue = 42;
        console.log(`\n✏️  Setting new value to ${newValue}...`);
        
        const setTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("set", [newValue])
            .setMaxTransactionFee(new Hbar(2));

        const setResponse = await setTx.execute(client);
        const setReceipt = await setResponse.getReceipt(client);

        logTransaction("Set Value", setResponse.transactionId.toString(), setReceipt.status.toString(), `Set value to ${newValue}`);

        // Function 3: Read updated value
        console.log("\n📖 Reading updated stored value...");
        const getQuery2 = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("get");

        const getResult2 = await getQuery2.execute(client);
        const updatedValue = getResult2.getUint256(0);
        console.log(`Updated stored value: ${updatedValue}`);

        // Function 4: Increment value
        console.log("\n⬆️  Incrementing value...");
        
        const incrementTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("increment")
            .setMaxTransactionFee(new Hbar(2));

        const incrementResponse = await incrementTx.execute(client);
        const incrementReceipt = await incrementResponse.getReceipt(client);

        logTransaction("Increment", incrementResponse.transactionId.toString(), incrementReceipt.status.toString());

        // Function 5: Read final value
        console.log("\n📖 Reading final stored value...");
        const getQuery3 = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("get");

        const getResult3 = await getQuery3.execute(client);
        const finalValue = getResult3.getUint256(0);
        console.log(`Final stored value: ${finalValue}`);

        console.log("\n🎉 Smart contract interaction completed successfully!");
        console.log(`📊 Value progression: ${initialValue} → ${updatedValue} → ${finalValue}`);

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.message.includes('CONTRACT_ID')) {
            console.log("💡 Run the contract deployment script first: node scripts/3-deploy-contract.js");
        }
    }
}

interactWithContract();

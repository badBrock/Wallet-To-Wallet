const { 
    Client, 
    PrivateKey, 
    AccountId, 
    AccountBalanceQuery,
    TokenCreateTransaction,
    Hbar 
} = require("@hashgraph/sdk");

require("dotenv").config();

async function main() {
    const operatorId = process.env.OPERATOR_ID;
    const operatorKey = process.env.OPERATOR_KEY;

    console.log(`Account ID: ${operatorId}`);

    try {
        // Use ECDSA format (confirmed working from your debug)
        const privateKey = PrivateKey.fromStringECDSA(operatorKey);
        console.log("✅ Private key parsed as ECDSA");

        // Setup client
        const client = Client.forTestnet();
        client.setOperator(operatorId, privateKey);
        
        console.log("✅ Client setup successful!");

        // Check balance
        const balance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);
        
        console.log(`🎉 Your account balance is: ${balance.hbars.toString()} HBAR`);

        // Create token with ECDSA key
        console.log("Creating token with ECDSA key...");
        
        const transaction = new TokenCreateTransaction()
            .setTokenName("My ECDSA Token")
            .setTokenSymbol("MET")
            .setDecimals(2)
            .setInitialSupply(10000)
            .setTreasuryAccountId(operatorId)
            .setMaxTransactionFee(new Hbar(30));

        console.log("Freezing transaction...");
        const frozenTx = await transaction.freezeWith(client);
        console.log("✅ Transaction frozen");

        console.log("Signing with ECDSA key...");
        const signedTx = await frozenTx.sign(privateKey);
        console.log("✅ Transaction signed");

        console.log("Executing transaction...");
        const txResponse = await signedTx.execute(client);
        console.log("✅ Transaction submitted, waiting for receipt...");

        const receipt = await txResponse.getReceipt(client);
        
        console.log(`✅ Token creation status: ${receipt.status.toString()}`);
        console.log(`🎉 Token ID: ${receipt.tokenId.toString()}`);
        console.log(`🎉 Token created successfully with ECDSA key!`);

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log("\n🔧 Troubleshooting tips:");
        console.log("1. Wait a few minutes and try again (testnet may be busy)");
        console.log("2. Check network connectivity");
        console.log("3. Verify sufficient HBAR balance");
    }
}

main();

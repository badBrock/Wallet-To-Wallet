const { 
    Client, 
    TransferTransaction,
    TokenAssociateTransaction,
    AccountBalanceQuery 
} = require("@hashgraph/sdk");
const { getAccountDetails, logTransaction } = require("./utils");

require("dotenv").config();

async function transferTokens() {
    try {
        const client = Client.forTestnet();
        const { accountId: operatorId, privateKey: operatorKey } = getAccountDetails('operator');
        const { accountId: recipientId, privateKey: recipientKey } = getAccountDetails('recipient');
        const tokenId = process.env.TOKEN_ID;
        
        client.setOperator(operatorId, operatorKey);
        console.log("✅ Client setup successful!");

        // Step 1: Associate recipient with token (required before receiving tokens)
        console.log(`\n🔗 Associating recipient ${recipientId} with token ${tokenId}...`);
        
        const associateTx = new TokenAssociateTransaction()
            .setAccountId(recipientId)
            .setTokenIds([tokenId])
            .freezeWith(client);

        const associateSignedTx = await associateTx.sign(recipientKey);
        const associateResponse = await associateSignedTx.execute(client);
        const associateReceipt = await associateResponse.getReceipt(client);

        logTransaction("Token Association", associateResponse.transactionId.toString(), associateReceipt.status.toString());

        // Step 2: Check initial token balances
        console.log("\n📊 Initial Token Balances:");
        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);
        const recipientBalance = await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client);

        console.log(`Operator tokens: ${operatorBalance.tokens.get(tokenId) || 0}`);
        console.log(`Recipient tokens: ${recipientBalance.tokens.get(tokenId) || 0}`);

        // Step 3: Transfer tokens
        const transferAmount = 1000; // Transfer 1000 tokens (remember your token has 2 decimals)
        console.log(`\n🪙 Transferring ${transferAmount} tokens from operator to recipient...`);
        
        const tokenTransferTx = new TransferTransaction()
            .addTokenTransfer(tokenId, operatorId, -transferAmount)    // Subtract from operator
            .addTokenTransfer(tokenId, recipientId, transferAmount)     // Add to recipient
            .freezeWith(client);

        const tokenTransferSigned = await tokenTransferTx.sign(operatorKey);
        const tokenTransferResponse = await tokenTransferSigned.execute(client);
        const tokenTransferReceipt = await tokenTransferResponse.getReceipt(client);

        logTransaction("Token Transfer", tokenTransferResponse.transactionId.toString(), tokenTransferReceipt.status.toString());

        // Step 4: Check final token balances
        console.log("\n📊 Final Token Balances:");
        const newOperatorBalance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);
        const newRecipientBalance = await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client);

        console.log(`Operator tokens: ${newOperatorBalance.tokens.get(tokenId) || 0}`);
        console.log(`Recipient tokens: ${newRecipientBalance.tokens.get(tokenId) || 0}`);

        console.log("🎉 Token transfer completed successfully!");

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        console.log("\n💡 Note: If you get INVALID_SIGNATURE, the recipient needs to sign the association transaction");
    }
}

transferTokens();

const { 
    Client, 
    TransferTransaction,
    AccountBalanceQuery,
    Hbar 
} = require("@hashgraph/sdk");
const { getAccountDetails, logTransaction } = require("./utils");

require("dotenv").config();

async function transferHBAR() {
    try {
        // Setup client
        const client = Client.forTestnet();
        const { accountId: operatorId, privateKey: operatorKey } = getAccountDetails('operator');
        const { accountId: recipientId } = getAccountDetails('recipient');
        
        client.setOperator(operatorId, operatorKey);
        console.log("✅ Client setup successful!");

        // Check initial balances
        console.log("\n📊 Initial Balances:");
        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);
        const recipientBalance = await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client);
            
        console.log(`Operator (${operatorId}): ${operatorBalance.hbars.toString()} HBAR`);
        console.log(`Recipient (${recipientId}): ${recipientBalance.hbars.toString()} HBAR`);

        // Create transfer transaction
        const transferAmount = new Hbar(10); // Transfer 10 HBAR
        console.log(`\n💸 Transferring ${transferAmount.toString()} from operator to recipient...`);
        
        const transferTx = new TransferTransaction()
            .addHbarTransfer(operatorId, transferAmount.negated()) // Subtract from operator
            .addHbarTransfer(recipientId, transferAmount)          // Add to recipient
            .setMaxTransactionFee(new Hbar(1));

        // Execute transaction
        const txResponse = await transferTx.execute(client);
        const receipt = await txResponse.getReceipt(client);

        logTransaction("HBAR Transfer", txResponse.transactionId.toString(), receipt.status.toString());

        // Check final balances
        console.log("\n📊 Final Balances:");
        const newOperatorBalance = await new AccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);
        const newRecipientBalance = await new AccountBalanceQuery()
            .setAccountId(recipientId)
            .execute(client);
            
        console.log(`Operator (${operatorId}): ${newOperatorBalance.hbars.toString()} HBAR`);
        console.log(`Recipient (${recipientId}): ${newRecipientBalance.hbars.toString()} HBAR`);

        console.log("🎉 HBAR transfer completed successfully!");

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

transferHBAR();

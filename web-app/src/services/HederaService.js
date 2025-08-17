// This service handles all Hedera blockchain interactions
import {
  Client,
  PrivateKey,
  AccountId,
  AccountBalanceQuery,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  Hbar
} from "@hashgraph/sdk";

class HederaService {
  // Verify account credentials
  static async verifyAccount(accountId, privateKeyString) {
    try {
      // Parse account ID
      const account = AccountId.fromString(accountId);
      
      // Try to parse private key in different formats
      let privateKey;
      try {
        // Try ECDSA format first
        privateKey = PrivateKey.fromStringECDSA(privateKeyString);
      } catch (e1) {
        try {
          // Try ED25519 format
          privateKey = PrivateKey.fromStringED25519(privateKeyString);
        } catch (e2) {
          // If both fail, throw the first error
          throw new Error(`Invalid private key format: ${e1.message}`);
        }
      }
      
      // Create client for testnet
      const client = Client.forTestnet();
      client.setOperator(accountId, privateKey);
      
      // Check account balance to verify credentials
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);
      
      // Close client
      client.close();
      
      return {
        success: true,
        hbarBalance: balance.hbars.toString(),
        accountId: accountId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a new token
  static async createToken(walletData, tokenProperties) {
    try {
      const { senderId, senderKey } = walletData;
      const { name, symbol, decimals, initialSupply } = tokenProperties;
      
      // Parse private key
      let privateKey;
      try {
        // Try ECDSA format first
        privateKey = PrivateKey.fromStringECDSA(senderKey);
      } catch (e1) {
        try {
          // Try ED25519 format
          privateKey = PrivateKey.fromStringED25519(senderKey);
        } catch (e2) {
          // If both fail, throw the first error
          throw new Error(`Invalid private key format: ${e1.message}`);
        }
      }
      
      // Create client
      const client = Client.forTestnet();
      client.setOperator(senderId, privateKey);
      
      // Create token transaction
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(senderId)
        .setMaxTransactionFee(new Hbar(30));
      
      // Freeze transaction
      const frozenTx = await transaction.freezeWith(client);
      
      // Sign transaction
      const signedTx = await frozenTx.sign(privateKey);
      
      // Execute transaction
      const txResponse = await signedTx.execute(client);
      
      // Get receipt
      const receipt = await txResponse.getReceipt(client);
      
      // Close client
      client.close();
      
      if (receipt.status.toString() === "SUCCESS") {
        return {
          success: true,
          tokenId: receipt.tokenId.toString(),
          status: receipt.status.toString(),
          transactionId: txResponse.transactionId.toString()
        };
      } else {
        return {
          success: false,
          error: `Token creation failed with status: ${receipt.status.toString()}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer tokens between accounts
  static async transferTokens(walletData, tokenData, amount) {
    try {
      const { senderId, senderKey, receiverId, receiverKey } = walletData;
      const { tokenId } = tokenData;
      
      // Parse private keys
      let senderPrivateKey, receiverPrivateKey;
      
      // Parse sender private key
      try {
        senderPrivateKey = PrivateKey.fromStringECDSA(senderKey);
      } catch (e1) {
        try {
          senderPrivateKey = PrivateKey.fromStringED25519(senderKey);
        } catch (e2) {
          throw new Error(`Invalid sender private key format: ${e1.message}`);
        }
      }
      
      // Parse receiver private key
      try {
        receiverPrivateKey = PrivateKey.fromStringECDSA(receiverKey);
      } catch (e1) {
        try {
          receiverPrivateKey = PrivateKey.fromStringED25519(receiverKey);
        } catch (e2) {
          throw new Error(`Invalid receiver private key format: ${e1.message}`);
        }
      }
      
      // Create client
      const client = Client.forTestnet();
      client.setOperator(senderId, senderPrivateKey);
      
      // Step 1: Associate receiver with token (required before receiving tokens)
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(receiverId)
        .setTokenIds([tokenId])
        .freezeWith(client);

      const associateSignedTx = await associateTx.sign(receiverPrivateKey);
      const associateResponse = await associateSignedTx.execute(client);
      const associateReceipt = await associateResponse.getReceipt(client);
      
      if (associateReceipt.status.toString() !== "SUCCESS") {
        throw new Error(`Token association failed with status: ${associateReceipt.status.toString()}`);
      }
      
      // Step 2: Transfer tokens
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, senderId, -amount)    // Subtract from sender
        .addTokenTransfer(tokenId, receiverId, amount)   // Add to receiver
        .freezeWith(client);

      const transferSignedTx = await transferTx.sign(senderPrivateKey);
      const transferResponse = await transferSignedTx.execute(client);
      const transferReceipt = await transferResponse.getReceipt(client);
      
      // Close client
      client.close();
      
      if (transferReceipt.status.toString() === "SUCCESS") {
        return {
          success: true,
          transactionId: transferResponse.transactionId.toString(),
          status: transferReceipt.status.toString()
        };
      } else {
        return {
          success: false,
          error: `Token transfer failed with status: ${transferReceipt.status.toString()}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default HederaService;
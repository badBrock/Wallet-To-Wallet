# Hedera Wallet Transfer Web Application

This web application provides a user-friendly interface for creating and transferring tokens on the Hedera network.

## Features

1. Wallet verification for both sender and receiver
2. Token creation with custom properties
3. Token transfer between wallets
4. Real-time transaction status updates

## Prerequisites

- Node.js (version 14 or higher)
- Hedera Testnet accounts with private keys
- Sufficient HBAR balance in the sender account

## Installation

1. Navigate to the web-app directory:
   ```
   cd web-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

1. Start the development server:
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter and verify wallet credentials for both sender and receiver
2. Create a new token by specifying its properties
3. Transfer tokens between the wallets
4. View transaction details and status

## Security Notes

- Never share your private keys with anyone
- This application uses the Hedera JavaScript SDK to interact directly with the network
- All private keys are processed locally and never sent to any server

## Troubleshooting

- If you encounter network issues, ensure you have a stable internet connection
- Verify that your account has sufficient HBAR balance for transaction fees
- Check that you're using the correct private key format (ECDSA)
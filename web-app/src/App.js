import React, { useState } from 'react';
import WalletSetup from './components/WalletSetup.js';
import TokenCreation from './components/TokenCreation.js';
import TokenTransfer from './components/TokenTransfer.js';
import TransactionStatus from './components/TransactionStatus.js';
import './App.css';

function App() {
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState({
    senderId: '',
    senderKey: '',
    receiverId: '',
    receiverKey: ''
  });
  const [tokenData, setTokenData] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);

  const handleWalletSetup = (data) => {
    setWalletData(data);
    setStep(2);
  };

  const handleTokenCreation = (data) => {
    setTokenData(data);
    setStep(3);
  };

  const handleTransactionComplete = (result) => {
    setTransactionResult(result);
    setStep(4);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-center my-4">Hedera Wallet Transfer</h1>
      </header>
      <main className="container">
        {step === 1 && (
          <WalletSetup onNext={handleWalletSetup} />
        )}
        {step === 2 && (
          <TokenCreation 
            walletData={walletData} 
            onNext={handleTokenCreation} 
            onBack={() => setStep(1)} 
          />
        )}
        {step === 3 && (
          <TokenTransfer 
            walletData={walletData} 
            tokenData={tokenData}
            onComplete={handleTransactionComplete}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <TransactionStatus 
            result={transactionResult} 
            onRestart={() => {
              setStep(1);
              setWalletData({
                senderId: '',
                senderKey: '',
                receiverId: '',
                receiverKey: ''
              });
              setTokenData(null);
              setTransactionResult(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
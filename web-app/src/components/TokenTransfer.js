import React, { useState } from 'react';
import HederaService from '../services/HederaService.js';

const TokenTransfer = ({ walletData, tokenData, onComplete, onBack }) => {
  const [transferAmount, setTransferAmount] = useState(1000);
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState(null);

  const handleTransfer = async () => {
    if (transferAmount <= 0) {
      setTransferStatus({ success: false, message: 'Transfer amount must be greater than zero.' });
      return;
    }

    setTransferring(true);
    setTransferStatus(null);
    
    try {
      const result = await HederaService.transferTokens(walletData, tokenData, transferAmount);
      
      if (result.success) {
        setTransferStatus({ 
          success: true, 
          message: 'Token transfer completed successfully!',
          transactionId: result.transactionId
        });
        
        // Complete the process after a short delay
        setTimeout(() => {
          onComplete({
            ...tokenData,
            transactionId: result.transactionId,
            amount: transferAmount,
            senderId: walletData.senderId,
            receiverId: walletData.receiverId
          });
        }, 2000);
      } else {
        setTransferStatus({ success: false, message: `Token transfer failed: ${result.error}` });
      }
    } catch (error) {
      setTransferStatus({ success: false, message: `Token transfer failed: ${error.message}` });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="mb-4">Transfer Tokens</h2>
      
      <div className="token-info">
        <h5>Token Information</h5>
        <p><strong>Name:</strong> {tokenData.name}</p>
        <p><strong>Symbol:</strong> {tokenData.symbol}</p>
        <p><strong>Token ID:</strong> {tokenData.tokenId}</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="transferAmount">Amount to Transfer:</label>
        <input
          type="number"
          className="form-control"
          id="transferAmount"
          value={transferAmount}
          onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
          min="1"
        />
      </div>
      
      <div className="transaction-details">
        <h5>Transaction Details</h5>
        <p><strong>From:</strong> {walletData.senderId}</p>
        <p><strong>To:</strong> {walletData.receiverId}</p>
        <p><strong>Amount:</strong> {transferAmount} {tokenData.symbol}</p>
      </div>
      
      {transferStatus && (
        <div className={`status-message ${transferStatus.success ? 'success' : 'error'}`}>
          {transferStatus.message}
          {transferStatus.transactionId && (
            <p className="mb-0"><strong>Transaction ID:</strong> {transferStatus.transactionId}</p>
          )}
        </div>
      )}
      
      <div className="btn-container">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button 
          className="btn btn-success" 
          onClick={handleTransfer}
          disabled={transferring}
        >
          {transferring ? 'Transferring...' : 'Transfer Tokens'}
        </button>
      </div>
    </div>
  );
};

export default TokenTransfer;
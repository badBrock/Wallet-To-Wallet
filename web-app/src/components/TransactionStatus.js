import React from 'react';

const TransactionStatus = ({ result, onRestart }) => {
  return (
    <div className="card p-4">
      <h2 className="mb-4">Transaction Complete!</h2>
      
      <div className="status-message success">
        <h4>🎉 Success! Tokens transferred successfully</h4>
        <p>Your token transfer has been completed and recorded on the Hedera network.</p>
      </div>
      
      <div className="transaction-details">
        <h5>Transaction Summary</h5>
        <p><strong>Token:</strong> {result.name} ({result.symbol})</p>
        <p><strong>Token ID:</strong> {result.tokenId}</p>
        <p><strong>Amount Transferred:</strong> {result.amount} {result.symbol}</p>
        <p><strong>From:</strong> {result.senderId}</p>
        <p><strong>To:</strong> {result.receiverId}</p>
        <p><strong>Transaction ID:</strong> {result.transactionId}</p>
      </div>
      
      <div className="alert alert-info">
        <h5>Next Steps</h5>
        <p>You can verify this transaction on a Hedera explorer using the Transaction ID above.</p>
      </div>
      
      <div className="btn-container">
        <button className="btn btn-primary" onClick={onRestart}>
          Perform Another Transfer
        </button>
      </div>
    </div>
  );
};

export default TransactionStatus;
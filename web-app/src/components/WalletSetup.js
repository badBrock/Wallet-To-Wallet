import React, { useState } from 'react';
import HederaService from '../services/HederaService.js';

const WalletSetup = ({ onNext }) => {
  const [formData, setFormData] = useState({
    senderId: '',
    senderKey: '',
    receiverId: '',
    receiverKey: ''
  });
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verifiedAccounts, setVerifiedAccounts] = useState({
    sender: false,
    receiver: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset verification status when user changes input
    setVerificationStatus(null);
    if (name === 'senderId' || name === 'senderKey') {
      setVerifiedAccounts(prev => ({ ...prev, sender: false }));
    } else {
      setVerifiedAccounts(prev => ({ ...prev, receiver: false }));
    }
  };

  const verifyAccount = async (accountId, privateKey, accountType) => {
    if (!accountId || !privateKey) {
      setVerificationStatus({ 
        success: false, 
        message: `Please enter both Account ID and Private Key for ${accountType}` 
      });
      return false;
    }

    try {
      const result = await HederaService.verifyAccount(accountId, privateKey);
      if (result.success) {
        setVerifiedAccounts(prev => ({ 
          ...prev, 
          [accountType]: true 
        }));
        return true;
      } else {
        setVerificationStatus({ 
          success: false, 
          message: `Verification failed for ${accountType}: ${result.error}` 
        });
        return false;
      }
    } catch (error) {
      setVerificationStatus({ 
        success: false, 
        message: `Verification failed for ${accountType}: ${error.message}` 
      });
      return false;
    }
  };

  const verifyAllCredentials = async () => {
    setVerifying(true);
    setVerificationStatus(null);
    
    try {
      // Verify sender account
      const senderVerified = await verifyAccount(
        formData.senderId, 
        formData.senderKey, 
        'sender'
      );
      
      if (!senderVerified) {
        setVerifying(false);
        return;
      }
      
      // Verify receiver account
      const receiverVerified = await verifyAccount(
        formData.receiverId, 
        formData.receiverKey, 
        'receiver'
      );
      
      if (!receiverVerified) {
        setVerifying(false);
        return;
      }
      
      // If both verified successfully
      setVerificationStatus({ 
        success: true, 
        message: 'All credentials verified successfully!' 
      });
      
      // Proceed to next step after a short delay
      setTimeout(() => {
        onNext(formData);
      }, 1500);
    } catch (error) {
      setVerificationStatus({ 
        success: false, 
        message: `Verification failed: ${error.message}` 
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="mb-4">Wallet Setup</h2>
      <p className="text-muted">Enter and verify wallet credentials for both sender and receiver</p>
      
      <div className="row">
        <div className="col-md-6">
          <h4>Sender Wallet</h4>
          <div className="form-group">
            <label htmlFor="senderId">Account ID:</label>
            <input
              type="text"
              className="form-control"
              id="senderId"
              name="senderId"
              value={formData.senderId}
              onChange={handleChange}
              placeholder="0.0.xxxxxx"
            />
          </div>
          <div className="form-group">
            <label htmlFor="senderKey">Private Key:</label>
            <input
              type="password"
              className="form-control"
              id="senderKey"
              name="senderKey"
              value={formData.senderKey}
              onChange={handleChange}
              placeholder="3030..."
            />
          </div>
          {verifiedAccounts.sender && (
            <div className="status-message success">
              Sender verified successfully!
            </div>
          )}
        </div>
        
        <div className="col-md-6">
          <h4>Receiver Wallet</h4>
          <div className="form-group">
            <label htmlFor="receiverId">Account ID:</label>
            <input
              type="text"
              className="form-control"
              id="receiverId"
              name="receiverId"
              value={formData.receiverId}
              onChange={handleChange}
              placeholder="0.0.xxxxxx"
            />
          </div>
          <div className="form-group">
            <label htmlFor="receiverKey">Private Key:</label>
            <input
              type="password"
              className="form-control"
              id="receiverKey"
              name="receiverKey"
              value={formData.receiverKey}
              onChange={handleChange}
              placeholder="3030..."
            />
          </div>
          {verifiedAccounts.receiver && (
            <div className="status-message success">
              Receiver verified successfully!
            </div>
          )}
        </div>
      </div>
      
      {verificationStatus && (
        <div className={`status-message ${verificationStatus.success ? 'success' : 'error'}`}>
          {verificationStatus.message}
        </div>
      )}
      
      <div className="btn-container">
        <button 
          className="btn btn-primary" 
          onClick={verifyAllCredentials}
          disabled={verifying || (verifiedAccounts.sender && verifiedAccounts.receiver)}
        >
          {verifying ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  );
};

export default WalletSetup;
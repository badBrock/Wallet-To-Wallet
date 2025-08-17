import React, { useState } from 'react';
import HederaService from '../services/HederaService.js';

const TokenCreation = ({ walletData, onNext, onBack }) => {
  const [tokenData, setTokenData] = useState({
    name: 'My ECDSA Token',
    symbol: 'MET',
    decimals: 2,
    initialSupply: 10000
  });
  const [creating, setCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTokenData(prev => ({
      ...prev,
      [name]: name === 'decimals' || name === 'initialSupply' ? parseInt(value) || 0 : value
    }));
  };

  const createToken = async () => {
    // Validate inputs
    if (!tokenData.name || !tokenData.symbol || tokenData.decimals < 0 || tokenData.initialSupply <= 0) {
      setCreationStatus({ success: false, message: 'Please fill in all fields correctly.' });
      return;
    }

    setCreating(true);
    setCreationStatus(null);
    
    try {
      const result = await HederaService.createToken(walletData, tokenData);
      
      if (result.success) {
        setCreationStatus({ 
          success: true, 
          message: `Token created successfully! Token ID: ${result.tokenId}`,
          tokenId: result.tokenId
        });
        
        // Proceed to next step after a short delay
        setTimeout(() => {
          onNext({
            ...tokenData,
            tokenId: result.tokenId
          });
        }, 2000);
      } else {
        setCreationStatus({ success: false, message: `Token creation failed: ${result.error}` });
      }
    } catch (error) {
      setCreationStatus({ success: false, message: `Token creation failed: ${error.message}` });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="mb-4">Create Token</h2>
      <p className="text-muted">Define the properties of your new token</p>
      
      <div className="form-group">
        <label htmlFor="name">Token Name:</label>
        <input
          type="text"
          className="form-control"
          id="name"
          name="name"
          value={tokenData.name}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="symbol">Token Symbol:</label>
        <input
          type="text"
          className="form-control"
          id="symbol"
          name="symbol"
          value={tokenData.symbol}
          onChange={handleChange}
        />
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label htmlFor="decimals">Decimals:</label>
            <input
              type="number"
              className="form-control"
              id="decimals"
              name="decimals"
              value={tokenData.decimals}
              onChange={handleChange}
              min="0"
              max="8"
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label htmlFor="initialSupply">Initial Supply:</label>
            <input
              type="number"
              className="form-control"
              id="initialSupply"
              name="initialSupply"
              value={tokenData.initialSupply}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>
      </div>
      
      {creationStatus && (
        <div className={`status-message ${creationStatus.success ? 'success' : 'error'}`}>
          {creationStatus.message}
        </div>
      )}
      
      <div className="btn-container">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button 
          className="btn btn-primary" 
          onClick={createToken}
          disabled={creating}
        >
          {creating ? 'Creating Token...' : 'Create Token'}
        </button>
      </div>
    </div>
  );
};

export default TokenCreation;
const { PrivateKey, AccountId } = require("@hashgraph/sdk");

function getAccountDetails(accountType = 'operator') {
    const idKey = accountType === 'operator' ? 'OPERATOR_ID' : 'RECIPIENT_ID';
    const keyKey = accountType === 'operator' ? 'OPERATOR_KEY' : 'RECIPIENT_KEY';
    
    const accountId = process.env[idKey];
    const privateKey = PrivateKey.fromStringECDSA(process.env[keyKey]);
    
    return { accountId, privateKey };
}

function logTransaction(title, txId, status, additionalInfo = '') {
    console.log(`\n=== ${title} ===`);
    console.log(`Transaction ID: ${txId}`);
    console.log(`Status: ${status}`);
    if (additionalInfo) console.log(`Info: ${additionalInfo}`);
    console.log('='.repeat(50));
}

module.exports = { getAccountDetails, logTransaction };

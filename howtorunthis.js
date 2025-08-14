// const { PrivateKey } = require("@hashgraph/sdk");
// require("dotenv").config();

// const operatorKey = process.env.OPERATOR_KEY;

// try {
//     const key = PrivateKey.fromStringECDSA(operatorKey);
//     console.log("✅ ECDSA key works");
//     console.log(`Public key: ${key.publicKey.toString()}`);
// } catch (e) {
//     console.log("❌ ECDSA failed, trying ED25519...");
//     try {
//         const key = PrivateKey.fromStringED25519(operatorKey);
//         console.log("✅ ED25519 key works");
//     } catch (e2) {
//         console.log("❌ Both formats failed");
//     }
// }

const { execSync } = require('child_process');

async function runAllScripts() {
    const scripts = [
        '1-wallet-transfer.js',
        '2-token-transfer.js', 
        '3-deploy-contract.js',
        '4-interact-contract.js'
    ];

    console.log("🚀 Running complete blockchain application suite...\n");

    for (let i = 0; i < scripts.length; i++) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`▶️  STEP ${i + 1}: Running ${scripts[i]}`);
        console.log('='.repeat(60));
        
        try {
            execSync(`node scripts/${scripts[i]}`, { stdio: 'inherit' });
            console.log(`✅ Step ${i + 1} completed successfully!`);
        } catch (error) {
            console.error(`❌ Step ${i + 1} failed:`, error.message);
            break;
        }

        // Wait between scripts
        if (i < scripts.length - 1) {
            console.log("\n⏳ Waiting 3 seconds before next step...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    console.log("\n🎉 All scripts completed!");
}

runAllScripts();

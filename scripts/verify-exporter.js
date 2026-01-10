const { ethers } = require('hardhat');

async function verifyExporter() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node verify-exporter.js <exporter-address>');
    console.log('Example: node verify-exporter.js 0x532280Cb1663d370D38733e0E0c0D382fd6C981d');
    process.exit(1);
  }

  const exporterAddress = args[0];
  
  try {
    console.log('🔑 Verifying exporter:', exporterAddress);
    
    // Get contract addresses from environment
    const accessControlAddress = process.env.NEXT_PUBLIC_ACCESS_CONTROL;
    
    if (!accessControlAddress) {
      throw new Error('ACCESS_CONTROL contract address not found in environment');
    }
    
    // AccessControl ABI for grantRole function
    const accessControlABI = [
      {
        "inputs": [
          {"internalType": "bytes32", "name": "role", "type": "bytes32"},
          {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "role", "type": "bytes32"},
          {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "hasRole",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    // Connect to AccessControl contract
    const AccessControl = new ethers.Contract(accessControlAddress, accessControlABI, (await ethers.getSigners())[0]);
    
    // Grant exporter role
    console.log('📝 Granting EXPORTER_ROLE to:', exporterAddress);
    
    const EXPORTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('EXPORTER_ROLE'));
    const tx = await AccessControl.grantRole(EXPORTER_ROLE, exporterAddress);
    
    console.log('⏳ Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    console.log('✅ Exporter verified successfully!');
    console.log('📋 Transaction hash:', receipt.hash);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());
    
    // Verify the role was granted
    const hasRole = await AccessControl.hasRole(EXPORTER_ROLE, exporterAddress);
    console.log('✅ Role verification:', hasRole ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('❌ Error verifying exporter:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyExporter()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = verifyExporter;
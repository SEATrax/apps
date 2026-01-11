const { ethers } = require('hardhat');

async function main() {
  const contractAddress = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';
  
  // Get deployed contract
  const SEATrax = await ethers.getContractAt('SEATrax', contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log('Testing with address:', signer.address);
  
  // Check if registerExporter function exists
  console.log('\nChecking registerExporter function...');
  try {
    const isRegistered = await SEATrax.registeredExporters(signer.address);
    console.log('Already registered:', isRegistered);
    
    if (!isRegistered) {
      console.log('\nCalling registerExporter()...');
      const tx = await SEATrax.registerExporter();
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Registration successful!');
      console.log('Gas used:', receipt.gasUsed.toString());
    } else {
      console.log('⚠️ Already registered as exporter');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

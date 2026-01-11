const { ethers } = require('hardhat');

async function main() {
  const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';
  const newAdminAddress = process.env.NEW_ADMIN_ADDRESS;

  if (!newAdminAddress) {
    console.log('❌ Please set NEW_ADMIN_ADDRESS environment variable');
    console.log('\nUsage:');
    console.log('  NEW_ADMIN_ADDRESS=0x1234... npx hardhat run scripts/grant-admin.js --network lisk-sepolia');
    console.log('\nExample:');
    console.log('  NEW_ADMIN_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb npx hardhat run scripts/grant-admin.js --network lisk-sepolia');
    process.exit(1);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GRANT ADMIN ROLE - SEATrax Platform');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 Target Address:', newAdminAddress);
  console.log('📍 Contract:', CONTRACT_ADDRESS);
  console.log('🌐 Network:', (await ethers.provider.getNetwork()).name);
  console.log('');

  // Validate address format
  if (!ethers.isAddress(newAdminAddress)) {
    console.log('❌ Invalid Ethereum address format');
    process.exit(1);
  }

  const SEATrax = await ethers.getContractAt('SEATrax', CONTRACT_ADDRESS);
  const ADMIN_ROLE = await SEATrax.ADMIN_ROLE();

  console.log('🔑 ADMIN_ROLE hash:', ADMIN_ROLE);
  console.log('');

  // Check current role
  console.log('⏳ Checking current admin status...');
  const hasRoleBefore = await SEATrax.hasRole(ADMIN_ROLE, newAdminAddress);
  
  if (hasRoleBefore) {
    console.log('✅ Address already has ADMIN_ROLE');
    console.log('');
    console.log('No action needed. You can now access admin pages.');
    return;
  }

  console.log('❌ Address does NOT have ADMIN_ROLE yet');
  console.log('');

  // Get deployer/signer info
  const [signer] = await ethers.getSigners();
  console.log('👤 Granting from address:', signer.address);
  
  // Check if signer has permission to grant
  const signerHasAdminRole = await SEATrax.hasRole(ADMIN_ROLE, signer.address);
  const DEFAULT_ADMIN_ROLE = await SEATrax.DEFAULT_ADMIN_ROLE();
  const signerHasDefaultAdminRole = await SEATrax.hasRole(DEFAULT_ADMIN_ROLE, signer.address);

  if (!signerHasAdminRole && !signerHasDefaultAdminRole) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR: PERMISSION DENIED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Your address does not have permission to grant admin role.');
    console.log('');
    console.log('Signer address:', signer.address);
    console.log('Has ADMIN_ROLE:', signerHasAdminRole);
    console.log('Has DEFAULT_ADMIN_ROLE:', signerHasDefaultAdminRole);
    console.log('');
    console.log('Only the deployer or existing admin can grant admin role.');
    console.log('');
    process.exit(1);
  }

  console.log('✅ Signer has permission to grant roles');
  console.log('');

  // Grant role
  console.log('🚀 Granting ADMIN_ROLE...');
  const tx = await SEATrax.grantRole(ADMIN_ROLE, newAdminAddress);
  console.log('📝 Transaction hash:', tx.hash);
  console.log('⏳ Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
  console.log('');

  // Verify
  console.log('🔍 Verifying role grant...');
  const hasRoleAfter = await SEATrax.hasRole(ADMIN_ROLE, newAdminAddress);
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (hasRoleAfter) {
    console.log('✅ SUCCESS: Admin role granted!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Address', newAdminAddress);
    console.log('now has ADMIN_ROLE and can:');
    console.log('  • Access /admin/invoices page');
    console.log('  • Approve/reject invoices');
    console.log('  • Create investment pools');
    console.log('  • Manage platform operations');
    console.log('');
    console.log('🎉 You can now reload the admin page in your browser!');
  } else {
    console.log('❌ FAILED: Role grant verification failed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Transaction was mined but role verification failed.');
    console.log('Please check the transaction on block explorer.');
  }
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ ERROR');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error(error);
  console.error('');
  process.exit(1);
});

const { ethers } = require('ethers');
const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';
const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';

async function checkAdminRole() {
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia-api.lisk.com');
  
  const abi = [
    'function hasRole(bytes32 role, address account) view returns (bool)'
  ];
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  // Get address from command line argument
  const addressToCheck = process.argv[2];
  
  if (!addressToCheck) {
    console.log('Usage: node check-admin-role.js <ADDRESS>');
    console.log('Example: node check-admin-role.js 0x1234...');
    process.exit(1);
  }
  
  console.log('Checking admin role for:', addressToCheck);
  console.log('ADMIN_ROLE:', ADMIN_ROLE);
  console.log('Contract:', CONTRACT_ADDRESS);
  
  const hasRole = await contract.hasRole(ADMIN_ROLE, addressToCheck);
  
  console.log('\n✅ Has ADMIN_ROLE:', hasRole);
  
  if (!hasRole) {
    console.log('\n⚠️ Address does NOT have admin role!');
    console.log('Please grant role using:');
    console.log(`npx hardhat run scripts/grant-admin.js --network lisk-sepolia`);
  }
}

checkAdminRole().catch(console.error);

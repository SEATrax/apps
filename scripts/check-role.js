const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia-api.lisk.com';
const address = process.argv[2] || '0x3023A1B0fAf10DeE06a0aA5197eE00882b401152';

const ABI = [
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function ADMIN_ROLE() view returns (bytes32)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function grantRole(bytes32 role, address account)',
];

async function checkRole() {
  console.log('🔍 Checking admin role...');
  console.log('📍 Contract:', contractAddress);
  console.log('👤 Address:', address);
  console.log('');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, ABI, provider);

  const adminRole = await contract.ADMIN_ROLE();
  const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
  
  const hasAdminRole = await contract.hasRole(adminRole, address);
  const hasDefaultAdminRole = await contract.hasRole(defaultAdminRole, address);

  console.log('🔐 Role Hashes:');
  console.log('   ADMIN_ROLE:', adminRole);
  console.log('   DEFAULT_ADMIN_ROLE:', defaultAdminRole);
  console.log('');
  console.log('📊 Role Status:');
  console.log('   Has ADMIN_ROLE:', hasAdminRole ? '✅ YES' : '❌ NO');
  console.log('   Has DEFAULT_ADMIN_ROLE:', hasDefaultAdminRole ? '✅ YES' : '❌ NO');
  
  if (!hasAdminRole && !hasDefaultAdminRole) {
    console.log('');
    console.log('⚠️  No admin role found!');
    console.log('Run: NEW_ADMIN_ADDRESS=' + address + ' npx hardhat run scripts/grant-admin.js --network lisk-sepolia');
  } else {
    console.log('');
    console.log('✅ Address has admin access!');
  }
}

checkRole().catch(console.error);

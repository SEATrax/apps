/**
 * Debug script to check what Thirdweb SDK returns
 */

const { createThirdwebClient } = require('thirdweb');
const { getContract } = require('thirdweb');
const { readContract } = require('thirdweb');
const { liskSepolia } = require('panna-sdk');

const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';

async function testThirdwebReturn() {
  console.log('🔍 Testing Thirdweb SDK return format...\n');
  
  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_PANNA_CLIENT_ID || 'test',
  });
  
  const contract = getContract({
    client,
    chain: liskSepolia,
    address: CONTRACT_ADDRESS,
  });
  
  try {
    console.log('📄 Calling getInvoice(1) via Thirdweb SDK...');
    
    const result = await readContract({
      contract,
      method: 'function getInvoice(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint256,uint256,uint8,uint256,string,uint256)',
      params: [1n],
    });
    
    console.log('\n✅ Result received!');
    console.log('Type:', typeof result);
    console.log('Is Array?', Array.isArray(result));
    console.log('Constructor:', result?.constructor?.name);
    console.log('\nRaw result:', result);
    
    if (Array.isArray(result)) {
      console.log('\n📊 Array Access:');
      console.log('  [0] (tokenId):', result[0]);
      console.log('  [1] (exporter):', result[1]);
      console.log('  [2] (exporterCompany):', result[2]);
    } else if (typeof result === 'object') {
      console.log('\n📊 Object Properties:');
      console.log('  Keys:', Object.keys(result));
      console.log('  tokenId:', result.tokenId || result[0]);
      console.log('  exporter:', result.exporter || result[1]);
      console.log('  exporterCompany:', result.exporterCompany || result[2]);
    }
    
    console.log('\n✅ Test complete - use this information to fix the hook');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('\nFull error:', error);
  }
}

testThirdwebReturn();

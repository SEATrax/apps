/**
 * Test script to verify getInvoice() works with new ABI format
 */

const { ethers } = require('hardhat');
const SEATRAX_ABI = require('./src/lib/seatrax-abi.json');

const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';
const RPC_URL = 'https://rpc.sepolia-api.lisk.com';

async function testGetInvoice() {
  console.log('🔍 Testing getInvoice() function...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SEATRAX_ABI, provider);
  
  try {
    // Test with Invoice #1
    console.log('📄 Fetching Invoice #1...');
    const invoice1 = await contract.getInvoice(1);
    
    console.log('✅ Invoice #1 Data:');
    console.log('  Token ID:', invoice1.tokenId.toString());
    console.log('  Exporter:', invoice1.exporter);
    console.log('  Company:', invoice1.exporterCompany);
    console.log('  Importer:', invoice1.importerCompany);
    console.log('  Loan Amount:', ethers.formatUnits(invoice1.loanAmount, 0), 'USD cents');
    console.log('  Shipping Amount:', ethers.formatUnits(invoice1.shippingAmount, 0), 'USD cents');
    console.log('  Amount Invested:', ethers.formatUnits(invoice1.amountInvested, 18), 'ETH');
    console.log('  Amount Withdrawn:', ethers.formatUnits(invoice1.amountWithdrawn, 18), 'ETH');
    console.log('  Status:', invoice1.status);
    console.log('  IPFS Hash:', invoice1.ipfsHash);
    console.log('  Created At:', new Date(Number(invoice1.createdAt) * 1000).toISOString());
    console.log('');
    
    // Test with Invoice #2 if exists
    try {
      console.log('📄 Fetching Invoice #2...');
      const invoice2 = await contract.getInvoice(2);
      
      console.log('✅ Invoice #2 Data:');
      console.log('  Token ID:', invoice2.tokenId.toString());
      console.log('  Exporter:', invoice2.exporter);
      console.log('  Company:', invoice2.exporterCompany);
      console.log('  Importer:', invoice2.importerCompany);
      console.log('  Loan Amount:', ethers.formatUnits(invoice2.loanAmount, 0), 'USD cents');
      console.log('  Status:', invoice2.status);
      console.log('');
    } catch (err) {
      console.log('ℹ️  Invoice #2 not found (this is normal if you only created 1 invoice)\n');
    }
    
    console.log('✅ getInvoice() function works correctly!');
    console.log('📋 Tuple structure is being parsed properly by ethers.js');
    console.log('');
    console.log('🔧 This confirms the ABI format is correct.');
    console.log('💡 The issue in Thirdweb SDK should now be fixed with object-based method definition.');
    
  } catch (error) {
    console.error('❌ Error testing getInvoice():', error.message);
    console.error('Full error:', error);
  }
}

testGetInvoice();

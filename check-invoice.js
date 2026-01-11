// Quick script to check the latest invoice on-chain
const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';
const RPC_URL = 'https://rpc.sepolia-api.lisk.com';

const ABI = [
  'function getInvoice(uint256 _invoiceId) external view returns (tuple(uint256 tokenId, address exporter, string exporterCompany, string importerCompany, string importerEmail, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, uint256 amountInvested, uint256 amountWithdrawn, uint8 status, uint256 poolId, string ipfsHash, uint256 createdAt))',
  'function _invoiceTokenIdCounter() external view returns (uint256)'
];

async function checkInvoice() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  try {
    // Try to get invoice ID 1, 2, 3, 4, 5
    for (let i = 1; i <= 5; i++) {
      try {
        const invoice = await contract.getInvoice(i);
        console.log(`\n📋 Invoice #${i}:`);
        console.log('  Token ID:', invoice.tokenId.toString());
        console.log('  Exporter:', invoice.exporter);
        console.log('  Company:', invoice.exporterCompany);
        console.log('  Importer:', invoice.importerCompany);
        console.log('  Loan Amount:', ethers.formatEther(invoice.loanAmount), 'ETH');
        console.log('  Status:', invoice.status);
        console.log('  IPFS Hash:', invoice.ipfsHash);
        console.log('  Created:', new Date(Number(invoice.createdAt) * 1000).toLocaleString());
      } catch (err) {
        if (err.message.includes('tokenId') || invoice.tokenId === 0n) {
          console.log(`\n❌ Invoice #${i}: Not found (tokenId = 0)`);
          break;
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkInvoice();

// Check specific transaction to get invoice ID from event
const { ethers } = require('ethers');

const TX_HASH = '0x0ea7df20a8828c19721360598a11b0a65425c114d10fa8c5cabcfcdb9b29bb7e';
const RPC_URL = 'https://rpc.sepolia-api.lisk.com';
const CONTRACT_ADDRESS = '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2';

const ABI = [
  'event InvoiceCreated(uint256 indexed tokenId, address indexed exporter, uint256 loanAmount)',
  'function getInvoice(uint256 _invoiceId) external view returns (tuple(uint256 tokenId, address exporter, string exporterCompany, string importerCompany, string importerEmail, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, uint256 amountInvested, uint256 amountWithdrawn, uint8 status, uint256 poolId, string ipfsHash, uint256 createdAt))'
];

async function checkTransaction() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  try {
    console.log('🔍 Checking transaction:', TX_HASH);
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log('\n✅ Transaction found:');
    console.log('  Block:', receipt.blockNumber);
    console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
    
    // Parse logs for InvoiceCreated event
    const iface = new ethers.Interface(ABI);
    
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'InvoiceCreated') {
          const tokenId = parsed.args.tokenId;
          console.log('\n🎉 InvoiceCreated Event:');
          console.log('  Token ID:', tokenId.toString());
          console.log('  Exporter:', parsed.args.exporter);
          console.log('  Loan Amount:', ethers.formatEther(parsed.args.loanAmount), 'ETH');
          
          // Now get full invoice details
          console.log('\n📋 Full Invoice Details:');
          const invoice = await contract.getInvoice(tokenId);
          console.log('  Company:', invoice.exporterCompany);
          console.log('  Importer:', invoice.importerCompany);
          console.log('  Status:', invoice.status);
          console.log('  IPFS Hash:', invoice.ipfsHash);
        }
      } catch (e) {
        // Not our event, skip
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTransaction();

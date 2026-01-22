import { createClient } from '@supabase/supabase-js';
import { createThirdwebClient, getContract, readContract, resolveMethod, defineChain } from 'thirdweb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const CLIENT_ID = process.env.NEXT_PUBLIC_PANNA_CLIENT_ID || '7cb948c18beb24e6105880bdd3e734f0'; // Fallback to provided ID
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 4202;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia-api.lisk.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CONTRACT_ADDRESS) {
    console.error('❌ Missing configuration: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, or NEXT_PUBLIC_CONTRACT_ADDRESS');
    process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Thirdweb Client
const client = createThirdwebClient({
    clientId: CLIENT_ID,
});

const chain = defineChain({
    id: CHAIN_ID,
    rpc: RPC_URL,
});

const contract = getContract({
    client,
    chain,
    address: CONTRACT_ADDRESS,
});

async function main() {
    console.log('🚀 Starting Blockchain Backfill Script...');
    console.log(`🔗 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🗄️ Database: ${SUPABASE_URL}`);

    try {
        // 1. Backfill Invoices
        await backfillInvoices();

        // 2. Backfill Pools
        await backfillPools();

        // 3. Backfill Investments (via Pools)
        await backfillInvestments();

        console.log('✅ Backfill complete!');
    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    }
}

async function backfillInvoices() {
    console.log('\n📦 Backfilling INVOICES...');

    // Fetch all invoice tokens from DB (assumes DB has the token_id record)
    // If DB is empty, we might need to scan potential IDs from 1 to Counter, 
    // but usually DB is the source of "what exists" off-chain.
    // Actually, better to read total invoices from contract and iterate?

    // Iterate until we find a non-existent invoice
    let i = 1;
    while (true) {
        try {
            const invoiceId = BigInt(i);
            const invoiceData: any = await readContract({
                contract,
                method: "function getInvoice(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint256,uint256,uint8,uint256,string,uint256)",
                params: [invoiceId]
            });

            // Check existence (e.g. exporter address is 0 or createdAt is 0)
            if (invoiceData[1] === '0x0000000000000000000000000000000000000000') {
                console.log(`   🏁 Reached end of invoices at ID #${i - 1}`);
                break;
            }

            // Map tuple results (safer than object when ABI not fully typed here)
            const invoice = {
                tokenId: invoiceData[0],
                exporter: invoiceData[1],
                exporterCompany: invoiceData[2],
                importerCompany: invoiceData[3],
                shippingAmount: invoiceData[6],
                loanAmount: invoiceData[7],
                amountInvested: invoiceData[8],
                amountWithdrawn: invoiceData[9],
                status: invoiceData[10], // Enum index
                poolId: invoiceData[11],
                ipfsHash: invoiceData[12],
                createdAt: invoiceData[13]
            };

            const STATUS_MAP = ['PENDING', 'APPROVED', 'IN_POOL', 'FUNDED', 'WITHDRAWN', 'REPAID', 'COMPLETED', 'CANCELLED', 'REJECTED'];
            const statusStr = STATUS_MAP[invoice.status] || 'UNKNOWN';

            console.log(`   📝 Updating Invoice #${i} [${statusStr}]...`);

            // Update Supabase
            const { error } = await supabase
                .from('invoice_metadata')
                .upsert({
                    token_id: Number(invoice.tokenId),
                    // We update cache fields. We assume metadata (companies etc) might overlap or we insert if missing.
                    // Ideally we preserve existing metadata if row exists.

                    status: statusStr,
                    pool_id: Number(invoice.poolId),
                    shipping_amount: Number(invoice.shippingAmount), // Contract has USD Cents
                    loan_amount: Number(invoice.loanAmount),
                    amount_invested: Number(invoice.amountInvested),
                    amount_withdrawn: Number(invoice.amountWithdrawn),

                    // Provenance (Mark as Backfill)
                    contract_address: CONTRACT_ADDRESS,
                    // We don't have block number for current state read, use 0 or leave/null?
                    // Or use latest block.
                    // transaction_hash: 'BACKFILL'
                }, { onConflict: 'token_id' });

            if (error) console.error(`Failed to update Invoice #${i}:`, error.message);

            i++;
        } catch (err: any) {
            console.warn(`   ⚠️ Error processing Invoice #${i}:`, err.message);
            // If strictly sequential, maybe retry or break? 
            // Usually readContract reverts if completely invalid, but for non-existent key mapping it returns zeros.
            // If it reverted, it might be RPC issue or out of gas? 
            // Let's assume revert means "doesn't exist" or end of list if strict.
            // But usually mapping access doesn't revert.
            // Let's increment.
            i++;
            // Safety break
            if (i > 1000) break;
        }
    }
}


async function backfillPools() {
    console.log('\n🏊 Backfilling POOLS...');

    let i = 1;
    while (true) {
        try {
            const poolId = BigInt(i);
            const poolData: any = await readContract({
                contract,
                method: "function getPool(uint256) view returns (uint256,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8,uint256[],uint256)",
                params: [poolId]
            });

            // Check existence (e.g. createdAt is 0)
            if (Number(poolData[11]) === 0) { // createdAt
                console.log(`   🏁 Reached end of pools at ID #${i - 1}`);
                break;
            }

            const pool = {
                poolId: poolData[0],
                name: poolData[1],
                startDate: poolData[2],
                endDate: poolData[3],
                totalLoanAmount: poolData[4],
                totalShippingAmount: poolData[5],
                amountInvested: poolData[6],
                amountDistributed: poolData[7],
                status: poolData[9],
                invoiceIds: poolData[10]
            };

            const STATUS_MAP = ['OPEN', 'FUNDED', 'COMPLETED', 'CANCELLED'];
            const statusStr = STATUS_MAP[pool.status] || 'UNKNOWN';

            console.log(`   📝 Updating Pool #${i} [${statusStr}]...`);

            await supabase
                .from('pool_metadata')
                .upsert({
                    pool_id: Number(pool.poolId),
                    status: statusStr,
                    start_date: Number(pool.startDate),
                    end_date: Number(pool.endDate),
                    total_loan_amount: Number(pool.totalLoanAmount),
                    total_shipping_amount: Number(pool.totalShippingAmount),
                    amount_invested: Number(pool.amountInvested),
                    amount_distributed: Number(pool.amountDistributed),

                    contract_address: CONTRACT_ADDRESS
                }, { onConflict: 'pool_id' });

            i++;

        } catch (err: any) {
            console.warn(`   ⚠️ Error processing Pool #${i}:`, err.message);
            i++;
            if (i > 1000) break;
        }
    }
}

async function backfillInvestments() {
    console.log('\n💰 Backfilling INVESTMENTS...');

    // Iterate pools to find investors
    // Iterate pools sequentially
    let i = 1;
    while (true) {
        try {
            const poolId = BigInt(i);

            // Check if pool exists (quick check via poolData like above or just use getPoolInvestors response behavior)
            // Just check getPoolInvestors. If pool doesn't exist, it might return empty or revert? 
            // Better to use getPool first to check existence to stop loop.
            const poolData: any = await readContract({
                contract,
                method: "function getPool(uint256) view returns (uint256,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8,uint256[],uint256)",
                params: [poolId]
            });
            if (Number(poolData[11]) === 0) { // createdAt
                break;
            }

            const investors: any = await readContract({
                contract,
                method: "function getPoolInvestors(uint256) view returns (address[])",
                params: [poolId]
            });

            if (investors && investors.length > 0) {
                console.log(`   Pool #${i}: Found ${investors.length} investors.`);

                for (const investorAddr of investors) {
                    const investmentData: any = await readContract({
                        contract,
                        method: "function getInvestment(uint256,address) view returns (address,uint256,uint256,uint256,uint256,bool)",
                        params: [poolId, investorAddr]
                    });

                    const amount = Number(investmentData[2]);
                    const percentage = Number(investmentData[3]);
                    const timestamp = Number(investmentData[4]);

                    console.log(`      👤 Investor ${investorAddr}: ${amount} wei`);

                    // Upsert investment
                    // We need a unique ID or composite key? 
                    // Our table usually has ID uuid. 
                    // We can search for existing record by (pool_id, investor_address) first?
                    // OR just insert new?

                    const { data: existing } = await supabase
                        .from('investments')
                        .select('id')
                        .eq('pool_id', Number(poolId))
                        .eq('investor_address', investorAddr.toLowerCase())
                        .single();

                    if (existing) {
                        await supabase
                            .from('investments')
                            .update({
                                amount,
                                percentage,
                                timestamp,
                                contract_address: CONTRACT_ADDRESS
                            })
                            .eq('id', existing.id);
                    } else {
                        await supabase
                            .from('investments')
                            .insert({
                                pool_id: Number(poolId),
                                investor_address: investorAddr.toLowerCase(),
                                amount,
                                percentage,
                                timestamp,
                                contract_address: CONTRACT_ADDRESS
                            });
                    }
                }
            }

            i++;
        } catch (err: any) {
            console.warn(`   ⚠️ Error scanning Pool #${i} for investments:`, err.message);
            i++;
            if (i > 1000) break;
        }
    }
}

main();

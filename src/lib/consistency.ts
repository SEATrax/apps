import { supabase } from './supabase';
import { compensationService } from './compensation';

export interface ConsistencyIssue {
  type: 'missing_metadata' | 'missing_payment' | 'amount_mismatch' | 'status_mismatch' | 'data_corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tokenId: number;
  description: string;
  contractData?: any;
  databaseData?: any;
  autoHealable: boolean;
}

export interface ValidationResult {
  isConsistent: boolean;
  issues: ConsistencyIssue[];
  lastChecked: string;
  invoiceCount: number;
  healthScore: number; // 0-100
}

class DataConsistencyService {
  /**
   * Validate data consistency between smart contract and database for a single invoice
   */
  async validateInvoiceConsistency(tokenId: bigint): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      // Fetch contract data
      const contractData = await this.fetchContractInvoice(tokenId);
      
      if (!contractData) {
        issues.push({
          type: 'data_corruption',
          severity: 'critical',
          tokenId: Number(tokenId),
          description: 'Invoice not found in smart contract',
          autoHealable: false
        });
        return issues;
      }

      // Fetch database metadata
      const { data: metadata, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .eq('token_id', Number(tokenId))
        .single();

      if (metadataError && metadataError.code !== 'PGRST116') {
        console.error('Metadata fetch error:', metadataError);
      }

      // Fetch database payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('token_id', Number(tokenId))
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('Payment fetch error:', paymentError);
      }

      // Check for missing metadata
      if (!metadata) {
        issues.push({
          type: 'missing_metadata',
          severity: 'high',
          tokenId: Number(tokenId),
          description: 'Invoice metadata not found in database',
          contractData,
          autoHealable: true
        });
      }

      // Check for missing payment record
      if (!payment) {
        issues.push({
          type: 'missing_payment',
          severity: 'medium',
          tokenId: Number(tokenId),
          description: 'Payment record not found in database',
          contractData,
          autoHealable: true
        });
      }

      // If we have both, check for data mismatches
      if (payment && contractData) {
        // Check amount consistency (contract stores in cents)
        const contractAmount = Number(contractData[4]); // shippingAmount
        const dbAmount = payment.amount_usd;

        if (contractAmount !== dbAmount) {
          issues.push({
            type: 'amount_mismatch',
            severity: 'critical',
            tokenId: Number(tokenId),
            description: `Amount mismatch: Contract=${contractAmount} cents, DB=${dbAmount} cents`,
            contractData,
            databaseData: payment,
            autoHealable: true // Can sync from contract
          });
        }
      }

      return issues;
    } catch (error) {
      console.error('Validation error for tokenId', tokenId, error);
      issues.push({
        type: 'data_corruption',
        severity: 'critical',
        tokenId: Number(tokenId),
        description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        autoHealable: false
      });
      return issues;
    }
  }

  /**
   * Validate consistency across all invoices
   */
  async validateAllInvoices(): Promise<ValidationResult> {
    const allIssues: ConsistencyIssue[] = [];
    let invoiceCount = 0;

    try {
      // Get all invoice metadata from database
      const { data: allMetadata, error } = await supabase
        .from('invoice_metadata')
        .select('token_id')
        .order('token_id', { ascending: true });

      if (error) throw error;

      invoiceCount = allMetadata?.length || 0;

      // Validate each invoice
      for (const metadata of allMetadata || []) {
        const issues = await this.validateInvoiceConsistency(BigInt(metadata.token_id));
        allIssues.push(...issues);
      }

      // Calculate health score (100 - percentage of issues)
      const healthScore = invoiceCount > 0 
        ? Math.max(0, 100 - Math.floor((allIssues.length / invoiceCount) * 100))
        : 100;

      return {
        isConsistent: allIssues.length === 0,
        issues: allIssues,
        lastChecked: new Date().toISOString(),
        invoiceCount,
        healthScore
      };
    } catch (error) {
      console.error('Bulk validation error:', error);
      return {
        isConsistent: false,
        issues: [{
          type: 'data_corruption',
          severity: 'critical',
          tokenId: 0,
          description: `Bulk validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          autoHealable: false
        }],
        lastChecked: new Date().toISOString(),
        invoiceCount,
        healthScore: 0
      };
    }
  }

  /**
   * Auto-heal consistency issues
   */
  async autoHealIssues(issues: ConsistencyIssue[]): Promise<{ healed: number; failed: number }> {
    let healed = 0;
    let failed = 0;

    for (const issue of issues) {
      if (!issue.autoHealable) {
        console.log(`⏭️ Skipping non-healable issue: ${issue.description}`);
        failed++;
        continue;
      }

      try {
        switch (issue.type) {
          case 'missing_metadata':
            await this.healMissingMetadata(issue);
            healed++;
            break;

          case 'missing_payment':
            await this.healMissingPayment(issue);
            healed++;
            break;

          case 'amount_mismatch':
            await this.healAmountMismatch(issue);
            healed++;
            break;

          default:
            console.log(`⚠️ Unknown issue type: ${issue.type}`);
            failed++;
        }
      } catch (error) {
        console.error(`❌ Failed to heal issue for token ${issue.tokenId}:`, error);
        failed++;
      }
    }

    return { healed, failed };
  }

  /**
   * Heal missing metadata by scheduling compensation
   */
  private async healMissingMetadata(issue: ConsistencyIssue): Promise<void> {
    console.log(`🔧 Healing missing metadata for token ${issue.tokenId}`);
    
    await compensationService.scheduleCompensation({
      task_type: 'metadata_sync',
      token_id: issue.tokenId,
      payload: {
        exporter_wallet: issue.contractData[1], // exporterWallet from contract
        invoice_number: `INV-${issue.tokenId}`,
        importer_name: issue.contractData[2], // importerCompany from contract
        documents: {}
      },
      priority: 'high'
    });
  }

  /**
   * Heal missing payment record by scheduling compensation
   */
  private async healMissingPayment(issue: ConsistencyIssue): Promise<void> {
    console.log(`🔧 Healing missing payment for token ${issue.tokenId}`);
    
    const shippingAmount = Number(issue.contractData[4]); // shippingAmount in cents
    
    await compensationService.scheduleCompensation({
      task_type: 'payment_link',
      token_id: issue.tokenId,
      payload: {
        amount_usd: shippingAmount,
        interest_amount: 0,
        total_due: shippingAmount,
        payment_link: `/pay/${issue.tokenId}`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      priority: 'normal'
    });
  }

  /**
   * Heal amount mismatch by updating database from contract (source of truth)
   */
  private async healAmountMismatch(issue: ConsistencyIssue): Promise<void> {
    console.log(`🔧 Healing amount mismatch for token ${issue.tokenId}`);
    
    const correctAmount = Number(issue.contractData[4]); // shippingAmount from contract
    
    const { error } = await supabase
      .from('payments')
      .update({
        amount_usd: correctAmount,
        total_due: correctAmount,
        updated_at: new Date().toISOString()
      })
      .eq('token_id', issue.tokenId);

    if (error) {
      throw new Error(`Failed to update payment amount: ${error.message}`);
    }

    console.log(`✅ Updated payment amount to ${correctAmount} cents`);
  }

  /**
   * Fetch invoice data from smart contract
   */
  private async fetchContractInvoice(tokenId: bigint): Promise<any | null> {
    try {
      const { createThirdwebClient } = await import('thirdweb');
      const { getContract } = await import('thirdweb');
      const { readContract } = await import('thirdweb');
      const { liskSepolia } = await import('panna-sdk');
      
      const client = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'demo',
      });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT || '0x8Da2dF6050158ae8B058b90B37851323eFd69E16';
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: invoiceNFTAddress as `0x${string}`,
      });

      const invoiceData = await readContract({
        contract,
        method: 'function getInvoice(uint256 invoiceId) view returns (string exporterCompany, address exporterWallet, string importerCompany, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, uint256 amountInvested, uint256 amountWithdrawn, uint8 status)',
        params: [tokenId],
      });

      return invoiceData;
    } catch (error) {
      console.error('Failed to fetch contract invoice:', error);
      return null;
    }
  }
}

export const consistencyService = new DataConsistencyService();

/**
 * Scheduled task to run periodic consistency checks
 */
export async function runPeriodicConsistencyCheck(): Promise<ValidationResult> {
  console.log('🔍 Running periodic consistency check...');
  
  const result = await consistencyService.validateAllInvoices();
  
  console.log(`📊 Consistency Check Results:`, {
    isConsistent: result.isConsistent,
    issuesFound: result.issues.length,
    healthScore: result.healthScore,
    invoiceCount: result.invoiceCount
  });

  // Auto-heal if there are healable issues
  const healableIssues = result.issues.filter(issue => issue.autoHealable);
  
  if (healableIssues.length > 0) {
    console.log(`🔧 Auto-healing ${healableIssues.length} issues...`);
    const healResult = await consistencyService.autoHealIssues(healableIssues);
    console.log(`✅ Healed: ${healResult.healed}, ❌ Failed: ${healResult.failed}`);
  }

  return result;
}
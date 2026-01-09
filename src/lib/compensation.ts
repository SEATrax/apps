import { supabase } from './supabase';

export interface CompensationTask {
  id?: string;
  task_type: 'metadata_sync' | 'payment_link' | 'ipfs_cleanup';
  token_id: number;
  payload: any;
  attempts?: number;
  max_attempts?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  next_retry?: string;
  error_message?: string;
}

export interface MetadataSyncPayload {
  exporter_wallet: string;
  invoice_number: string;
  goods_description?: string;
  importer_name: string;
  importer_license?: string;
  documents: Record<string, string>;
  shipping_details?: any;
}

export interface PaymentLinkPayload {
  amount_usd: number;
  interest_amount: number;
  total_due: number;
  due_date: string;
  payment_link: string;
}

export interface TransactionState {
  contractTxHash?: string;
  tokenId?: bigint;
  metadataId?: string;
  paymentId?: string;
  ipfsHashes?: string[];
  warnings: string[];
}

class CompensationService {
  /**
   * Schedule a compensation task for later execution
   */
  async scheduleCompensation(task: CompensationTask): Promise<void> {
    try {
      const { error } = await supabase
        .from('compensation_queue')
        .insert({
          task_type: task.task_type,
          token_id: task.token_id,
          payload: task.payload,
          max_attempts: task.max_attempts || 3,
          priority: task.priority || 'normal',
          next_retry: new Date(Date.now() + (task.priority === 'critical' ? 5000 : 30000)).toISOString() // 5s for critical, 30s for others
        });

      if (error) {
        console.error('Failed to schedule compensation task:', error);
        throw new Error(`Compensation scheduling failed: ${error.message}`);
      }

      console.log(`📋 Scheduled ${task.task_type} compensation for tokenId ${task.token_id}`);
    } catch (error) {
      console.error('Compensation scheduling error:', error);
      // Don't throw - this is non-critical for the main flow
    }
  }

  /**
   * Attempt to save metadata with retry logic
   */
  async saveMetadataWithRetry(tokenId: bigint, payload: MetadataSyncPayload, maxAttempts: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('invoice_metadata')
          .insert({
            token_id: Number(tokenId),
            exporter_wallet: payload.exporter_wallet,
            invoice_number: payload.invoice_number,
            goods_description: payload.goods_description,
            importer_name: payload.importer_name,
            importer_license: payload.importer_license,
            documents: payload.documents,
            shipping_details: payload.shipping_details
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`✅ Metadata saved successfully (attempt ${attempt}):`, data.id);
        return data.id;
      } catch (error) {
        console.warn(`⚠️ Metadata save attempt ${attempt}/${maxAttempts} failed:`, error);
        
        if (attempt === maxAttempts) {
          // Schedule for background compensation
          await this.scheduleCompensation({
            task_type: 'metadata_sync',
            token_id: Number(tokenId),
            payload,
            priority: 'high',
            max_attempts: 5
          });
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    throw new Error('Max attempts reached');
  }

  /**
   * Attempt to create payment link with retry logic
   */
  async createPaymentWithRetry(tokenId: bigint, payload: PaymentLinkPayload, maxAttempts: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .insert({
            invoice_id: Number(tokenId),
            token_id: Number(tokenId),
            amount_usd: payload.amount_usd,
            interest_amount: payload.interest_amount,
            total_due: payload.total_due,
            payment_link: payload.payment_link,
            status: 'link_generated',
            due_date: payload.due_date
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`✅ Payment link created successfully (attempt ${attempt}):`, data.id);
        return data.id;
      } catch (error) {
        console.warn(`⚠️ Payment creation attempt ${attempt}/${maxAttempts} failed:`, error);
        
        if (attempt === maxAttempts) {
          // Schedule for background compensation
          await this.scheduleCompensation({
            task_type: 'payment_link',
            token_id: Number(tokenId),
            payload,
            priority: 'normal',
            max_attempts: 3
          });
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    throw new Error('Max attempts reached');
  }

  /**
   * Process pending compensation tasks (to be run periodically)
   */
  async processCompensationQueue(): Promise<void> {
    try {
      const { data: tasks, error } = await supabase
        .from('compensation_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('next_retry', new Date().toISOString())
        .lt('attempts', 'max_attempts')
        .order('priority', { ascending: false }) // Critical tasks first
        .limit(10);

      if (error) throw error;

      for (const task of tasks || []) {
        await this.executeCompensationTask(task);
      }
    } catch (error) {
      console.error('Error processing compensation queue:', error);
    }
  }

  private async executeCompensationTask(task: any): Promise<void> {
    try {
      // Mark as processing
      await supabase
        .from('compensation_queue')
        .update({ 
          status: 'processing',
          attempts: task.attempts + 1
        })
        .eq('id', task.id);

      let success = false;

      switch (task.task_type) {
        case 'metadata_sync':
          try {
            await this.saveMetadataWithRetry(BigInt(task.token_id), task.payload, 1);
            success = true;
          } catch (error) {
            console.error('Compensation metadata sync failed:', error);
          }
          break;

        case 'payment_link':
          try {
            await this.createPaymentWithRetry(BigInt(task.token_id), task.payload, 1);
            success = true;
          } catch (error) {
            console.error('Compensation payment link creation failed:', error);
          }
          break;

        case 'ipfs_cleanup':
          // TODO: Implement IPFS cleanup
          success = true;
          break;
      }

      if (success) {
        await supabase
          .from('compensation_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);
      } else {
        const isLastAttempt = task.attempts + 1 >= task.max_attempts;
        await supabase
          .from('compensation_queue')
          .update({ 
            status: isLastAttempt ? 'failed' : 'pending',
            next_retry: new Date(Date.now() + (task.attempts + 1) * 60000).toISOString(), // Exponential backoff
            error_message: 'Task execution failed'
          })
          .eq('id', task.id);
      }
    } catch (error) {
      console.error('Compensation task execution error:', error);
    }
  }
}

export const compensationService = new CompensationService();

/**
 * Check system health for components
 */
export async function checkSystemHealth() {
  const health = {
    supabaseConnection: false,
    contractConnection: true, // Assume true for now, can be enhanced
    ipfsConnection: true, // Assume true for now, can be enhanced
    consensusStatus: 'healthy' as 'healthy' | 'degraded' | 'critical',
    lastChecked: new Date().toISOString(),
    details: {
      supabaseLatency: 0,
      contractLatency: 0,
      ipfsLatency: 0
    }
  };

  // Test Supabase connection with latency tracking
  const supabaseStart = Date.now();
  try {
    const { error } = await supabase.from('invoice_metadata').select('count').limit(1);
    health.supabaseConnection = !error;
    health.details.supabaseLatency = Date.now() - supabaseStart;
    
    if (error) {
      console.warn('⚠️ Supabase health check failed:', error.message);
    }
  } catch (error) {
    console.warn('❌ Supabase health check failed:', error);
    health.supabaseConnection = false;
    health.details.supabaseLatency = Date.now() - supabaseStart;
  }

  // Test contract connection (basic check)
  const contractStart = Date.now();
  try {
    // We can't easily test contract from server-side, so we check env vars
    const hasContractConfig = !!(
      process.env.NEXT_PUBLIC_INVOICE_NFT &&
      process.env.NEXT_PUBLIC_POOL_NFT &&
      process.env.NEXT_PUBLIC_ACCESS_CONTROL
    );
    
    health.contractConnection = hasContractConfig;
    health.details.contractLatency = Date.now() - contractStart;
    
    if (!hasContractConfig) {
      console.warn('⚠️ Contract configuration missing');
    }
  } catch (error) {
    console.warn('❌ Contract health check failed:', error);
    health.contractConnection = false;
    health.details.contractLatency = Date.now() - contractStart;
  }

  // Determine overall status
  if (!health.supabaseConnection && !health.contractConnection) {
    health.consensusStatus = 'critical';
    console.error('🚨 CRITICAL: Both database and contract unavailable');
  } else if (!health.supabaseConnection || !health.contractConnection) {
    health.consensusStatus = 'degraded';
    console.warn('⚠️ DEGRADED: One component unavailable');
  } else {
    health.consensusStatus = 'healthy';
    console.log('✅ HEALTHY: All systems operational');
  }

  // Log health metrics
  console.log('📊 Health Check Results:', {
    status: health.consensusStatus,
    supabase: health.supabaseConnection ? '✅' : '❌',
    contract: health.contractConnection ? '✅' : '❌',
    latency: health.details
  });

  return health;
}

/**
 * Get degraded mode behavior recommendations
 */
export function getDegradedModeBehavior(health: Awaited<ReturnType<typeof checkSystemHealth>>) {
  const behaviors = {
    allowInvoiceCreation: false,
    allowPayments: false,
    allowPoolCreation: false,
    showWarningBanner: false,
    warningMessage: '',
    recommendedAction: '',
    fallbackMode: 'none' as 'none' | 'database' | 'contract' | 'readonly'
  };

  switch (health.consensusStatus) {
    case 'healthy':
      behaviors.allowInvoiceCreation = true;
      behaviors.allowPayments = true;
      behaviors.allowPoolCreation = true;
      behaviors.fallbackMode = 'none';
      break;

    case 'degraded':
      if (health.contractConnection && !health.supabaseConnection) {
        // Contract works, database down
        behaviors.allowInvoiceCreation = true; // Can create on-chain
        behaviors.allowPayments = false; // Need database for payment tracking
        behaviors.allowPoolCreation = true; // Can create on-chain
        behaviors.showWarningBanner = true;
        behaviors.warningMessage = 'Database temporarily unavailable. Metadata will be synchronized when service restores.';
        behaviors.recommendedAction = 'Invoice creation will work but metadata sync will be delayed.';
        behaviors.fallbackMode = 'contract';
      } else if (!health.contractConnection && health.supabaseConnection) {
        // Database works, contract down
        behaviors.allowInvoiceCreation = false; // Can't create on-chain
        behaviors.allowPayments = true; // Can still process payments
        behaviors.allowPoolCreation = false;
        behaviors.showWarningBanner = true;
        behaviors.warningMessage = 'Smart contract temporarily unavailable. Some features are disabled.';
        behaviors.recommendedAction = 'Please wait for blockchain connection to restore.';
        behaviors.fallbackMode = 'database';
      }
      break;

    case 'critical':
      behaviors.allowInvoiceCreation = false;
      behaviors.allowPayments = false;
      behaviors.allowPoolCreation = false;
      behaviors.showWarningBanner = true;
      behaviors.warningMessage = 'Platform experiencing technical difficulties. Please try again later.';
      behaviors.recommendedAction = 'All write operations are temporarily disabled. Read-only mode active.';
      behaviors.fallbackMode = 'readonly';
      break;
  }

  return behaviors;
}
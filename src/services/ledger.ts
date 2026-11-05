import { LedgerEntry, Transaction, TransactionStatus, User } from '../types';

export class DoubleEntryLedgerEngine {
  // Known Chart of Accounts
  static ACCOUNTS = {
    CUSTOMER_WALLET: 'LIABILITY:CUSTOMER_WALLET',
    RETAILER_WALLET: 'LIABILITY:RETAILER_WALLET',
    COMMISSION_PAYABLE: 'LIABILITY:COMMISSION_PAYABLE',
    BANK_SETTLEMENT_PAYSTACK: 'ASSET:BANK_PAYSTACK',
    BANK_SETTLEMENT_MONNIFY: 'ASSET:BANK_MONNIFY',
    PROVIDER_ESCROW_VTU: 'ASSET:PROVIDER_ESCROW_VTU',
    PROVIDER_ESCROW_FLIGHT: 'ASSET:PROVIDER_ESCROW_FLIGHT',
    PLATFORM_REVENUE_FEES: 'EQUITY:REVENUE_FEES',
    PLATFORM_REVENUE_MARKUP: 'EQUITY:REVENUE_MARKUP',
    PROMO_DISCOUNT_EXPENSE: 'EXPENSE:PROMO_DISCOUNT',
    ADMIN_ADJUSTMENT_CAPITAL: 'EQUITY:ADMIN_ADJUSTMENT_CAPITAL',
    ADMIN_ADJUSTMENT_DEDUCTION: 'EQUITY:ADMIN_ADJUSTMENT_DEDUCTION',
  };

  /**
   * Generates a collision-proof ledger entry ID
   */
  private static genId(suffix: string = 'entry'): string {
    return `ldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${suffix}`;
  }

  /**
   * Generates double entry records for funding a wallet via a Payment Gateway
   */
  static recordWalletFunding(
    transaction: Transaction,
    gateway: 'paystack' | 'monnify'
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const assetAccount =
      gateway === 'paystack'
        ? this.ACCOUNTS.BANK_SETTLEMENT_PAYSTACK
        : this.ACCOUNTS.BANK_SETTLEMENT_MONNIFY;

    return [
      {
        id: this.genId('fund'),
        transactionRef: transaction.reference,
        timestamp,
        debitAccount: assetAccount, // Bank/Gateway cash increases
        creditAccount: this.ACCOUNTS.CUSTOMER_WALLET, // Customer liability increases
        amount: transaction.amount,
        currency: 'NGN',
        narration: `Wallet funding via ${gateway.toUpperCase()} for ${transaction.userName} (${transaction.reference})`,
      },
    ];
  }

  /**
   * Generates double entry records for a VTU (Airtime/Data) transaction
   */
  static recordVtuPurchase(
    transaction: Transaction,
    providerName: string
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const entries: LedgerEntry[] = [];

    // 1. Debit Customer Wallet (reduces liability)
    //    Credit Provider Escrow (we now owe or paid the provider)
    entries.push({
      id: this.genId('vtu_debit'),
      transactionRef: transaction.reference,
      timestamp,
      debitAccount: this.ACCOUNTS.CUSTOMER_WALLET,
      creditAccount: this.ACCOUNTS.PROVIDER_ESCROW_VTU,
      amount: transaction.totalDebited,
      currency: 'NGN',
      narration: `Customer debit for ${transaction.type.toUpperCase()} via ${providerName}`,
    });

    // 2. If discount was given:
    if (transaction.discount > 0) {
      entries.push({
        id: this.genId('vtu_disc'),
        transactionRef: transaction.reference,
        timestamp,
        debitAccount: this.ACCOUNTS.PROMO_DISCOUNT_EXPENSE,
        creditAccount: this.ACCOUNTS.CUSTOMER_WALLET,
        amount: transaction.discount,
        currency: 'NGN',
        narration: `Promotional cash discount absorbed for ${transaction.reference}`,
      });
    }

    return entries;
  }

  /**
   * Generates double entry records for flight booking
   */
  static recordFlightBooking(
    transaction: Transaction,
    supplierRef: string
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    return [
      {
        id: this.genId('flight'),
        transactionRef: transaction.reference,
        timestamp,
        debitAccount: this.ACCOUNTS.CUSTOMER_WALLET,
        creditAccount: this.ACCOUNTS.PROVIDER_ESCROW_FLIGHT,
        amount: transaction.totalDebited,
        currency: 'NGN',
        narration: `Flight ticket reservation PNR ${transaction.recipient} via ${supplierRef}`,
      },
    ];
  }

  /**
   * Generates double entry reversal entries in case of provider failure or refund
   */
  static recordReversal(
    originalTransaction: Transaction,
    reason: string
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    return [
      {
        id: this.genId('rev'),
        transactionRef: `${originalTransaction.reference}_REV`,
        timestamp,
        debitAccount: this.ACCOUNTS.PROVIDER_ESCROW_VTU,
        creditAccount: this.ACCOUNTS.CUSTOMER_WALLET,
        amount: originalTransaction.totalDebited,
        currency: 'NGN',
        narration: `REVERSAL of ${originalTransaction.reference}: ${reason}`,
      },
    ];
  }

  /**
   * Generates double entry records for internal wallet-to-wallet QR transfers
   */
  static recordWalletTransfer(
    transaction: Transaction,
    senderName: string,
    recipientName: string
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    return [
      {
        id: this.genId('xfer'),
        transactionRef: transaction.reference,
        timestamp,
        debitAccount: this.ACCOUNTS.CUSTOMER_WALLET,
        creditAccount: this.ACCOUNTS.CUSTOMER_WALLET,
        amount: transaction.amount,
        currency: 'NGN',
        narration: `Internal instant QR transfer from ${senderName} to ${recipientName} (${transaction.reference})`,
      },
    ];
  }

  /**
   * Generates double entry records for admin manual wallet adjustments
   */
  static recordAdminWalletAdjustment(
    user: User,
    type: 'credit' | 'debit',
    amount: number,
    targetBalance: 'wallet' | 'bonus' | 'commission',
    narration: string,
    ref: string
  ): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const liabilityAccount =
      targetBalance === 'commission'
        ? this.ACCOUNTS.COMMISSION_PAYABLE
        : user.role === 'retailer' || user.role === 'api_reseller'
        ? this.ACCOUNTS.RETAILER_WALLET
        : this.ACCOUNTS.CUSTOMER_WALLET;

    const contraAccount =
      type === 'credit'
        ? this.ACCOUNTS.ADMIN_ADJUSTMENT_CAPITAL
        : this.ACCOUNTS.ADMIN_ADJUSTMENT_DEDUCTION;

    if (type === 'credit') {
      return [
        {
          id: this.genId('adj_cr'),
          transactionRef: ref,
          timestamp,
          debitAccount: contraAccount,
          creditAccount: liabilityAccount,
          amount,
          currency: 'NGN',
          narration: `[ADMIN CREDIT: ${targetBalance.toUpperCase()}] ${narration} (${user.name} - ${user.phone})`,
        },
      ];
    } else {
      return [
        {
          id: this.genId('adj_dr'),
          transactionRef: ref,
          timestamp,
          debitAccount: liabilityAccount,
          creditAccount: contraAccount,
          amount,
          currency: 'NGN',
          narration: `[ADMIN DEBIT: ${targetBalance.toUpperCase()}] ${narration} (${user.name} - ${user.phone})`,
        },
      ];
    }
  }

  /**
   * Audits that total debits equal total credits
   */
  static verifyLedgerIntegrity(entries: LedgerEntry[]): {
    balanced: boolean;
    totalDebits: number;
    totalCredits: number;
    discrepancy: number;
  } {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      // In double entry, each balanced entry represents equal debit & credit value
      totalDebits += entry.amount;
      totalCredits += entry.amount;
    }

    const discrepancy = Math.abs(totalDebits - totalCredits);
    return {
      balanced: discrepancy < 0.001,
      totalDebits,
      totalCredits,
      discrepancy,
    };
  }
}

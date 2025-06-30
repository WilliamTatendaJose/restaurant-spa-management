import { NextRequest, NextResponse } from 'next/server';
import { transactionsApi } from '@/lib/db';
import { ZIMRAApiClient, validateZIMRAReceipt } from '@/lib/zimra-api';

// ZIMRA configuration
const ZIMRA_CONFIG = {
  apiUrl: process.env.ZIMRA_API_URL || 'https://api.zimra.co.zw/v1',
  clientId: process.env.ZIMRA_CLIENT_ID || '',
  clientSecret: process.env.ZIMRA_CLIENT_SECRET || '',
  taxNumber: process.env.ZIMRA_TAX_NUMBER || '',
  businessType: process.env.ZIMRA_BUSINESS_TYPE || 'HOSPITALITY',
};

export async function POST(request: NextRequest) {
  try {
    const { date, operatorId = 'system' } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate ZIMRA configuration
    if (
      !ZIMRA_CONFIG.clientId ||
      !ZIMRA_CONFIG.clientSecret ||
      !ZIMRA_CONFIG.taxNumber
    ) {
      return NextResponse.json(
        {
          error:
            'ZIMRA configuration is incomplete. Please check environment variables.',
        },
        { status: 500 }
      );
    }

    // Get transactions for the specified date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const allTransactions = await transactionsApi.list();
    const dailyTransactions = allTransactions.filter((tx) => {
      const txDate = new Date(tx.transaction_date);
      return (
        txDate >= startOfDay &&
        txDate <= endOfDay &&
        (tx.status === 'completed' || tx.status === 'paid')
      );
    });

    if (dailyTransactions.length === 0) {
      return NextResponse.json(
        {
          message: 'No completed transactions found for the specified date',
          receiptsSubmitted: 0,
        },
        { status: 200 }
      );
    }

    // Process each transaction and create ZIMRA receipts
    const zimraReceipts = [];
    const validationErrors = [];

    for (const transaction of dailyTransactions) {
      try {
        const transactionItems = await transactionsApi.getItems(transaction.id);
        if (!transactionItems || transactionItems.length === 0) {
          validationErrors.push(
            `Transaction ${transaction.id}: No items found`
          );
          continue;
        }

        const zimraReceipt = ZIMRAApiClient.transactionToZIMRAReceipt(
          transaction,
          transactionItems,
          ZIMRA_CONFIG.taxNumber
        );

        // Set operator ID
        zimraReceipt.operatorId = operatorId;

        // Validate the receipt data
        const validation = validateZIMRAReceipt(zimraReceipt);
        if (!validation.valid) {
          validationErrors.push(
            `Transaction ${transaction.id}: ${validation.errors.join(', ')}`
          );
          continue;
        }

        zimraReceipts.push(zimraReceipt);
      } catch (error) {
        validationErrors.push(
          `Transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (zimraReceipts.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid receipts to submit',
          validationErrors,
          receiptsSubmitted: 0,
        },
        { status: 400 }
      );
    }

    // Submit receipts in batch to ZIMRA
    const zimraClient = new ZIMRAApiClient(ZIMRA_CONFIG);
    const result = await zimraClient.submitReceiptsBatch(zimraReceipts);

    const response = {
      success: result.success,
      message: result.message,
      referenceNumber: result.referenceNumber,
      receiptsSubmitted: result.success ? zimraReceipts.length : 0,
      totalTransactions: dailyTransactions.length,
      validationErrors:
        validationErrors.length > 0 ? validationErrors : undefined,
      date: date,
    };

    if (result.success) {
      console.log(
        `ZIMRA batch receipt submission successful for ${date}: ${zimraReceipts.length} receipts`
      );
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        {
          ...response,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error submitting receipt batch to ZIMRA:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

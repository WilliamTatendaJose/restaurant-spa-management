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
    const { transactionId, operatorId = 'system' } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
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

    // Get transaction details
    const transaction = await transactionsApi.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only submit completed transactions
    if (transaction.status !== 'completed' && transaction.status !== 'paid') {
      return NextResponse.json(
        { error: 'Only completed transactions can be submitted to ZIMRA' },
        { status: 400 }
      );
    }

    // Get transaction items
    const transactionItems = await transactionsApi.getItems(transactionId);
    if (!transactionItems || transactionItems.length === 0) {
      return NextResponse.json(
        { error: 'No items found for this transaction' },
        { status: 400 }
      );
    }

    // Convert to ZIMRA receipt format
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
      return NextResponse.json(
        {
          error: 'Receipt validation failed',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Submit to ZIMRA
    const zimraClient = new ZIMRAApiClient(ZIMRA_CONFIG);
    const result = await zimraClient.submitReceipt(zimraReceipt);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        referenceNumber: result.referenceNumber,
        fiscalCode: result.fiscalCode,
        transactionId: transactionId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors,
          transactionId: transactionId,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error submitting receipt to ZIMRA:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

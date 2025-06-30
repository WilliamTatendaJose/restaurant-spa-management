import { NextRequest, NextResponse } from 'next/server';
import { ZIMRAApiClient } from '@/lib/zimra-api';

// ZIMRA configuration
const ZIMRA_CONFIG = {
  apiUrl: process.env.ZIMRA_API_URL || 'https://api.zimra.co.zw/v1',
  clientId: process.env.ZIMRA_CLIENT_ID || '',
  clientSecret: process.env.ZIMRA_CLIENT_SECRET || '',
  taxNumber: process.env.ZIMRA_TAX_NUMBER || '',
  businessType: process.env.ZIMRA_BUSINESS_TYPE || 'HOSPITALITY',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { referenceNumber: string } }
) {
  try {
    const { referenceNumber } = params;

    if (!referenceNumber) {
      return NextResponse.json(
        { error: 'Reference number is required' },
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

    const zimraClient = new ZIMRAApiClient(ZIMRA_CONFIG);
    const status = await zimraClient.getSubmissionStatus(referenceNumber);

    return NextResponse.json({
      referenceNumber,
      status: status.status,
      message: status.message,
      submissionDate: status.submission_date,
      processedDate: status.processed_date,
      details: status.details,
    });
  } catch (error) {
    console.error('Error checking ZIMRA submission status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check submission status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

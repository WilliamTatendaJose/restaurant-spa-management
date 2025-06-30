// ZIMRA API client for Zimbabwe Revenue Authority
'use client';

interface ZIMRAConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  taxNumber: string;
  businessType: string;
}

interface DailyReturn {
  date: string;
  grossSales: number;
  vatAmount: number;
  netSales: number;
  transactionCount: number;
  breakdown: {
    spa: {
      sales: number;
      vat: number;
      transactionCount: number;
    };
    restaurant: {
      sales: number;
      vat: number;
      transactionCount: number;
    };
  };
}

interface ZIMRAReceipt {
  receiptNumber: string;
  fiscalCode: string;
  dateTime: string;
  customerInfo?: {
    name: string;
    taxNumber?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    category: 'SPA_SERVICES' | 'RESTAURANT_SERVICES';
  }>;
  totals: {
    grossAmount: number;
    vatAmount: number;
    netAmount: number;
  };
  paymentMethod: string;
  operatorId?: string;
}

interface ZIMRAResponse {
  success: boolean;
  message: string;
  referenceNumber?: string;
  fiscalCode?: string;
  errors?: string[];
}

export class ZIMRAApiClient {
  private config: ZIMRAConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: ZIMRAConfig) {
    this.config = config;
  }

  // Authenticate with ZIMRA API
  private async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (
        this.accessToken &&
        this.tokenExpiry &&
        this.tokenExpiry > new Date()
      ) {
        return this.accessToken;
      }

      const response = await fetch(`${this.config.apiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
          scope: 'tax_returns',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Set token expiry (usually 1 hour, but use the provided expires_in value)
      const expiresIn = data.expires_in || 3600; // Default to 1 hour
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      if (!this.accessToken) {
        throw new Error('No access token received from ZIMRA API');
      }

      return this.accessToken;
    } catch (error) {
      console.error('ZIMRA authentication error:', error);
      throw new Error('Failed to authenticate with ZIMRA API');
    }
  }

  // Submit individual receipt to ZIMRA
  async submitReceipt(receipt: ZIMRAReceipt): Promise<ZIMRAResponse> {
    try {
      const token = await this.authenticate();

      const payload = {
        taxpayer_number: this.config.taxNumber,
        business_type: this.config.businessType,
        receipt: {
          receipt_number: receipt.receiptNumber,
          fiscal_code: receipt.fiscalCode,
          date_time: receipt.dateTime,
          customer: receipt.customerInfo,
          line_items: receipt.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            vat_rate: item.vatRate,
            vat_amount: item.vatAmount,
            total_amount: item.totalAmount,
            service_category: item.category,
          })),
          totals: {
            gross_amount: receipt.totals.grossAmount,
            vat_amount: receipt.totals.vatAmount,
            net_amount: receipt.totals.netAmount,
          },
          payment_method: receipt.paymentMethod,
          operator_id: receipt.operatorId,
        },
        submission_timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.config.apiUrl}/receipts/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || 'Receipt submission failed',
          errors: responseData.errors || [
            `HTTP ${response.status}: ${response.statusText}`,
          ],
        };
      }

      return {
        success: true,
        message: responseData.message || 'Receipt submitted successfully',
        referenceNumber: responseData.reference_number,
        fiscalCode: responseData.fiscal_code,
      };
    } catch (error) {
      console.error('ZIMRA receipt submission error:', error);
      return {
        success: false,
        message: 'Failed to submit receipt to ZIMRA',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Submit multiple receipts in batch
  async submitReceiptsBatch(receipts: ZIMRAReceipt[]): Promise<ZIMRAResponse> {
    try {
      const token = await this.authenticate();

      const payload = {
        taxpayer_number: this.config.taxNumber,
        business_type: this.config.businessType,
        receipts: receipts.map((receipt) => ({
          receipt_number: receipt.receiptNumber,
          fiscal_code: receipt.fiscalCode,
          date_time: receipt.dateTime,
          customer: receipt.customerInfo,
          line_items: receipt.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            vat_rate: item.vatRate,
            vat_amount: item.vatAmount,
            total_amount: item.totalAmount,
            service_category: item.category,
          })),
          totals: {
            gross_amount: receipt.totals.grossAmount,
            vat_amount: receipt.totals.vatAmount,
            net_amount: receipt.totals.netAmount,
          },
          payment_method: receipt.paymentMethod,
          operator_id: receipt.operatorId,
        })),
        batch_size: receipts.length,
        submission_timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.config.apiUrl}/receipts/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || 'Batch receipt submission failed',
          errors: responseData.errors || [
            `HTTP ${response.status}: ${response.statusText}`,
          ],
        };
      }

      return {
        success: true,
        message:
          responseData.message ||
          `${receipts.length} receipts submitted successfully`,
        referenceNumber: responseData.batch_reference_number,
      };
    } catch (error) {
      console.error('ZIMRA batch receipt submission error:', error);
      return {
        success: false,
        message: 'Failed to submit receipt batch to ZIMRA',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Submit daily tax return to ZIMRA
  async submitDailyReturn(dailyReturn: DailyReturn): Promise<ZIMRAResponse> {
    try {
      const token = await this.authenticate();

      const payload = {
        taxpayer_number: this.config.taxNumber,
        business_type: this.config.businessType,
        return_period: dailyReturn.date,
        return_type: 'DAILY_VAT',
        declaration: {
          gross_sales: dailyReturn.grossSales,
          vat_amount: dailyReturn.vatAmount,
          net_sales: dailyReturn.netSales,
          transaction_count: dailyReturn.transactionCount,
          business_breakdown: [
            {
              category: 'SPA_SERVICES',
              gross_sales: dailyReturn.breakdown.spa.sales,
              vat_amount: dailyReturn.breakdown.spa.vat,
              transaction_count: dailyReturn.breakdown.spa.transactionCount,
            },
            {
              category: 'RESTAURANT_SERVICES',
              gross_sales: dailyReturn.breakdown.restaurant.sales,
              vat_amount: dailyReturn.breakdown.restaurant.vat,
              transaction_count:
                dailyReturn.breakdown.restaurant.transactionCount,
            },
          ],
        },
        submission_timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.config.apiUrl}/returns/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || 'Submission failed',
          errors: responseData.errors || [
            `HTTP ${response.status}: ${response.statusText}`,
          ],
        };
      }

      return {
        success: true,
        message: responseData.message || 'Daily return submitted successfully',
        referenceNumber: responseData.reference_number,
      };
    } catch (error) {
      console.error('ZIMRA submission error:', error);
      return {
        success: false,
        message: 'Failed to submit daily return to ZIMRA',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Get submission status
  async getSubmissionStatus(referenceNumber: string): Promise<any> {
    try {
      const token = await this.authenticate();

      const response = await fetch(
        `${this.config.apiUrl}/returns/status/${referenceNumber}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get status: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('ZIMRA status check error:', error);
      throw error;
    }
  }

  // Validate tax number format
  static validateTaxNumber(taxNumber: string): boolean {
    // ZIMRA tax numbers are typically 10 digits
    const zimraTaxRegex = /^\d{10}$/;
    return zimraTaxRegex.test(taxNumber);
  }

  // Generate fiscal receipt code
  static generateFiscalCode(
    taxNumber: string,
    receiptNumber: string,
    dateTime: Date
  ): string {
    // ZIMRA fiscal code format: TAXPAYER_RECEIPT_YYYYMMDDHHMMSS
    const timestamp = dateTime.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    return `${taxNumber}_${receiptNumber}_${timestamp}`;
  }

  // Convert transaction to ZIMRA receipt format
  static transactionToZIMRAReceipt(
    transaction: any,
    transactionItems: any[],
    taxNumber: string,
    vatRate: number = 14
  ): ZIMRAReceipt {
    const dateTime = new Date(transaction.transaction_date);
    const fiscalCode = this.generateFiscalCode(
      taxNumber,
      transaction.id,
      dateTime
    );

    const items = transactionItems.map((item) => {
      const unitPrice = item.price;
      const totalAmount = unitPrice * item.quantity;
      const vatAmount = calculateZimbabweVAT(totalAmount, vatRate).vatAmount;

      return {
        description: item.item_name,
        quantity: item.quantity,
        unitPrice: unitPrice,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        category: (transaction.transaction_type === 'spa'
          ? 'SPA_SERVICES'
          : 'RESTAURANT_SERVICES') as 'SPA_SERVICES' | 'RESTAURANT_SERVICES',
      };
    });

    const grossAmount = transaction.total_amount;
    const vatTotals = calculateZimbabweVAT(grossAmount, vatRate);

    return {
      receiptNumber: transaction.id,
      fiscalCode: fiscalCode,
      dateTime: dateTime.toISOString(),
      customerInfo: transaction.customer_name
        ? {
            name: transaction.customer_name,
          }
        : undefined,
      items: items,
      totals: {
        grossAmount: grossAmount,
        vatAmount: vatTotals.vatAmount,
        netAmount: vatTotals.netAmount,
      },
      paymentMethod: transaction.payment_method || 'cash',
    };
  }
}

// Helper function to calculate VAT (14% in Zimbabwe as of 2024)
export function calculateZimbabweVAT(
  amount: number,
  vatRate: number = 14
): { vatAmount: number; netAmount: number } {
  const vatAmount = (amount * vatRate) / 100;
  const netAmount = amount - vatAmount;

  return {
    vatAmount: Number(vatAmount.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
  };
}

// Helper function to format currency for Zimbabwe (USD is commonly used)
export function formatZWLCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZW', {
    style: 'currency',
    currency: 'USD', // Most businesses in Zimbabwe use USD
    minimumFractionDigits: 2,
  }).format(amount);
}

// Helper function to validate ZIMRA receipt data
export function validateZIMRAReceipt(receipt: ZIMRAReceipt): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!receipt.receiptNumber) {
    errors.push('Receipt number is required');
  }

  if (!receipt.fiscalCode) {
    errors.push('Fiscal code is required');
  }

  if (!receipt.dateTime) {
    errors.push('Date and time are required');
  }

  if (!receipt.items || receipt.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (receipt.items) {
    receipt.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }
    });
  }

  if (!receipt.paymentMethod) {
    errors.push('Payment method is required');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

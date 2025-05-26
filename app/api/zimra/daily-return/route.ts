import { NextRequest, NextResponse } from "next/server"
import { transactionsApi } from "@/lib/db"
import { ZIMRAApiClient, calculateZimbabweVAT, validateZIMRAReceipt } from "@/lib/zimra-api"

// ZIMRA configuration - these should be environment variables in production
const ZIMRA_CONFIG = {
  apiUrl: process.env.ZIMRA_API_URL || "https://api.zimra.co.zw/v1",
  clientId: process.env.ZIMRA_CLIENT_ID || "",
  clientSecret: process.env.ZIMRA_CLIENT_SECRET || "",
  taxNumber: process.env.ZIMRA_TAX_NUMBER || "",
  businessType: process.env.ZIMRA_BUSINESS_TYPE || "HOSPITALITY"
}

export async function POST(request: NextRequest) {
  try {
    const { date, includeReceipts = false } = await request.json()
    
    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      )
    }

    // Validate ZIMRA configuration
    if (!ZIMRA_CONFIG.clientId || !ZIMRA_CONFIG.clientSecret || !ZIMRA_CONFIG.taxNumber) {
      return NextResponse.json(
        { error: "ZIMRA configuration is incomplete. Please check environment variables." },
        { status: 500 }
      )
    }

    // Get transactions for the specified date
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const allTransactions = await transactionsApi.list()
    const dailyTransactions = allTransactions.filter(tx => {
      const txDate = new Date(tx.transaction_date)
      return txDate >= startOfDay && 
             txDate <= endOfDay && 
             (tx.status === "completed" || tx.status === "paid")
    })

    if (dailyTransactions.length === 0) {
      return NextResponse.json(
        { message: "No transactions found for the specified date", submitted: false },
        { status: 200 }
      )
    }

    // Calculate daily totals
    let totalSales = 0
    let spaTransactions = 0
    let restaurantTransactions = 0
    let spaSales = 0
    let restaurantSales = 0

    dailyTransactions.forEach(tx => {
      const amount = tx.total_amount || 0
      totalSales += amount

      if (tx.transaction_type === "spa") {
        spaSales += amount
        spaTransactions++
      } else {
        restaurantSales += amount
        restaurantTransactions++
      }
    })

    // Calculate VAT (Zimbabwe VAT rate is 14% as of 2024)
    const vatRate = 14
    const totalVAT = calculateZimbabweVAT(totalSales, vatRate)
    const spaVAT = calculateZimbabweVAT(spaSales, vatRate)
    const restaurantVAT = calculateZimbabweVAT(restaurantSales, vatRate)

    // Prepare daily return data
    const dailyReturn = {
      date: date,
      grossSales: totalSales,
      vatAmount: totalVAT.vatAmount,
      netSales: totalVAT.netAmount,
      transactionCount: dailyTransactions.length,
      breakdown: {
        spa: {
          sales: spaSales,
          vat: spaVAT.vatAmount,
          transactionCount: spaTransactions
        },
        restaurant: {
          sales: restaurantSales,
          vat: restaurantVAT.vatAmount,
          transactionCount: restaurantTransactions
        }
      }
    }

    const zimraClient = new ZIMRAApiClient(ZIMRA_CONFIG)
    let receiptResults = null

    // Optionally submit receipts first if requested
    if (includeReceipts) {
      const zimraReceipts = []
      const validationErrors = []

      for (const transaction of dailyTransactions) {
        try {
          const transactionItems = await transactionsApi.getItems(transaction.id)
          if (!transactionItems || transactionItems.length === 0) {
            validationErrors.push(`Transaction ${transaction.id}: No items found`)
            continue
          }

          const zimraReceipt = ZIMRAApiClient.transactionToZIMRAReceipt(
            transaction,
            transactionItems,
            ZIMRA_CONFIG.taxNumber
          )

          zimraReceipt.operatorId = 'system'

          const validation = validateZIMRAReceipt(zimraReceipt)
          if (!validation.valid) {
            validationErrors.push(`Transaction ${transaction.id}: ${validation.errors.join(', ')}`)
            continue
          }

          zimraReceipts.push(zimraReceipt)
        } catch (error) {
          validationErrors.push(`Transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (zimraReceipts.length > 0) {
        receiptResults = await zimraClient.submitReceiptsBatch(zimraReceipts)
      }
    }

    // Submit daily return to ZIMRA
    const result = await zimraClient.submitDailyReturn(dailyReturn)

    if (result.success) {
      // Log successful submission
      console.log(`ZIMRA submission successful for ${date}:`, result.referenceNumber)
      
      type ZimraResponse = {
        success: boolean;
        message: string;
        referenceNumber: string | undefined;
        dailyReturn: typeof dailyReturn;
        submitted: boolean;
        receiptSubmission?: {
          success: boolean;
          message: string;
          referenceNumber: string | undefined;
        };
      };

      const response: ZimraResponse = {
        success: true,
        message: result.message,
        referenceNumber: result.referenceNumber,
        dailyReturn,
        submitted: true
      };

      // Include receipt submission results if applicable
      if (includeReceipts && receiptResults) {
        response.receiptSubmission = {
          success: receiptResults.success,
          message: receiptResults.message,
          referenceNumber: receiptResults.referenceNumber
        };
      }

      return NextResponse.json(response)
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: result.message,
          errors: result.errors,
          dailyReturn,
          submitted: false,
          receiptSubmission: receiptResults || undefined
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error submitting daily return to ZIMRA:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    // Get transactions for the specified date (same logic as POST but for preview)
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const allTransactions = await transactionsApi.list()
    const dailyTransactions = allTransactions.filter(tx => {
      const txDate = new Date(tx.transaction_date)
      return txDate >= startOfDay && 
             txDate <= endOfDay && 
             (tx.status === "completed" || tx.status === "paid")
    })

    // Calculate preview data
    let totalSales = 0
    let spaTransactions = 0
    let restaurantTransactions = 0
    let spaSales = 0
    let restaurantSales = 0

    dailyTransactions.forEach(tx => {
      const amount = tx.total_amount || 0
      totalSales += amount

      if (tx.transaction_type === "spa") {
        spaSales += amount
        spaTransactions++
      } else {
        restaurantSales += amount
        restaurantTransactions++
      }
    })

    const vatRate = 14
    const totalVAT = calculateZimbabweVAT(totalSales, vatRate)
    const spaVAT = calculateZimbabweVAT(spaSales, vatRate)
    const restaurantVAT = calculateZimbabweVAT(restaurantSales, vatRate)

    return NextResponse.json({
      date,
      summary: {
        totalTransactions: dailyTransactions.length,
        grossSales: totalSales,
        vatAmount: totalVAT.vatAmount,
        netSales: totalVAT.netAmount,
        breakdown: {
          spa: {
            transactions: spaTransactions,
            sales: spaSales,
            vat: spaVAT.vatAmount,
            net: spaVAT.netAmount
          },
          restaurant: {
            transactions: restaurantTransactions,
            sales: restaurantSales,
            vat: restaurantVAT.vatAmount,
            net: restaurantVAT.netAmount
          }
        }
      },
      transactions: dailyTransactions.map(tx => ({
        id: tx.id,
        time: new Date(tx.transaction_date).toLocaleTimeString(),
        customer: tx.customer_name,
        type: tx.transaction_type,
        amount: tx.total_amount,
        payment: tx.payment_method
      }))
    })

  } catch (error) {
    console.error("Error getting daily return preview:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
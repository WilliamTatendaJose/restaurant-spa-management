import { NextRequest, NextResponse } from "next/server";
import { uploadFileToS3 } from "@/lib/s3-utils";

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const transactionId = formData.get("transactionId") as string;
    
    // Validate request
    if (!file || !transactionId) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Missing file or transaction ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload file to S3
    const url = await uploadFileToS3(
      fileBuffer,
      `receipt-${transactionId.substring(0, 8)}.pdf`,
      "application/pdf"
    );
    
    // Return success response with the file URL
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: "Receipt uploaded successfully",
        url
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to upload receipt", 
        error: (error as Error).message 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
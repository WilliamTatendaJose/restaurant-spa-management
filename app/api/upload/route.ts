import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    const { fileName, fileType } = await request.json();
    const supabase = await createSupabaseServerClient();

    const fileExtension = fileName.split('.').pop();
    const newFileName = `${uuidv4()}.${fileExtension}`;
    const bucket = 'service-images'; // Make sure you have a bucket with this name in Supabase

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(newFileName);

        if (error) {
            return NextResponse.json({ error: `Failed to create signed URL: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}` });
    } catch (error: any) {
        return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
    }
} 
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        console.log('[UPLOAD] Incoming request');
        const { fileName, fileType } = await request.json();
        console.log('[UPLOAD] fileName:', fileName, 'fileType:', fileType);

        const supabase = await createSupabaseServerClient();
        console.log('[UPLOAD] Supabase client created');

        const fileExtension = fileName.split('.').pop();
        const newFileName = `${uuidv4()}.${fileExtension}`;
        const bucket = 'service-images'; // Make sure you have a bucket with this name in Supabase
        console.log('[UPLOAD] newFileName:', newFileName, 'bucket:', bucket);

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(newFileName);

        if (error) {
            console.error('[UPLOAD] Failed to create signed URL:', error);
            return NextResponse.json({ error: `Failed to create signed URL: ${error.message}` }, { status: 500 });
        }

        console.log('[UPLOAD] Signed URL created:', data);
        return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}` });
    } catch (error: any) {
        console.error('[UPLOAD] Unexpected error:', error);
        return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
    }
} 
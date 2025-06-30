"use client";

import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4'>
            <div className='max-w-md rounded-lg bg-white p-8 shadow-lg text-center'>
                <h1 className='text-3xl font-bold text-red-600 mb-4'>Access Denied</h1>
                <p className='mb-6 text-gray-700'>
                    You do not have permission to view this page.<br />
                    If you believe this is a mistake, please contact your administrator.
                </p>
                <Link href='/' className='inline-block rounded bg-primary px-6 py-2 text-white font-semibold hover:bg-primary/90 transition'>
                    Go to Home
                </Link>
            </div>
        </div>
    );
} 
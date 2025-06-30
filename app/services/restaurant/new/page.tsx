'use client';

import { MenuItemForm } from '@/components/services/menu-item-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMenuItemPage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex items-center justify-between'>
        <PageHeader
          heading='Add Menu Item'
          subheading='Create a new item for your restaurant menu'
        />
        <Button variant='outline' asChild>
          <Link href='/services/restaurant'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Menu
          </Link>
        </Button>
      </div>

      <div className='mt-6'>
        <MenuItemForm />
      </div>
    </div>
  );
}

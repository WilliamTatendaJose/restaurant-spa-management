import { CustomerList } from '@/components/customers/customer-list';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex items-center justify-between'>
        <PageHeader
          heading='Customers'
          subheading='Manage your customer database'
        />
        <Button asChild>
          <Link href='/customers/new'>
            <Plus className='mr-2 h-4 w-4' />
            New Customer
          </Link>
        </Button>
      </div>

      <div className='mt-6'>
        <CustomerList />
      </div>
    </div>
  );
}

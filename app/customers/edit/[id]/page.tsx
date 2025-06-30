import { CustomerForm } from '@/components/customers/customer-form';
import { PageHeader } from '@/components/page-header';
import { customersApi } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface EditCustomerPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const customer = await customersApi.get(id);

  if (!customer) {
    return {
      title: 'Customer Not Found',
      description: 'The requested customer could not be found.',
    };
  }

  return {
    title: `Edit ${customer.name} | Customers`,
    description: `Update the details for customer: ${customer.name}.`,
    openGraph: {
      title: `Edit ${customer.name}`,
      description: `Update the details for ${customer.name}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit ${customer.name}`,
      description: `Update the details for ${customer.name}`,
    },
  };
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const customer = await customersApi.get(params.id);

  if (!customer) {
    notFound();
  }
  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Edit Customer'
        subheading='Update customer information'
      />

      <div className='mt-6'>
        <CustomerForm customer={customer} customerId={params.id} />
      </div>
    </div>
  );
}

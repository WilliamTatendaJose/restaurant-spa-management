import { CustomerForm } from '@/components/customers/customer-form';
import { PageHeader } from '@/components/page-header';

export default function NewCustomerPage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Add Customer'
        subheading='Add a new customer to your database'
      />

      <div className='mt-6'>
        <CustomerForm />
      </div>
    </div>
  );
}

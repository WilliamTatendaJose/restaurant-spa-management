import { PageHeader } from '@/components/page-header';
import { POSInterface } from '@/components/pos/pos-interface';

export default function POSPage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Point of Sale'
        subheading='Process transactions and orders'
      />

      <div className='mt-6'>
        <POSInterface />
      </div>
    </div>
  );
}

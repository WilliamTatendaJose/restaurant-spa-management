import { SpaServiceForm } from '@/components/services/spa-service-form';
import { PageHeader } from '@/components/page-header';

export default function NewSpaServicePage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Add Spa Service'
        subheading='Create a new service offering for your spa'
      />

      <div className='mt-6'>
        <SpaServiceForm />
      </div>
    </div>
  );
}

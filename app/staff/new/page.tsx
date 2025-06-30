import { StaffForm } from '@/components/staff/staff-form';
import { PageHeader } from '@/components/page-header';

export default function NewStaffPage() {
  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Add Staff Member'
        subheading='Add a new staff member to your team'
      />

      <div className='mt-6'>
        <StaffForm />
      </div>
    </div>
  );
}

import { StaffForm } from '@/components/staff/staff-form';
import { PageHeader } from '@/components/page-header';
import { staffApi } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface EditStaffPageProps {
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
  const staff = await staffApi.get(id);

  if (!staff) {
    return {
      title: 'Staff Member Not Found',
      description: 'The requested staff member could not be found.',
    };
  }

  return {
    title: `Edit ${staff.name} | Staff`,
    description: `Update the details for staff member: ${staff.name}.`,
    openGraph: {
      title: `Edit ${staff.name}`,
      description: `Update the details for ${staff.name}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit ${staff.name}`,
      description: `Update the details for ${staff.name}`,
    },
  };
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const staff = await staffApi.get(params.id);

  if (!staff) {
    notFound();
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Edit Staff Member'
        subheading='Update staff information'
      />

      <div className='mt-6'>
        <StaffForm staff={staff} staffId={params.id} />
      </div>
    </div>
  );
}

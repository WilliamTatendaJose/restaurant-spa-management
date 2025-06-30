import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserForm } from '@/components/users/user-form';
import type { Metadata } from 'next';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!user) {
    return {
      title: 'User Not Found',
      description: 'The requested user could not be found.',
    };
  }

  return {
    title: `Edit ${user.name} | Users`,
    description: `Update the details for user: ${user.name}.`,
    openGraph: {
      title: `Edit ${user.name}`,
      description: `Update the details for ${user.name}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit ${user.name}`,
      description: `Update the details for ${user.name}`,
    },
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const supabase = await createSupabaseServerClient();

  // Get user to edit
  const { data: user } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!user) {
    notFound();
  }

  return (
    <div className='container py-10'>
      <h1 className='mb-8 text-3xl font-bold'>Edit User: {user.name}</h1>
      <UserForm user={user} />
    </div>
  );
}

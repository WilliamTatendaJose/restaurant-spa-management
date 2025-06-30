import { UserForm } from '@/components/users/user-form';

export default function NewUserPage() {
  return (
    <div className='container py-10'>
      <h1 className='mb-8 text-3xl font-bold'>Create New User</h1>
      <UserForm />
    </div>
  );
}

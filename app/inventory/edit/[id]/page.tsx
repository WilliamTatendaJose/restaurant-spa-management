import { InventoryForm } from '@/components/inventory/inventory-form';
import { PageHeader } from '@/components/page-header';
import { inventoryApi } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface EditInventoryItemPageProps {
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
  const item = await inventoryApi.get(id);

  if (!item) {
    return {
      title: 'Inventory Item Not Found',
      description: 'The requested inventory item could not be found.',
    };
  }

  return {
    title: `Edit ${item.name} | Inventory`,
    description: `Update the details for inventory item: ${item.name}.`,
    openGraph: {
      title: `Edit ${item.name}`,
      description: `Update the details for ${item.name}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit ${item.name}`,
      description: `Update the details for ${item.name}`,
    },
  };
}

export default async function EditInventoryItemPage({
  params,
}: EditInventoryItemPageProps) {
  const item = await inventoryApi.get(params.id);

  if (!item) {
    notFound();
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Edit Inventory Item'
        subheading='Update inventory item details'
      />

      <div className='mt-6'>
        <InventoryForm item={item} itemId={params.id} />
      </div>
    </div>
  );
}

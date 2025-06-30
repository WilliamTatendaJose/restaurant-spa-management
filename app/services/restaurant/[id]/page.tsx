import { menuItemsApi } from '@/lib/db';
import { MenuItemEditor } from '@/components/services/menu-item-editor';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const menuItem = await menuItemsApi.get(id);

  if (!menuItem) {
    return {
      title: 'Menu Item Not Found',
      description: 'The requested menu item could not be found.',
    };
  }

  return {
    title: `Edit ${menuItem.name} | Restaurant Menu`,
    description: `Update the details for the menu item: ${menuItem.name}. Price: $${menuItem.price}`,
    openGraph: {
      title: `Edit ${menuItem.name}`,
      description: `Update the details for ${menuItem.name}`,
      images: [
        {
          url: menuItem.image_url || '/placeholder-logo.png',
          width: 800,
          height: 600,
          alt: menuItem.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Edit ${menuItem.name}`,
      description: `Update the details for ${menuItem.name}`,
      images: [menuItem.image_url || '/placeholder-logo.png'],
    },
  };
}

export default async function EditMenuItemPage({ params }: Props) {
  const { id } = params;
  const menuItem = await menuItemsApi.get(id);

  if (!menuItem) {
    notFound();
  }

  return <MenuItemEditor menuItem={menuItem} id={id} />;
}

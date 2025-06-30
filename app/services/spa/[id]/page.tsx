import { spaServicesApi } from '@/lib/db';
import { SpaServiceEditor } from '@/components/services/spa-service-editor';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const service = await spaServicesApi.get(id);

  if (!service) {
    return {
      title: 'Service Not Found',
      description: 'The requested spa service could not be found.',
    };
  }

  return {
    title: `Edit ${service.name} | Spa Services`,
    description: `Update the details for the spa service: ${service.name}. Price: $${service.price}`,
    openGraph: {
      title: `Edit ${service.name}`,
      description: `Update the details for ${service.name}`,
      images: [
        {
          url: service.image_url || '/placeholder-logo.png',
          width: 800,
          height: 600,
          alt: service.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Edit ${service.name}`,
      description: `Update the details for ${service.name}`,
      images: [service.image_url || '/placeholder-logo.png'],
    },
  };
}

export default async function EditSpaServicePage({ params }: Props) {
  const { id } = params;
  const service = await spaServicesApi.get(id);

  if (!service) {
    notFound();
  }

  return <SpaServiceEditor service={service} id={id} />;
}

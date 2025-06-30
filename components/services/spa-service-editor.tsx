'use client';

import { SpaServiceForm } from '@/components/services/spa-service-form';
import { PageHeader } from '@/components/page-header';
import { useEffect, useState } from 'react';
import { spaServicesApi } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function SpaServiceEditor({
  service: initialService,
  id,
}: {
  service: any;
  id: string;
}) {
  const [service, setService] = useState<any>(initialService);
  const [isLoading, setIsLoading] = useState(!initialService);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialService) {
      async function fetchService() {
        try {
          setIsLoading(true);
          const serviceData = await spaServicesApi.get(id);

          if (!serviceData) {
            toast({
              title: 'Service not found',
              description: 'The requested service could not be found.',
              variant: 'destructive',
            });
            return;
          }

          setService(serviceData);
        } catch (error) {
          console.error('Error fetching service:', error);
          toast({
            title: 'Error',
            description: 'Failed to load service details. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }

      fetchService();
    }
  }, [id, initialService, toast]);

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='Edit Spa Service'
        subheading='Update service details and pricing'
      />

      <div className='mt-6'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-24 w-full' />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          </div>
        ) : service ? (
          <SpaServiceForm service={service} />
        ) : (
          <div className='py-8 text-center text-muted-foreground'>
            Service not found. It may have been deleted or the ID is invalid.
          </div>
        )}
      </div>
    </div>
  );
}

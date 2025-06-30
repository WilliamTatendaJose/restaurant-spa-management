'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useSyncStatus } from '@/components/sync-status-provider';
import { spaServicesApi } from '@/lib/db';
import Image from 'next/image';

interface SpaService {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  status?: string;
  isActive?: boolean;
  image_url?: string;
}

interface SpaServiceFormProps {
  service?: SpaService;
}

export function SpaServiceForm({ service }: SpaServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isOnline } = useSyncStatus();

  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration: service?.duration?.toString() || '60',
    price: service?.price?.toString() || '',
    category: service?.category || 'massage',
    status: service?.status || 'active',
    image_url: service?.image_url || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: checked ? 'active' : 'inactive',
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get a signed URL from our API
      const { signedUrl, publicUrl } = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      }).then((res) => res.json());

      // 2. Upload the file to the signed URL
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) {
        throw new Error('Failed to upload to storage');
      }

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        category: formData.category,
        status: formData.status,
        image_url: formData.image_url,
      };
      console.log('[SERVICE FORM] Submitting serviceData:', serviceData);

      let result;
      if (service?.id) {
        // Update existing service
        result = await spaServicesApi.update(service.id, serviceData);
        console.log('[SERVICE FORM] Update result:', result);
      } else {
        // Create new service
        result = await spaServicesApi.create(serviceData);
        console.log('[SERVICE FORM] Create result:', result);
      }

      toast({
        title: service ? 'Service updated' : 'Service created',
        description: isOnline
          ? 'The service has been successfully saved.'
          : 'The service has been saved offline and will sync when connection is restored.',
      });

      router.push('/services/spa');
      router.refresh();
    } catch (error) {
      console.error('[SERVICE FORM] Error saving service:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className='pt-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Service Name</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Enter service name'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Enter service description'
                rows={3}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='grid gap-2'>
                <Label htmlFor='category'>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleSelectChange('category', value)
                  }
                >
                  <SelectTrigger id='category'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='massage'>Massage</SelectItem>
                    <SelectItem value='facial'>Facial</SelectItem>
                    <SelectItem value='body'>Body Treatment</SelectItem>
                    <SelectItem value='nails'>Nail Care</SelectItem>
                    <SelectItem value='hair'>Hair Care</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='duration'>Duration (minutes)</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) =>
                    handleSelectChange('duration', value)
                  }
                >
                  <SelectTrigger id='duration'>
                    <SelectValue placeholder='Select duration' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='30'>30 minutes</SelectItem>
                    <SelectItem value='45'>45 minutes</SelectItem>
                    <SelectItem value='60'>60 minutes</SelectItem>
                    <SelectItem value='90'>90 minutes</SelectItem>
                    <SelectItem value='120'>120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='price'>Price ($)</Label>
                <Input
                  id='price'
                  name='price'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.price}
                  onChange={handleChange}
                  placeholder='0.00'
                  required
                />
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='status'
                checked={formData.status === 'active'}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor='status'>
                Service is active and available for booking
              </Label>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='image'>Service Image</Label>
            <Input
              id='image'
              name='image'
              type='file'
              onChange={handleFileChange}
              disabled={isUploading}
              accept='image/*'
            />
            {isUploading && (
              <p className='text-sm text-muted-foreground'>
                Uploading image...
              </p>
            )}
            {formData.image_url && (
              <div className='mt-4'>
                <Image
                  src={formData.image_url}
                  alt='Service preview'
                  width={200}
                  height={200}
                  className='rounded-md object-cover'
                />
              </div>
            )}
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/services/spa')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : service
                  ? 'Update Service'
                  : 'Create Service'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

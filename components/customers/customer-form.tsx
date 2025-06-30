'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { useSyncStatus } from '@/components/sync-status-provider';
import { customersApi } from '@/lib/db';

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  customer_type: string;
  notes?: string;
  visits?: number;
  last_visit?: string;
}

interface CustomerFormProps {
  customer?: Customer;
  customerId?: string;
}

export function CustomerForm({ customer, customerId }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isOnline } = useSyncStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!customerId && !customer);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(
    customer || null
  );

  const [formData, setFormData] = useState<Customer>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    customer_type: customer?.customer_type || 'both',
    notes: customer?.notes || '',
  });

  // Fetch customer if customerId is provided and customer is not
  useEffect(() => {
    async function fetchCustomer() {
      if (!customerId) return;

      try {
        const fetchedCustomer = await customersApi.get(customerId);
        if (fetchedCustomer) {
          // Type cast the fetched customer as a Customer
          const typedCustomer = fetchedCustomer as unknown as Customer;
          setCurrentCustomer(typedCustomer);
          setFormData({
            name: typedCustomer.name || '',
            email: typedCustomer.email || '',
            phone: typedCustomer.phone || '',
            address: typedCustomer.address || '',
            customer_type: typedCustomer.customer_type || 'both',
            notes: typedCustomer.notes || '',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Customer not found',
            variant: 'destructive',
          });
          router.push('/customers');
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch customer. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (customerId && !customer) {
      fetchCustomer();
    }
  }, [customerId, customer, toast, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (currentCustomer?.id || customerId) {
        // Update existing customer
        await customersApi.update(currentCustomer?.id || customerId!, {
          ...formData,
          // Preserve existing visits count or default to 0
          visits: currentCustomer?.visits || 0,
        });
        toast({
          title: 'Customer updated',
          description: isOnline
            ? 'Customer has been updated successfully.'
            : 'Customer has been updated offline and will sync when connection is restored.',
        });
      } else {
        // Create new customer
        await customersApi.create({
          ...formData,
          visits: 0,
          last_visit: new Date().toISOString(),
        });
        toast({
          title: 'Customer added',
          description: isOnline
            ? 'New customer has been added successfully.'
            : 'Customer has been added offline and will sync when connection is restored.',
        });
      }

      router.push('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center p-8'>
            <p>Loading customer data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Enter customer name'
                required
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter email address'
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='Enter phone number'
                  required
                />
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='address'>Address</Label>
              <Textarea
                id='address'
                name='address'
                value={formData.address}
                onChange={handleChange}
                placeholder='Enter customer address (optional)'
                rows={2}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='customer_type'>Customer Type</Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value) =>
                  handleSelectChange('customer_type', value)
                }
              >
                <SelectTrigger id='customer_type'>
                  <SelectValue placeholder='Select customer type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='spa'>Spa</SelectItem>
                  <SelectItem value='restaurant'>Restaurant</SelectItem>
                  <SelectItem value='both'>Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                name='notes'
                value={formData.notes}
                onChange={handleChange}
                placeholder='Enter any additional notes (optional)'
                rows={3}
              />
            </div>
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/customers')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : currentCustomer?.id || customerId
                  ? 'Update Customer'
                  : 'Add Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

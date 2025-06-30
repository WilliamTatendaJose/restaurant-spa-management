'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { customersApi } from '@/lib/db';

// Define the type for customers
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  last_visit?: string;
  customer_type: string;
  address?: string;
  notes?: string;
  updated_at?: string;
  created_at?: string;
}

export function CustomerList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const data = (await customersApi.list()) as Customer[];

        // Deduplicate customers by email (keep the most recent one)
        const deduplicatedCustomers = data.reduce(
          (acc: Customer[], current: Customer) => {
            const existingIndex = acc.findIndex(
              (customer) =>
                customer.email?.toLowerCase() ===
                  current.email?.toLowerCase() ||
                (customer.name?.toLowerCase() === current.name?.toLowerCase() &&
                  customer.phone === current.phone)
            );

            if (existingIndex === -1) {
              // Customer doesn't exist, add it
              acc.push(current);
            } else {
              // Customer exists, keep the one with more recent updated_at or created_at
              const existing = acc[existingIndex];
              const currentDate = new Date(
                current.updated_at || current.created_at || 0
              );
              const existingDate = new Date(
                existing.updated_at || existing.created_at || 0
              );

              if (currentDate > existingDate) {
                acc[existingIndex] = current; // Replace with newer customer
              }
            }

            return acc;
          },
          []
        );

        setCustomers(deduplicatedCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search customers...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant='outline'>Filter</Button>
      </div>

      <div className='rounded-md border'>
        {isLoading ? (
          <div className='flex items-center justify-center p-8'>
            <p>Loading customers...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Customer Type</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-4 text-center'>
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className='font-medium'>
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <p className='text-sm'>{customer.email}</p>
                        <p className='text-sm text-muted-foreground'>
                          {customer.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.visits}</TableCell>
                    <TableCell>
                      {customer.last_visit
                        ? new Date(customer.last_visit).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {customer.customer_type === 'both' ? (
                        <Badge>Spa & Restaurant</Badge>
                      ) : (
                        <Badge
                          variant={
                            customer.customer_type === 'spa'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {customer.customer_type === 'spa'
                            ? 'Spa'
                            : 'Restaurant'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='sm' asChild>
                        <Link href={`/customers/edit/${customer.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

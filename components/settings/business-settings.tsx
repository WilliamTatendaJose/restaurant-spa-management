'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { businessSettingsApi } from '@/lib/db';

interface BusinessSettings {
  id?: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: string;
  openingHours: string;
}

const defaultSettings: BusinessSettings = {
  businessName: 'Spa & Bistro',
  address: '123 Relaxation Ave, Serenity, CA 90210',
  phone: '(555) 123-4567',
  email: 'info@spaandbistro.com',
  website: 'www.spaandbistro.com',
  taxRate: '8.5',
  openingHours: 'Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm',
};

export function BusinessSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from database on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        // Use the specialized API method to get settings
        const settingsData = (await businessSettingsApi.getSettings(
          defaultSettings
        )) as BusinessSettings;
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading business settings:', error);
        toast({
          title: 'Failed to load settings',
          description: 'There was a problem loading your business settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update existing settings in the database
      if (settings.id) {
        await businessSettingsApi.update(settings.id, settings);
      } else {
        // This should rarely happen, but handle the case where id is missing
        const newSettings = await businessSettingsApi.create(settings);
        setSettings(newSettings as BusinessSettings);
      }

      toast({
        title: 'Settings saved',
        description: 'Your business settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'There was a problem saving your business settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>Loading business settings...</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center p-8'>
          <p>Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Settings</CardTitle>
        <CardDescription>Configure your business information</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-2'>
          <Label htmlFor='businessName'>Business Name</Label>
          <Input
            id='businessName'
            name='businessName'
            value={settings.businessName}
            onChange={handleChange}
            placeholder='Enter business name'
          />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='address'>Address</Label>
          <Textarea
            id='address'
            name='address'
            value={settings.address}
            onChange={handleChange}
            placeholder='Enter business address'
            rows={2}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              name='phone'
              value={settings.phone}
              onChange={handleChange}
              placeholder='Enter phone number'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              value={settings.email}
              onChange={handleChange}
              placeholder='Enter email address'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='website'>Website</Label>
            <Input
              id='website'
              name='website'
              value={settings.website}
              onChange={handleChange}
              placeholder='Enter website URL'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='taxRate'>Tax Rate (%)</Label>
            <Input
              id='taxRate'
              name='taxRate'
              type='number'
              min='0'
              step='0.1'
              value={settings.taxRate}
              onChange={handleChange}
              placeholder='Enter tax rate'
            />
          </div>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='openingHours'>Opening Hours</Label>
          <Textarea
            id='openingHours'
            name='openingHours'
            value={settings.openingHours}
            onChange={handleChange}
            placeholder='Enter opening hours'
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className='flex justify-end'>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}

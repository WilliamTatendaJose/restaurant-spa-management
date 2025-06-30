'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Code,
  Sparkles,
  ExternalLink,
  Send,
  Cpu,
  Smartphone,
  Globe,
} from 'lucide-react';

export function DeveloperContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'wjose@techrehub.co.zw', // Change to your dev email
          subject: `Contact from ${formData.name}`,
          html: `<p><b>Name:</b> ${formData.name}</p><p><b>Email:</b> ${formData.email}</p><p>${formData.message}</p>`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Message Sent!',
          description: "Thanks for your interest. I'll get back to you soon!",
        });
        setFormData({
          name: '',
          email: '',
          company: '',
          message: '',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send your message. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl'></div>
      <div className='absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl'></div>

      <div className='relative'>
        <div className='mb-12 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg'>
            <Code className='h-8 w-8 text-white' />
          </div>
          <h2 className='mb-4 text-4xl font-light text-gray-200'>
            Need a Custom Web App?
          </h2>
          <p className='mx-auto max-w-3xl text-xl text-gray-400'>
            I'm the developer behind this complex project. Let's discuss how I
            can help your business succeed with custom software solutions.
          </p>
        </div>

        <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-2'>
          {/* Services */}
          <div className='space-y-6'>
            <h3 className='mb-6 text-2xl font-medium text-emerald-800'>
              My Services
            </h3>

            <div className='grid gap-4'>
              <Card className='border-emerald-100 shadow-md transition-shadow duration-300 hover:shadow-lg'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='mr-4 rounded-lg bg-emerald-100 p-3'>
                      <Globe className='h-6 w-6 text-emerald-700' />
                    </div>
                    <div>
                      <h4 className='mb-2 text-lg font-medium text-emerald-700'>
                        Web Applications
                      </h4>
                      <p className='text-emerald-800'>
                        Custom web applications built with modern frameworks
                        like Blazor, Next.js, React, Node.js ,and ASP.NET for
                        businesses of all sizes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-emerald-100 shadow-md transition-shadow duration-300 hover:shadow-lg'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='mr-4 rounded-lg bg-emerald-100 p-3'>
                      <Smartphone className='h-6 w-6 text-emerald-700' />
                    </div>
                    <div>
                      <h4 className='mb-2 text-lg font-medium text-emerald-700'>
                        Mobile Solutions
                      </h4>
                      <p className='text-emerald-800'>
                        Cross-platform mobile applications that work seamlessly
                        on iOS and Android devices using React Native,Flutter
                        and .NET MAUI.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-emerald-100 shadow-md transition-shadow duration-300 hover:shadow-lg'>
                <CardContent className='p-6'>
                  <div className='flex items-start'>
                    <div className='mr-4 rounded-lg bg-emerald-100 p-3'>
                      <Cpu className='h-6 w-6 text-emerald-700' />
                    </div>
                    <div>
                      <h4 className='mb-2 text-lg font-medium text-emerald-700'>
                        Business Process Automation
                      </h4>
                      <p className='text-emerald-800'>
                        Streamline your business operations with custom software
                        that automates repetitive tasks and improves efficiency.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='pt-4'>
              <a
                href='https://github.com/WilliamTatendaJose'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center font-medium text-emerald-700 hover:text-emerald-800'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                View my portfolio
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <Card className='border-emerald-100 bg-white shadow-xl'>
            <CardContent className='p-8'>
              <h3 className='mb-6 text-2xl font-medium text-gray-800'>
                Get in Touch
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor='name'
                    className='text-sm font-medium text-gray-700'
                  >
                    Your Name
                  </label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder='John Doe'
                    required
                    className='border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='email'
                    className='text-sm font-medium text-gray-700'
                  >
                    Email Address
                  </label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder='your.email@example.com'
                    required
                    className='border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='company'
                    className='text-sm font-medium text-gray-700'
                  >
                    Company (Optional)
                  </label>
                  <Input
                    id='company'
                    name='company'
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder='Your Company Name'
                    className='border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='message'
                    className='text-sm font-medium text-gray-700'
                  >
                    Project Details
                  </label>
                  <Textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder='Tell me about your project and how I can help...'
                    required
                    rows={5}
                    className='resize-none border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  />
                </div>

                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full bg-gradient-to-r from-emerald-600 to-emerald-800 py-3 text-white hover:from-emerald-700 hover:to-emerald-900'
                >
                  {isSubmitting ? (
                    <>
                      <div className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className='ml-2 h-4 w-4' />
                    </>
                  )}
                </Button>

                <p className='pt-2 text-center text-xs text-gray-500'>
                  I'll get back to you within 24-48 hours
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

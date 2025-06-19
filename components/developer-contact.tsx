"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Code, Sparkles, ExternalLink, Send, Cpu, Smartphone, Globe } from "lucide-react";

export function DeveloperContact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
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
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "wjose@techrehub.co.zw", // Change to your dev email
          subject: `Contact from ${formData.name}`,
          html: `<p><b>Name:</b> ${formData.name}</p><p><b>Email:</b> ${formData.email}</p><p>${formData.message}</p>`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Message Sent!",
          description: "Thanks for your interest. I'll get back to you soon!",
        });
        setFormData({
          name: "",
          email: "",
          company: "",
          message: "",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send your message. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-lg mb-4">
            <Code className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-light text-gray-200 mb-4">Need a Custom Web App?</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            I'm the developer behind this restaurant & spa management system. Let's discuss how I can help your business succeed with custom software solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-2xl font-medium text-emerald-800 mb-6">My Services</h3>
            
            <div className="grid gap-4">
              <Card className="border-emerald-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                      <Globe className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-green-100 mb-2">Web Applications</h4>
                      <p className="text-green-200">
                        Custom web applications built with modern frameworks like Blazor, Next.js, React, Node.js ,and ASP.NET for businesses of all sizes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-emerald-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                      <Smartphone className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-green-100 mb-2">Mobile Solutions</h4>
                      <p className="text-green-200">
                        Cross-platform mobile applications that work seamlessly on iOS and Android devices using React Native,Flutter and .NET MAUI.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-emerald-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                      <Cpu className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-green-100 mb-2">Business Process Automation</h4>
                      <p className="text-green-200">
                        Streamline your business operations with custom software that automates repetitive tasks and improves efficiency.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4">
              <a 
                href="https://github.com/WilliamTatendaJose" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View my portfolio
              </a>
            </div>
          </div>
          
          {/* Contact Form */}
          <Card className="border-emerald-100 shadow-xl bg-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-medium text-gray-800 mb-6">Get in Touch</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">Your Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-gray-700">Company (Optional)</label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your Company Name"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">Project Details</label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your project and how I can help..."
                    required
                    rows={5}
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white py-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center pt-2">
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
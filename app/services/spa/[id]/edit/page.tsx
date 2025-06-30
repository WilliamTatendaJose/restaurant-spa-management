"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { spaServicesApi } from "@/lib/db";

export default function EditSpaServicePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    status: "active",
    image_url: "",
  });

  useEffect(() => {
    async function fetchService() {
      setLoading(true);
      try {
        const data = await spaServicesApi.get(id);
        if (!data) {
          toast({ title: "Not found", description: "Service not found", variant: "destructive" });
          router.replace("/services/spa");
          return;
        }
        setService(data);
        setForm({
          name: data.name || "",
          description: data.description || "",
          price: data.price?.toString() || "",
          duration: data.duration?.toString() || "",
          category: data.category || "",
          status: data.status || "active",
          image_url: data.image_url || "",
        });
      } catch (e) {
        toast({ title: "Error", description: "Failed to load service", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchService();
  }, [id, router, toast]);

  const handleChange = (e: any) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await spaServicesApi.update(id, {
        ...form,
        price: parseFloat(form.price),
        duration: parseInt(form.duration, 10),
      });
      toast({ title: "Updated", description: "Spa service updated successfully." });
      router.replace("/services/spa");
    } catch (err) {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!service) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Spa Service</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="duration">Duration (min)</Label>
          <Input id="duration" name="duration" type="number" min="0" value={form.duration} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" value={form.category} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Input id="status" name="status" value={form.status} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input id="image_url" name="image_url" value={form.image_url} onChange={handleChange} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </form>
    </div>
  );
} 
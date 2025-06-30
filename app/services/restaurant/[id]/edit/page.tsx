"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { menuItemsApi } from "@/lib/db";

export default function EditMenuItemPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const id = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        status: "active",
        image_url: "",
    });

    useEffect(() => {
        async function fetchItem() {
            setLoading(true);
            try {
                const data = await menuItemsApi.get(id);
                if (!data) {
                    toast({ title: "Not found", description: "Menu item not found", variant: "destructive" });
                    router.replace("/services/restaurant");
                    return;
                }
                setItem(data);
                setForm({
                    name: data.name || "",
                    description: data.description || "",
                    price: data.price?.toString() || "",
                    category: data.category || "",
                    status: data.status || "active",
                    image_url: data.image_url || "",
                });
            } catch (e) {
                toast({ title: "Error", description: "Failed to load menu item", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchItem();
    }, [id, router, toast]);

    const handleChange = (e: any) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            await menuItemsApi.update(id, {
                ...form,
                price: parseFloat(form.price),
            });
            toast({ title: "Updated", description: "Menu item updated successfully." });
            router.replace("/services/restaurant");
        } catch (err) {
            toast({ title: "Error", description: "Failed to update menu item", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!item) return null;

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Menu Item</h1>
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
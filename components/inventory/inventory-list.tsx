"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";
import { inventoryApi } from "@/lib/db";

// Define the type for inventory items
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  last_updated?: string;
  description?: string;
}

export function InventoryList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const items = (await inventoryApi.list()) as InventoryItem[];

        // Deduplicate items by name and category (keep the most recent one)
        const deduplicatedItems = items.reduce(
          (acc: InventoryItem[], current: InventoryItem) => {
            const existingIndex = acc.findIndex(
              (item) =>
                item.name?.toLowerCase() === current.name?.toLowerCase() &&
                item.category === current.category
            );

            if (existingIndex === -1) {
              acc.push(current);
            } else {
              // Keep the one with more recent last_updated
              const existing = acc[existingIndex];
              const currentDate = new Date(current.last_updated || 0);
              const existingDate = new Date(existing.last_updated || 0);

              if (currentDate > existingDate) {
                acc[existingIndex] = current;
              }
            }

            return acc;
          },
          []
        );

        setInventoryItems(deduplicatedItems);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading inventory...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.category === "spa" ? "secondary" : "outline"
                        }
                      >
                        {item.category === "spa" ? "Spa" : "Restaurant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.quantity <= item.reorder_level ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.last_updated
                        ? new Date(item.last_updated).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/edit/${item.id}`}>Edit</Link>
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

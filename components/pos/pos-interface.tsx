"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSyncStatus } from "@/components/sync-status-provider";
import {
  MinusCircle,
  PlusCircle,
  Receipt,
  Save,
  Trash2,
  History as HistoryIcon,
  CreditCard,
  DollarSign,
  QrCode,
} from "lucide-react";
import {
  transactionsApi,
  customersApi,
  spaServicesApi,
  menuItemsApi,
  businessSettingsApi,
  initDatabase,
  addSampleData,
} from "@/lib/db";
import { ReceiptGenerator } from "@/components/pos/receipt-generator";
import { ShareReceiptModal } from "@/components/pos/share-receipt-modal";
import { jsPDF } from "jspdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define interfaces for our data types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: "spa" | "restaurant"; // Add category to CartItem
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
}

interface SpaService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  status?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  preparation_time?: number;
  ingredients?: string;
  allergens?: string;
  image_url?: string;
  status?: string;
}

interface TransactionRecord {
  id: string;
  customer_name: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  transaction_type: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_synced?: number;
}

interface TransactionItemRecord {
  id: string;
  transaction_id: string;
  item_name: string;
  quantity: number;
  price: number;
  created_at?: string;
  updated_at?: string;
  is_synced?: number;
}

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  visits?: number;
  last_visit?: string;
  customer_type?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_synced?: number;
}

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: string;
  openingHours: string;
}

interface Transaction extends TransactionRecord {
  items?: CartItem[];
}

export function POSInterface() {
  const { toast } = useToast();
  const { isOnline } = useSyncStatus();
  const [activeTab, setActiveTab] = useState("spa");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    date: Date;
    payment_method: string;
  } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isViewingTransactionDetails, setIsViewingTransactionDetails] =
    useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<{
    spa: Product[];
    restaurant: Product[];
  }>({
    spa: [],
    restaurant: [],
  });
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: "Spa & Bistro",
    address: "123 Relaxation Ave, Serenity, CA 90210",
    phone: "(555) 123-4567",
    email: "info@spaandbistro.com",
    website: "www.spaandbistro.com",
    taxRate: "8.5",
    openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
  });

  // Initialize database and load data
  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      // Add sample data if needed
      await addSampleData();
      await loadBusinessSettings();
      await loadProducts();
      await loadRecentTransactions();
      await loadCustomers();
      setIsInitialized(true);
    };

    initialize();
  }, []);

  // Load business settings
  const loadBusinessSettings = async () => {
    try {
      const defaultSettings = {
        businessName: "Spa & Bistro",
        address: "123 Relaxation Ave, Serenity, CA 90210",
        phone: "(555) 123-4567",
        email: "info@spaandbistro.com",
        website: "www.spaandbistro.com",
        taxRate: "8.5",
        openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
      };

      const settings = await businessSettingsApi.getSettings(defaultSettings);
      setBusinessSettings(settings as BusinessSettings);
    } catch (error) {
      console.error("Failed to load business settings:", error);
    }
  };

  // Load products from spa services and menu items
  const loadProducts = async () => {
    try {
      // Load spa services
      const spaServices = (await spaServicesApi.listActive()) as SpaService[];

      // Convert spa services to product format
      const spaProducts = spaServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        description: service.description,
        category: service.category,
        duration: service.duration, // Additional property specific to spa services
      }));

      // Load menu items
      const menuItems = (await menuItemsApi.listActive()) as MenuItem[];

      // Convert menu items to product format
      const restaurantProducts = menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        category: item.category,
        image_url: item.image_url,
      }));

      setProducts({
        spa: spaProducts,
        restaurant: restaurantProducts,
      });
    } catch (error) {
      console.error("Failed to load products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Using default items.",
        variant: "destructive",
      });
    }
  };

  // Load recent transactions from database
  const loadRecentTransactions = async () => {
    try {
      const transactions =
        (await transactionsApi.list()) as TransactionRecord[];
      // Sort by date, newest first
      const sorted = [...transactions].sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      );
      const recentTx = sorted.slice(0, 100) as Transaction[]; // Get up to 100 transactions for filtering
      setRecentTransactions(recentTx);
      setFilteredTransactions(recentTx);
    } catch (error) {
      console.error("Failed to load recent transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction history.",
        variant: "destructive",
      });
    }
  };

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...recentTransactions];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.customer_name.toLowerCase().includes(query) ||
          tx.id.toLowerCase().includes(query)
      );
    }

    // Apply transaction type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((tx) => tx.transaction_type === typeFilter);
    }

    // Apply payment method filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((tx) => tx.payment_method === paymentFilter);
    }

    setFilteredTransactions(filtered);
  }, [searchQuery, typeFilter, paymentFilter, recentTransactions]);

  // Helper function to get unique values from transactions
  const getUniqueValues = (key: keyof Transaction): string[] => {
    const values = recentTransactions.map((tx) => tx[key] as string);
    return [...new Set(values)];
  };

  // Load customers for quick selection
  const loadCustomers = async () => {
    try {
      const customersList = (await customersApi.list()) as CustomerRecord[];
      setCustomers(customersList);
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data.",
        variant: "destructive",
      });
    }
  };

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Ensure category is preserved when adding to cart
      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
          category: activeTab === "spa" ? "spa" : "restaurant", // Use active tab to determine category
        },
      ];
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.id !== id));
      return;
    }
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setPaymentMethod("cash");
    setCompletedTransaction(null);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Calculate tax using business settings
  const calculateTax = () => {
    const taxRate = parseFloat(businessSettings.taxRate) || 8.5;
    return calculateTotal() * (taxRate / 100);
  };

  // Calculate total with tax
  const calculateTotalWithTax = () => {
    const taxRate = parseFloat(businessSettings.taxRate) || 8.5;
    return calculateTotal() * (1 + taxRate / 100);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      // Create transaction in database
      const transaction = (await transactionsApi.create({
        customer_name: customerName || "Guest",
        transaction_date: new Date().toISOString(),
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        transaction_type: activeTab,
        status: "completed", // Set status to completed
        notes: "",
      })) as TransactionRecord;

      // Add transaction items
      for (const item of cart) {
        await transactionsApi.addItem(transaction.id, {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // If this is a new customer, add them to the customers database
      if (customerName && !customers.some((c) => c.name === customerName)) {
        try {
          await customersApi.create({
            name: customerName,
            email: "",
            phone: "",
            visits: 1,
            last_visit: new Date().toISOString(),
            customer_type: activeTab,
          });

          // Refresh customers list
          await loadCustomers();
        } catch (customerError) {
          console.error("Error adding new customer:", customerError);
        }
      }

      toast({
        title: "Transaction complete",
        description: isOnline
          ? "The transaction has been processed successfully."
          : "The transaction has been saved offline and will sync when connection is restored.",
      });

      // Update recent transactions
      await loadRecentTransactions();

      // Set completed transaction for receipt
      setCompletedTransaction({
        id: transaction.id,
        items: [...cart],
        total: calculateTotal(),
        date: new Date(),
        payment_method: paymentMethod,
      });
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast({
        title: "Error",
        description: "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    clearCart();
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerName(customer.name);
    }
  };

  const viewTransactionDetails = async (transaction: Transaction) => {
    try {
      setIsProcessing(true);
      // Get transaction items
      const items = (await transactionsApi.getItems(
        transaction.id
      )) as TransactionItemRecord[];

      const transactionWithItems = {
        ...transaction,
        items: items.map((item) => ({
          id: item.id,
          name: item.item_name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      setSelectedTransaction(transactionWithItems);
      setIsViewingTransactionDetails(true);
    } catch (error) {
      console.error("Error loading transaction details:", error);
      toast({
        title: "Error",
        description: "Failed to load transaction details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadTransactionIntoReceipt = () => {
    if (!selectedTransaction || !selectedTransaction.items) return;

    setCompletedTransaction({
      id: selectedTransaction.id,
      items: selectedTransaction.items,
      total: selectedTransaction.total_amount,
      date: new Date(selectedTransaction.transaction_date),
      payment_method: selectedTransaction.payment_method,
    });

    setCustomerName(selectedTransaction.customer_name);
    setIsViewingTransactionDetails(false);
    setIsHistoryOpen(false);
  };

  const getPdf = async (): Promise<jsPDF | null> => {
    // Create a new PDF directly here
    if (!completedTransaction) return null;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // Receipt-sized paper
      });

      // Use business settings for the receipt
      doc.setFontSize(12);
      doc.text(businessSettings.businessName, 40, 10, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Receipt #: ${completedTransaction.id.substring(0, 8)}`, 5, 20);
      doc.text(
        `Date: ${completedTransaction.date.toLocaleDateString()}`,
        5,
        25
      );
      doc.text(`Customer: ${customerName || "Guest"}`, 5, 30);
      doc.text(`Payment Method: ${completedTransaction.payment_method}`, 5, 35);

      // Add items
      let y = 40;
      doc.text("Item", 5, y);
      doc.text("Qty", 40, y);
      doc.text("Price", 50, y);
      doc.text("Total", 65, y);
      y += 5;

      completedTransaction.items.forEach((item) => {
        // Truncate long item names
        const itemName =
          item.name.length > 18
            ? item.name.substring(0, 18) + "..."
            : item.name;
        doc.text(itemName, 5, y);
        doc.text(item.quantity.toString(), 40, y);
        doc.text(`$${item.price.toFixed(2)}`, 50, y);
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 65, y);
        y += 5;
      });

      // Add total
      y += 5;
      doc.text(`Subtotal: $${completedTransaction.total.toFixed(2)}`, 40, y, {
        align: "right",
      });
      y += 5;

      // Use business settings tax rate
      const taxRate = parseFloat(businessSettings.taxRate) || 8.5;
      const tax = completedTransaction.total * (taxRate / 100);
      doc.text(`Tax (${taxRate}%): $${tax.toFixed(2)}`, 40, y, {
        align: "right",
      });
      y += 5;
      const grandTotal = completedTransaction.total * (1 + taxRate / 100);
      doc.text(`Total: $${grandTotal.toFixed(2)}`, 40, y, { align: "right" });

      // Add footer
      y += 10;
      doc.text("Thank you for your business!", 40, y, { align: "center" });
      y += 5;
      doc.text(businessSettings.website, 40, y, { align: "center" });

      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_400px]">
      {completedTransaction ? (
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptGenerator
              transactionId={completedTransaction.id}
              customerName={customerName}
              items={completedTransaction.items}
              total={completedTransaction.total}
              paymentMethod={completedTransaction.payment_method}
              onShare={() => setIsShareModalOpen(true)}
              onEmail={() => setIsShareModalOpen(true)}
              businessSettings={businessSettings}
            />
          </CardContent>
          <CardFooter className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
              <HistoryIcon className="mr-2 h-4 w-4" />
              Transaction History
            </Button>
            <Button onClick={handleNewTransaction}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Tabs
              defaultValue="spa"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spa">Spa Services</TabsTrigger>
                <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="ghost"
              onClick={() => setIsHistoryOpen(true)}
              className="ml-2"
            >
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </Button>
          </CardHeader>
          <CardContent>
            {!isInitialized ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products[activeTab as keyof typeof products].length > 0 ? (
                  products[activeTab as keyof typeof products].map(
                    (product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                        onClick={() => addToCart(product)}
                      >
                        <span className="text-lg font-medium">
                          {product.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                        {typeof (product as any).duration === "number" && (
                          <span className="text-xs text-muted-foreground">
                            {(product as any).duration} min
                          </span>
                        )}
                      </Button>
                    )
                  )
                ) : (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No {activeTab} products found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {!completedTransaction ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Customer</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="flex-1"
                    />
                    {customers.length > 0 && (
                      <Select onValueChange={handleCustomerSelect}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 mt-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("cash")}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Cash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("card")}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={
                        paymentMethod === "mobile" ? "default" : "outline"
                      }
                      onClick={() => setPaymentMethod("mobile")}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Mobile
                    </Button>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items in cart
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 border-t pt-6">
              <div className="flex justify-between w-full text-lg font-bold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full text-sm text-muted-foreground">
                <span>Tax ({businessSettings.taxRate}%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full text-lg font-bold">
                <span>Final Total:</span>
                <span>${calculateTotalWithTax().toFixed(2)}</span>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={clearCart}
                  disabled={isProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button
                  className="w-1/2"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : isOnline ? (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Checkout
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Offline
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ) : null}
      </div>

      {/* Share Receipt Modal */}
      {completedTransaction && (
        <ShareReceiptModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          transactionId={completedTransaction.id}
          customerName={customerName}
          getPdf={getPdf}
          items={completedTransaction.items}
          total={completedTransaction.total}
          date={completedTransaction.date}
          paymentMethod={completedTransaction.payment_method}
        />
      )}

      {/* Transaction History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Recent transactions from all devices
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name or transaction ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueValues("transaction_type").map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {getUniqueValues("payment_method").map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-2">
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-2">{transaction.customer_name}</td>
                      <td className="p-2 capitalize">
                        {transaction.transaction_type}
                      </td>
                      <td className="p-2 capitalize">
                        {transaction.payment_method}
                      </td>
                      <td className="p-2 text-right">
                        ${transaction.total_amount.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTransactionDetails(transaction)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} of{" "}
              {recentTransactions.length} transactions
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsHistoryOpen(false);
                setSearchQuery("");
                setTypeFilter("all");
                setPaymentFilter("all");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog
        open={isViewingTransactionDetails}
        onOpenChange={setIsViewingTransactionDetails}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction #{selectedTransaction?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>
                    {new Date(
                      selectedTransaction.transaction_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{selectedTransaction.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="capitalize">
                    {selectedTransaction.transaction_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="capitalize">
                    {selectedTransaction.payment_method}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                {selectedTransaction.items &&
                selectedTransaction.items.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted border-b">
                          <th className="text-left p-2">Item</th>
                          <th className="text-center p-2">Qty</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items found</p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedTransaction.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax ({businessSettings.taxRate}%):</span>
                  <span>
                    $
                    {(
                      selectedTransaction.total_amount *
                      (parseFloat(businessSettings.taxRate) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>
                    $
                    {(
                      selectedTransaction.total_amount *
                      (1 + parseFloat(businessSettings.taxRate) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewingTransactionDetails(false)}
            >
              Cancel
            </Button>
            <Button onClick={loadTransactionIntoReceipt}>
              Generate Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

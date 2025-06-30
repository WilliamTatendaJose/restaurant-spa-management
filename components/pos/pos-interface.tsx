'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSyncStatus } from '@/components/sync-status-provider';
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
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  transactionsApi,
  customersApi,
  spaServicesApi,
  menuItemsApi,
  businessSettingsApi,
  initDatabase,
  addSampleData,
} from '@/lib/db';
import { ReceiptGenerator } from '@/components/pos/receipt-generator';
import { ShareReceiptModal } from '@/components/pos/share-receipt-modal';
import { jsPDF } from 'jspdf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define interfaces for our data types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: 'spa' | 'restaurant'; // Add category to CartItem
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
  const [activeTab, setActiveTab] = useState('spa');
  const [activeRestaurantCategory, setActiveRestaurantCategory] =
    useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
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
    businessName: 'Spa & Bistro',
    address: '123 Relaxation Ave, Serenity, CA 90210',
    phone: '(555) 123-4567',
    email: 'info@spaandbistro.com',
    website: 'www.spaandbistro.com',
    taxRate: '8.5',
    openingHours: 'Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadingStates, setLoadingStates] = useState({
    products: false,
    transactions: false,
    customers: false,
    checkout: false,
  });

  // Enhanced error handling wrapper
  const withErrorHandling = async (
    operation: () => Promise<void>,
    errorKey: string
  ) => {
    try {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
      await operation();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors((prev) => ({ ...prev, [errorKey]: message }));
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Enhanced validation
  const validateCheckout = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (cart.length === 0) {
      newErrors.cart = 'Cart cannot be empty';
    }

    if (customerName.trim().length > 50) {
      newErrors.customerName = 'Customer name must be 50 characters or less';
    }

    const total = calculateTotal();
    if (total <= 0) {
      newErrors.total = 'Total amount must be greater than 0';
    }

    if (total > 10000) {
      newErrors.total =
        'Transaction amount too large. Please split into multiple transactions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        businessName: 'Spa & Bistro',
        address: '123 Relaxation Ave, Serenity, CA 90210',
        phone: '(555) 123-4567',
        email: 'info@spaandbistro.com',
        website: 'www.spaandbistro.com',
        taxRate: '8.5',
        openingHours: 'Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm',
      };

      const settings = await businessSettingsApi.getSettings(defaultSettings);
      setBusinessSettings(settings as BusinessSettings);
    } catch (error) {
      console.error('Failed to load business settings:', error);
    }
  };

  // Enhanced load products with better error handling
  const loadProducts = async () => {
    await withErrorHandling(async () => {
      setLoadingStates((prev) => ({ ...prev, products: true }));

      // Load spa services with timeout
      const spaServicesPromise = Promise.race([
        spaServicesApi.listActive(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Spa services load timeout')),
            10000
          )
        ),
      ]);

      // Load menu items with timeout
      const menuItemsPromise = Promise.race([
        menuItemsApi.listActive(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Menu items load timeout')), 10000)
        ),
      ]);

      const [spaServices, menuItems] = await Promise.all([
        spaServicesPromise as Promise<SpaService[]>,
        menuItemsPromise as Promise<MenuItem[]>,
      ]);

      // Validate and transform spa services data with deduplication
      let spaProducts = (spaServices || [])
        .filter(
          (service) =>
            service &&
            service.id &&
            service.name &&
            typeof service.price === 'number'
        )
        .map((service) => ({
          id: service.id,
          name: service.name.trim(),
          price: Math.max(0, Number(service.price)),
          description: service.description?.trim() || '',
          category: service.category || 'general',
          duration: Math.max(0, service.duration || 0),
        }));

      // Deduplicate spa services by name and category
      spaProducts = spaProducts.reduce((acc: Product[], current: Product) => {
        const existingIndex = acc.findIndex(
          (service) =>
            service.name?.toLowerCase() === current.name?.toLowerCase() &&
            service.category === current.category
        );

        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Keep the one with higher price or more recent data (assuming later in array is more recent)
          const existing = acc[existingIndex];
          if (current.price >= existing.price) {
            acc[existingIndex] = current;
          }
        }

        return acc;
      }, []);

      // Validate and transform restaurant menu items data with deduplication
      let restaurantProducts = (menuItems || [])
        .filter(
          (item) =>
            item && item.id && item.name && typeof item.price === 'number'
        )
        .map((item) => ({
          id: item.id,
          name: item.name.trim(),
          price: Math.max(0, Number(item.price)),
          description: item.description?.trim() || '',
          category: item.category || 'general',
          image_url: item.image_url,
        }));

      // Deduplicate restaurant items by name and category
      restaurantProducts = restaurantProducts.reduce(
        (acc: Product[], current: Product) => {
          const existingIndex = acc.findIndex(
            (item) =>
              item.name?.toLowerCase() === current.name?.toLowerCase() &&
              item.category === current.category
          );

          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the one with higher price or more recent data (assuming later in array is more recent)
            const existing = acc[existingIndex];
            if (current.price >= existing.price) {
              acc[existingIndex] = current;
            }
          }

          return acc;
        },
        []
      );

      console.log(
        `Loaded ${spaProducts.length} unique spa services and ${restaurantProducts.length} unique restaurant items`
      );

      setProducts({
        spa: spaProducts,
        restaurant: restaurantProducts,
      });

      setLoadingStates((prev) => ({ ...prev, products: false }));
    }, 'products');
  };

  // Load recent transactions from database
  const loadRecentTransactions = async () => {
    try {
      const transactions =
        (await transactionsApi.list()) as TransactionRecord[];

      // Deduplicate transactions by customer_name, transaction_date, total_amount, and payment_method
      const deduplicatedTransactions = transactions.reduce(
        (acc: TransactionRecord[], current: TransactionRecord) => {
          const existingIndex = acc.findIndex(
            (transaction) =>
              transaction.customer_name?.toLowerCase() ===
                current.customer_name?.toLowerCase() &&
              transaction.transaction_date === current.transaction_date &&
              Math.abs(transaction.total_amount - current.total_amount) <
                0.01 && // Allow for small floating point differences
              transaction.payment_method === current.payment_method
          );

          if (existingIndex === -1) {
            // Transaction doesn't exist, add it
            acc.push(current);
          } else {
            // Transaction exists, keep the one with more recent updated_at or created_at
            const existing = acc[existingIndex];
            const currentDate = new Date(
              current.updated_at || current.created_at || 0
            );
            const existingDate = new Date(
              existing.updated_at || existing.created_at || 0
            );

            if (currentDate > existingDate) {
              acc[existingIndex] = current; // Replace with newer transaction
            }
          }

          return acc;
        },
        []
      );

      // Sort by date, newest first
      const sorted = [...deduplicatedTransactions].sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      );
      const recentTx = sorted.slice(0, 100) as Transaction[]; // Get up to 100 transactions for filtering
      setRecentTransactions(recentTx);
      setFilteredTransactions(recentTx);
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction history.',
        variant: 'destructive',
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
    if (typeFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.transaction_type === typeFilter);
    }

    // Apply payment method filter
    if (paymentFilter !== 'all') {
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

      // Deduplicate customers by email (keep the most recent one)
      const deduplicatedCustomers = customersList.reduce(
        (acc: CustomerRecord[], current: CustomerRecord) => {
          const existingIndex = acc.findIndex(
            (customer) =>
              customer.email?.toLowerCase() === current.email?.toLowerCase() ||
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

      // Sort customers by name for better UX
      deduplicatedCustomers.sort((a, b) => a.name.localeCompare(b.name));

      setCustomers(deduplicatedCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer data.',
        variant: 'destructive',
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
          category: activeTab === 'spa' ? 'spa' : 'restaurant', // Use active tab to determine category
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
    setCustomerName('');
    setPaymentMethod('cash');
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

  // Enhanced checkout with better validation and error handling
  const handleCheckout = async () => {
    if (!validateCheckout()) return;

    await withErrorHandling(async () => {
      setLoadingStates((prev) => ({ ...prev, checkout: true }));

      // Double-check cart hasn't been modified
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      const sanitizedCustomerName = (customerName || 'Guest')
        .trim()
        .substring(0, 50);
      const total = calculateTotal();

      // Create transaction with retry logic
      let transaction: TransactionRecord;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          transaction = (await transactionsApi.create({
            customer_name: sanitizedCustomerName,
            transaction_date: new Date().toISOString(),
            total_amount: total,
            payment_method: paymentMethod,
            transaction_type: activeTab,
            status: 'completed',
            notes: '',
          })) as TransactionRecord;
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) throw error;

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Add transaction items with validation
      const itemPromises = cart.map(async (item) => {
        if (!item.id || !item.name || item.quantity <= 0 || item.price < 0) {
          throw new Error(`Invalid item data: ${item.name}`);
        }

        return transactionsApi.addItem(transaction!.id, {
          name: item.name.trim(),
          quantity: Math.floor(item.quantity),
          price: Number(item.price.toFixed(2)),
        });
      });

      await Promise.all(itemPromises);

      // Handle customer creation safely
      if (
        sanitizedCustomerName !== 'Guest' &&
        !customers.some(
          (c) => c.name.toLowerCase() === sanitizedCustomerName.toLowerCase()
        )
      ) {
        try {
          await customersApi.create({
            name: sanitizedCustomerName,
            email: '',
            phone: '',
            visits: 1,
            last_visit: new Date().toISOString(),
            customer_type: activeTab,
          });
          await loadCustomers();
        } catch (customerError) {
          console.warn('Could not create customer record:', customerError);
          // Don't fail the transaction for customer creation issues
        }
      }

      toast({
        title: 'Transaction complete',
        description: isOnline
          ? `Transaction #${transaction!.id.substring(0, 8)} processed successfully.`
          : 'Transaction saved offline and will sync when connection is restored.',
      });

      await loadRecentTransactions();

      setCompletedTransaction({
        id: transaction!.id,
        items: [...cart],
        total: total,
        date: new Date(),
        payment_method: paymentMethod,
      });

      setLoadingStates((prev) => ({ ...prev, checkout: false }));
    }, 'checkout');
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
      console.error('Error loading transaction details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details.',
        variant: 'destructive',
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
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200], // Receipt-sized paper
      });

      // Use business settings for the receipt
      doc.setFontSize(12);
      doc.text(businessSettings.businessName, 40, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Receipt #: ${completedTransaction.id.substring(0, 8)}`, 5, 20);
      doc.text(
        `Date: ${completedTransaction.date.toLocaleDateString()}`,
        5,
        25
      );
      doc.text(`Customer: ${customerName || 'Guest'}`, 5, 30);
      doc.text(`Payment Method: ${completedTransaction.payment_method}`, 5, 35);

      // Add items
      let y = 40;
      doc.text('Item', 5, y);
      doc.text('Qty', 40, y);
      doc.text('Price', 50, y);
      doc.text('Total', 65, y);
      y += 5;

      completedTransaction.items.forEach((item) => {
        // Truncate long item names
        const itemName =
          item.name.length > 18
            ? item.name.substring(0, 18) + '...'
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
        align: 'right',
      });
      y += 5;

      // Use business settings tax rate
      const taxRate = parseFloat(businessSettings.taxRate) || 8.5;
      const tax = completedTransaction.total * (taxRate / 100);
      doc.text(`Tax (${taxRate}%): $${tax.toFixed(2)}`, 40, y, {
        align: 'right',
      });
      y += 5;
      const grandTotal = completedTransaction.total * (1 + taxRate / 100);
      doc.text(`Total: $${grandTotal.toFixed(2)}`, 40, y, { align: 'right' });

      // Add footer
      y += 10;
      doc.text('Thank you for your business!', 40, y, { align: 'center' });
      y += 5;
      doc.text(businessSettings.website, 40, y, { align: 'center' });

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  // Handle customer creation
  const handleCreateCustomer = async () => {
    try {
      if (!newCustomerData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Customer name is required.',
          variant: 'destructive',
        });
        return;
      }

      // Check for duplicate customer
      const existingCustomer = customers.find(
        (c) =>
          c.name.toLowerCase() === newCustomerData.name.toLowerCase() ||
          (newCustomerData.email &&
            c.email.toLowerCase() === newCustomerData.email.toLowerCase())
      );

      if (existingCustomer) {
        toast({
          title: 'Customer exists',
          description: 'A customer with this name or email already exists.',
          variant: 'destructive',
        });
        return;
      }

      await customersApi.create({
        name: newCustomerData.name.trim(),
        email: newCustomerData.email.trim(),
        phone: newCustomerData.phone.trim(),
        visits: 0,
        last_visit: new Date().toISOString(),
        customer_type: activeTab,
      });

      // Set the customer name in the main form
      setCustomerName(newCustomerData.name.trim());

      // Reset form and close modal
      setNewCustomerData({ name: '', email: '', phone: '' });
      setIsCustomerModalOpen(false);

      // Reload customers
      await loadCustomers();

      toast({
        title: 'Customer created',
        description: 'New customer has been added successfully.',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='grid gap-6 md:grid-cols-[1fr_400px]'>
      {/* Error Alert */}
      {Object.entries(errors).some(([_, error]) => error) && (
        <div className='md:col-span-2'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {Object.entries(errors)
                .filter(([_, error]) => error)
                .map(([key, error]) => error)
                .join('; ')}
            </AlertDescription>
          </Alert>
        </div>
      )}

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
          <CardFooter className='flex justify-between gap-2'>
            <Button variant='outline' onClick={() => setIsHistoryOpen(true)}>
              <HistoryIcon className='mr-2 h-4 w-4' />
              Transaction History
            </Button>
            <Button onClick={handleNewTransaction}>
              <PlusCircle className='mr-2 h-4 w-4' />
              New Transaction
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <Tabs
              defaultValue='spa'
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='spa' disabled={loadingStates.products}>
                  Spa Services
                </TabsTrigger>
                <TabsTrigger
                  value='restaurant'
                  disabled={loadingStates.products}
                >
                  Restaurant
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant='ghost'
              onClick={() => setIsHistoryOpen(true)}
              className='ml-2'
              disabled={loadingStates.transactions}
            >
              {loadingStates.transactions ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <HistoryIcon className='mr-2 h-4 w-4' />
              )}
              History
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className='mb-4'>
              <div className='relative'>
                <Input
                  placeholder='Search products...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-8'
                />
                <div className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'>
                  🔍
                </div>
              </div>
            </div>

            {/* Restaurant Category Tabs */}
            {activeTab === 'restaurant' && (
              <div className='mb-4'>
                <Tabs
                  value={activeRestaurantCategory}
                  onValueChange={setActiveRestaurantCategory}
                >
                  <TabsList className='grid w-full grid-cols-6'>
                    <TabsTrigger value='all'>All</TabsTrigger>
                    <TabsTrigger value='appetizer'>Appetizers</TabsTrigger>
                    <TabsTrigger value='main'>Main</TabsTrigger>
                    <TabsTrigger value='beverage'>Beverages</TabsTrigger>
                    <TabsTrigger value='dessert'>Desserts</TabsTrigger>
                    <TabsTrigger value='other'>Other</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {loadingStates.products ? (
              <div className='py-8 text-center'>
                <Loader2 className='mx-auto mb-2 h-8 w-8 animate-spin' />
                <p className='text-muted-foreground'>Loading products...</p>
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                {(() => {
                  let currentProducts =
                    products[activeTab as keyof typeof products];

                  // Apply search filter
                  if (searchQuery) {
                    currentProducts = currentProducts.filter(
                      (product) =>
                        product.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        product.description
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    );
                  }

                  // Apply restaurant category filter
                  if (
                    activeTab === 'restaurant' &&
                    activeRestaurantCategory !== 'all'
                  ) {
                    currentProducts = currentProducts.filter(
                      (product) => product.category === activeRestaurantCategory
                    );
                  }

                  return currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <Button
                        key={product.id}
                        variant='outline'
                        className='flex h-auto flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-accent'
                        onClick={() => addToCart(product)}
                        disabled={loadingStates.checkout}
                      >
                        <span className='text-center text-lg font-medium'>
                          {product.name}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          ${product.price.toFixed(2)}
                        </span>
                        {typeof (product as any).duration === 'number' &&
                          (product as any).duration > 0 && (
                            <span className='text-xs text-muted-foreground'>
                              {(product as any).duration} min
                            </span>
                          )}
                        {product.description && (
                          <span className='line-clamp-2 text-center text-xs text-muted-foreground'>
                            {product.description}
                          </span>
                        )}
                        {activeTab === 'restaurant' && product.category && (
                          <span className='rounded-full bg-muted px-2 py-1 text-xs capitalize'>
                            {product.category}
                          </span>
                        )}
                      </Button>
                    ))
                  ) : (
                    <div className='col-span-3 py-8 text-center text-muted-foreground'>
                      {errors.products ? (
                        <div>
                          <AlertCircle className='mx-auto mb-2 h-8 w-8 text-destructive' />
                          <p>Failed to load {activeTab} products</p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={loadProducts}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : searchQuery ? (
                        <div>
                          <p>No products found matching "{searchQuery}"</p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => setSearchQuery('')}
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : activeTab === 'restaurant' &&
                        activeRestaurantCategory !== 'all' ? (
                        <div>
                          <p>No {activeRestaurantCategory} items found</p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => setActiveRestaurantCategory('all')}
                          >
                            Show All Items
                          </Button>
                        </div>
                      ) : (
                        <p>No {activeTab} products found</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className='flex flex-col gap-4'>
        {!completedTransaction ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='customerName'>Customer</Label>
                  <div className='mb-2 flex gap-2'>
                    <Input
                      id='customerName'
                      value={customerName}
                      onChange={(e) => {
                        const value = e.target.value.substring(0, 50); // Limit length
                        setCustomerName(value);
                        if (errors.customerName) {
                          setErrors((prev) => ({ ...prev, customerName: '' }));
                        }
                      }}
                      placeholder='Enter customer name'
                      className={`flex-1 ${errors.customerName ? 'border-destructive' : ''}`}
                      disabled={loadingStates.checkout}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setIsCustomerModalOpen(true)}
                      disabled={loadingStates.checkout}
                      className='px-3'
                    >
                      + Customer
                    </Button>
                  </div>

                  {/* Customer Search and Selection */}
                  {customers.length > 0 && (
                    <div className='space-y-2'>
                      <div className='relative'>
                        <Input
                          placeholder='Search existing customers...'
                          value={customerSearchQuery}
                          onChange={(e) =>
                            setCustomerSearchQuery(e.target.value)
                          }
                          className='pl-8'
                          disabled={loadingStates.checkout}
                        />
                        <div className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'>
                          🔍
                        </div>
                      </div>

                      {customerSearchQuery && (
                        <div className='max-h-32 overflow-y-auto rounded-md border'>
                          {customers
                            .filter(
                              (customer) =>
                                customer.name
                                  .toLowerCase()
                                  .includes(
                                    customerSearchQuery.toLowerCase()
                                  ) ||
                                customer.email
                                  .toLowerCase()
                                  .includes(
                                    customerSearchQuery.toLowerCase()
                                  ) ||
                                customer.phone?.includes(customerSearchQuery)
                            )
                            .slice(0, 5) // Limit to 5 results
                            .map((customer) => (
                              <div
                                key={customer.id}
                                className='cursor-pointer border-b p-2 last:border-b-0 hover:bg-muted'
                                onClick={() => {
                                  setCustomerName(customer.name);
                                  setCustomerSearchQuery('');
                                }}
                              >
                                <div className='font-medium'>
                                  {customer.name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  {customer.email} • {customer.phone} •{' '}
                                  {customer.visits || 0} visits
                                </div>
                              </div>
                            ))}
                          {customers.filter(
                            (customer) =>
                              customer.name
                                .toLowerCase()
                                .includes(customerSearchQuery.toLowerCase()) ||
                              customer.email
                                .toLowerCase()
                                .includes(customerSearchQuery.toLowerCase()) ||
                              customer.phone?.includes(customerSearchQuery)
                          ).length === 0 && (
                            <div className='p-2 text-center text-muted-foreground'>
                              No customers found matching "{customerSearchQuery}
                              "
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.customerName && (
                    <p className='text-sm text-destructive'>
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div className='mt-2 grid gap-2'>
                  <Label htmlFor='paymentMethod'>Payment Method</Label>
                  <div className='grid grid-cols-3 gap-2'>
                    <Button
                      type='button'
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('cash')}
                      className='flex items-center gap-2'
                    >
                      <DollarSign className='h-4 w-4' />
                      Cash
                    </Button>
                    <Button
                      type='button'
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className='flex items-center gap-2'
                    >
                      <CreditCard className='h-4 w-4' />
                      Card
                    </Button>
                    <Button
                      type='button'
                      variant={
                        paymentMethod === 'mobile' ? 'default' : 'outline'
                      }
                      onClick={() => setPaymentMethod('mobile')}
                      className='flex items-center gap-2'
                    >
                      <QrCode className='h-4 w-4' />
                      Mobile
                    </Button>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className='py-8 text-center text-muted-foreground'>
                    {errors.cart ? (
                      <p className='text-destructive'>{errors.cart}</p>
                    ) : (
                      <p>No items in cart</p>
                    )}
                  </div>
                ) : (
                  <div className='mt-4 space-y-4'>
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className='flex items-center justify-between'
                      >
                        <div>
                          <p className='font-medium'>{item.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <MinusCircle className='h-4 w-4' />
                          </Button>
                          <span className='w-8 text-center'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <PlusCircle className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className='flex-col gap-4 border-t pt-6'>
              <div className='flex w-full justify-between text-lg font-bold'>
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className='flex w-full justify-between text-sm text-muted-foreground'>
                <span>Tax ({businessSettings.taxRate}%):</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className='flex w-full justify-between text-lg font-bold'>
                <span>Final Total:</span>
                <span>${calculateTotalWithTax().toFixed(2)}</span>
              </div>
              {errors.total && (
                <Alert variant='destructive' className='w-full'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{errors.total}</AlertDescription>
                </Alert>
              )}
              <div className='flex w-full gap-2'>
                <Button
                  variant='outline'
                  className='w-1/2'
                  onClick={clearCart}
                  disabled={loadingStates.checkout}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Clear
                </Button>
                <Button
                  className='w-1/2'
                  onClick={handleCheckout}
                  disabled={
                    cart.length === 0 ||
                    loadingStates.checkout ||
                    Object.values(errors).some((error) => error)
                  }
                >
                  {loadingStates.checkout ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing...
                    </>
                  ) : isOnline ? (
                    <>
                      <Receipt className='mr-2 h-4 w-4' />
                      Checkout
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
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
        <DialogContent className='max-h-[80vh] max-w-3xl overflow-auto'>
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Recent transactions from all devices
            </DialogDescription>
          </DialogHeader>

          <div className='mb-4 flex flex-col gap-3 md:flex-row'>
            <div className='flex-1'>
              <Input
                placeholder='Search by customer name or transaction ID'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='flex gap-2'>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {getUniqueValues('transaction_type').map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Payment' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Payments</SelectItem>
                  {getUniqueValues('payment_method').map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No transactions found
            </div>
          ) : (
            <div className='overflow-hidden rounded-md border'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b bg-muted'>
                    <th className='p-2 text-left'>Date</th>
                    <th className='p-2 text-left'>Customer</th>
                    <th className='p-2 text-left'>Type</th>
                    <th className='p-2 text-left'>Payment</th>
                    <th className='p-2 text-right'>Amount</th>
                    <th className='p-2 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className='border-b hover:bg-muted/50'
                    >
                      <td className='p-2'>
                        {new Date(
                          transaction.transaction_date
                        ).toLocaleDateString()}
                      </td>
                      <td className='p-2'>{transaction.customer_name}</td>
                      <td className='p-2 capitalize'>
                        {transaction.transaction_type}
                      </td>
                      <td className='p-2 capitalize'>
                        {transaction.payment_method}
                      </td>
                      <td className='p-2 text-right'>
                        ${transaction.total_amount.toFixed(2)}
                      </td>
                      <td className='p-2 text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
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

          <DialogFooter className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredTransactions.length} of{' '}
              {recentTransactions.length} transactions
            </div>
            <Button
              variant='outline'
              onClick={() => {
                setIsHistoryOpen(false);
                setSearchQuery('');
                setTypeFilter('all');
                setPaymentFilter('all');
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
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction #{selectedTransaction?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <p className='text-sm text-muted-foreground'>Date</p>
                  <p>
                    {new Date(
                      selectedTransaction.transaction_date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Customer</p>
                  <p>{selectedTransaction.customer_name}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Type</p>
                  <p className='capitalize'>
                    {selectedTransaction.transaction_type}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Payment Method
                  </p>
                  <p className='capitalize'>
                    {selectedTransaction.payment_method}
                  </p>
                </div>
              </div>

              <div>
                <p className='mb-2 text-sm text-muted-foreground'>Items</p>
                {selectedTransaction.items &&
                selectedTransaction.items.length > 0 ? (
                  <div className='overflow-hidden rounded-md border'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b bg-muted'>
                          <th className='p-2 text-left'>Item</th>
                          <th className='p-2 text-center'>Qty</th>
                          <th className='p-2 text-right'>Price</th>
                          <th className='p-2 text-right'>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTransaction.items.map((item) => (
                          <tr key={item.id} className='border-b'>
                            <td className='p-2'>{item.name}</td>
                            <td className='p-2 text-center'>{item.quantity}</td>
                            <td className='p-2 text-right'>
                              ${item.price.toFixed(2)}
                            </td>
                            <td className='p-2 text-right'>
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className='text-muted-foreground'>No items found</p>
                )}
              </div>

              <div className='border-t pt-4'>
                <div className='flex justify-between'>
                  <span>Subtotal:</span>
                  <span>${selectedTransaction.total_amount.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm text-muted-foreground'>
                  <span>Tax ({businessSettings.taxRate}%):</span>
                  <span>
                    $
                    {(
                      selectedTransaction.total_amount *
                      (parseFloat(businessSettings.taxRate) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between font-bold'>
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
              variant='outline'
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

      {/* Add Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer record for faster checkout
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='newCustomerName'>Customer Name *</Label>
              <Input
                id='newCustomerName'
                value={newCustomerData.name}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder='Enter customer name'
                required
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='newCustomerEmail'>Email</Label>
              <Input
                id='newCustomerEmail'
                type='email'
                value={newCustomerData.email}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder='Enter email address'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='newCustomerPhone'>Phone</Label>
              <Input
                id='newCustomerPhone'
                type='tel'
                value={newCustomerData.phone}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder='Enter phone number'
              />
            </div>

            <div className='text-sm text-muted-foreground'>
              Customer type will be set to{' '}
              <strong>{activeTab === 'spa' ? 'Spa' : 'Restaurant'}</strong>{' '}
              based on current tab.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCustomerModalOpen(false);
                setNewCustomerData({ name: '', email: '', phone: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomerData.name.trim()}
            >
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

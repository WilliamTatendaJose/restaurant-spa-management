-- Restaurant SPA Management System - Supabase Database Schema
-- This script creates all necessary tables and sets up Row Level Security (RLS)

-- Enable necessary extensions
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION
IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE booking_status AS ENUM
('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE transaction_status AS ENUM
('pending', 'completed', 'cancelled', 'refunded', 'paid');
CREATE TYPE transaction_type AS ENUM
('spa', 'restaurant', 'retail');
CREATE TYPE staff_role AS ENUM
('admin', 'manager', 'staff', 'therapist', 'chef', 'waiter');
CREATE TYPE menu_category AS ENUM
('food', 'drinks', 'desserts', 'appetizers', 'mains');
CREATE TYPE dietary_type AS ENUM
('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher');

-- 1. Customers table
CREATE TABLE
IF NOT EXISTS customers
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    email VARCHAR
(255) UNIQUE,
    phone VARCHAR
(50),
    address TEXT,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 2. Staff table
CREATE TABLE
IF NOT EXISTS staff
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    email VARCHAR
(255) UNIQUE NOT NULL,
    phone VARCHAR
(50),
    role staff_role NOT NULL DEFAULT 'staff',
    hire_date DATE,
    salary DECIMAL
(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 3. Menu Items table
CREATE TABLE
IF NOT EXISTS menu_items
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    description TEXT,
    price DECIMAL
(10,2) NOT NULL,
    category menu_category NOT NULL DEFAULT 'food',
    dietary dietary_type[],
    is_available BOOLEAN DEFAULT true,
    status VARCHAR
(50) DEFAULT 'active',
    image_url TEXT,
    preparation_time INTEGER, -- in minutes
    ingredients TEXT[],
    allergens TEXT[],
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 4. Spa Services table
CREATE TABLE
IF NOT EXISTS spa_services
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    price DECIMAL
(10,2) NOT NULL,
    category VARCHAR
(100),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR
(50) DEFAULT 'active',
    requirements TEXT,
    benefits TEXT[],
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 5. Bookings table
CREATE TABLE
IF NOT EXISTS bookings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    customer_id UUID REFERENCES customers
(id) ON
DELETE CASCADE,
    service_id UUID
REFERENCES spa_services
(id) ON
DELETE
SET NULL
,
    staff_id UUID REFERENCES staff
(id) ON
DELETE
SET NULL
,
    booking_date TIMESTAMP
WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP
WITH TIME ZONE,
    status booking_status DEFAULT 'pending',
    total_amount DECIMAL
(10,2),
    notes TEXT,
    special_requests TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 6. Transactions table
CREATE TABLE
IF NOT EXISTS transactions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    customer_id UUID REFERENCES customers
(id) ON
DELETE
SET NULL
,
    staff_id UUID REFERENCES staff
(id) ON
DELETE
SET NULL
,
    booking_id UUID REFERENCES bookings
(id) ON
DELETE
SET NULL
,
    transaction_type transaction_type NOT NULL DEFAULT 'restaurant',
    transaction_date TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    subtotal DECIMAL
(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL
(10,2) DEFAULT 0,
    discount_amount DECIMAL
(10,2) DEFAULT 0,
    tip_amount DECIMAL
(10,2) DEFAULT 0,
    total_amount DECIMAL
(10,2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    payment_method VARCHAR
(50),
    receipt_number VARCHAR
(100) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 7. Transaction Items table
CREATE TABLE
IF NOT EXISTS transaction_items
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    transaction_id UUID REFERENCES transactions
(id) ON
DELETE CASCADE,
    menu_item_id UUID
REFERENCES menu_items
(id) ON
DELETE
SET NULL
,
    service_id UUID REFERENCES spa_services
(id) ON
DELETE
SET NULL
,
    item_name VARCHAR
(255) NOT NULL,
    item_type VARCHAR
(50) DEFAULT 'menu_item', -- 'menu_item' or 'service'
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL
(10,2) NOT NULL,
    total_price DECIMAL
(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 8. Inventory table
CREATE TABLE
IF NOT EXISTS inventory
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    description TEXT,
    category VARCHAR
(100),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER,
    unit VARCHAR
(50) DEFAULT 'pieces',
    cost_per_unit DECIMAL
(10,2),
    supplier VARCHAR
(255),
    last_restocked DATE,
    expiry_date DATE,
    location VARCHAR
(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 9. Business Settings table
CREATE TABLE
IF NOT EXISTS business_settings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    business_name VARCHAR
(255),
    address TEXT,
    phone VARCHAR
(50),
    email VARCHAR
(255),
    website VARCHAR
(255),
    tax_rate DECIMAL
(5,4) DEFAULT 0.15, -- 15% default tax
    currency VARCHAR
(10) DEFAULT 'USD',
    timezone VARCHAR
(100) DEFAULT 'UTC',
    business_hours JSONB,
    logo_url TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 10. General Settings table
CREATE TABLE
IF NOT EXISTS general_settings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    key VARCHAR
(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type VARCHAR
(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Create indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_customers_email ON customers
(email);
CREATE INDEX
IF NOT EXISTS idx_customers_phone ON customers
(phone);

CREATE INDEX
IF NOT EXISTS idx_staff_email ON staff
(email);
CREATE INDEX
IF NOT EXISTS idx_staff_role ON staff
(role);
CREATE INDEX
IF NOT EXISTS idx_staff_is_active ON staff
(is_active);

CREATE INDEX
IF NOT EXISTS idx_menu_items_category ON menu_items
(category);
CREATE INDEX
IF NOT EXISTS idx_menu_items_status ON menu_items
(status);
CREATE INDEX
IF NOT EXISTS idx_menu_items_is_available ON menu_items
(is_available);

CREATE INDEX
IF NOT EXISTS idx_spa_services_category ON spa_services
(category);
CREATE INDEX
IF NOT EXISTS idx_spa_services_is_active ON spa_services
(is_active);

CREATE INDEX
IF NOT EXISTS idx_bookings_customer_id ON bookings
(customer_id);
CREATE INDEX
IF NOT EXISTS idx_bookings_service_id ON bookings
(service_id);
CREATE INDEX
IF NOT EXISTS idx_bookings_staff_id ON bookings
(staff_id);
CREATE INDEX
IF NOT EXISTS idx_bookings_date ON bookings
(booking_date);
CREATE INDEX
IF NOT EXISTS idx_bookings_status ON bookings
(status);

CREATE INDEX
IF NOT EXISTS idx_transactions_customer_id ON transactions
(customer_id);
CREATE INDEX
IF NOT EXISTS idx_transactions_staff_id ON transactions
(staff_id);
CREATE INDEX
IF NOT EXISTS idx_transactions_date ON transactions
(transaction_date);
CREATE INDEX
IF NOT EXISTS idx_transactions_type ON transactions
(transaction_type);
CREATE INDEX
IF NOT EXISTS idx_transactions_status ON transactions
(status);

CREATE INDEX
IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items
(transaction_id);
CREATE INDEX
IF NOT EXISTS idx_transaction_items_menu_item_id ON transaction_items
(menu_item_id);
CREATE INDEX
IF NOT EXISTS idx_transaction_items_service_id ON transaction_items
(service_id);

CREATE INDEX
IF NOT EXISTS idx_inventory_category ON inventory
(category);
CREATE INDEX
IF NOT EXISTS idx_inventory_is_active ON inventory
(is_active);
CREATE INDEX
IF NOT EXISTS idx_inventory_low_stock ON inventory
(current_stock) WHERE current_stock <= minimum_stock;

CREATE INDEX
IF NOT EXISTS idx_general_settings_key ON general_settings
(key);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_customers_updated_at BEFORE
UPDATE ON customers FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_staff_updated_at BEFORE
UPDATE ON staff FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_menu_items_updated_at BEFORE
UPDATE ON menu_items FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_spa_services_updated_at BEFORE
UPDATE ON spa_services FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_bookings_updated_at BEFORE
UPDATE ON bookings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_transactions_updated_at BEFORE
UPDATE ON transactions FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_transaction_items_updated_at BEFORE
UPDATE ON transaction_items FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_inventory_updated_at BEFORE
UPDATE ON inventory FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_business_settings_updated_at BEFORE
UPDATE ON business_settings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_general_settings_updated_at BEFORE
UPDATE ON general_settings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (authenticated users can access all data for now)
-- You can make these more restrictive based on your needs

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON customers FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert customers" ON customers FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update customers" ON customers FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete customers" ON customers FOR
DELETE USING (auth.role
() = 'authenticated');

-- Staff policies
CREATE POLICY "Authenticated users can view staff" ON staff FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert staff" ON staff FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update staff" ON staff FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete staff" ON staff FOR
DELETE USING (auth.role
() = 'authenticated');

-- Menu items policies
CREATE POLICY "Authenticated users can view menu_items" ON menu_items FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert menu_items" ON menu_items FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update menu_items" ON menu_items FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete menu_items" ON menu_items FOR
DELETE USING (auth.role
() = 'authenticated');

-- Spa services policies
CREATE POLICY "Authenticated users can view spa_services" ON spa_services FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert spa_services" ON spa_services FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update spa_services" ON spa_services FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete spa_services" ON spa_services FOR
DELETE USING (auth.role
() = 'authenticated');

-- Bookings policies
CREATE POLICY "Authenticated users can view bookings" ON bookings FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert bookings" ON bookings FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update bookings" ON bookings FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete bookings" ON bookings FOR
DELETE USING (auth.role
() = 'authenticated');

-- Transactions policies
CREATE POLICY "Authenticated users can view transactions" ON transactions FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transactions" ON transactions FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update transactions" ON transactions FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete transactions" ON transactions FOR
DELETE USING (auth.role
() = 'authenticated');

-- Transaction items policies
CREATE POLICY "Authenticated users can view transaction_items" ON transaction_items FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transaction_items" ON transaction_items FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update transaction_items" ON transaction_items FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete transaction_items" ON transaction_items FOR
DELETE USING (auth.role
() = 'authenticated');

-- Inventory policies
CREATE POLICY "Authenticated users can view inventory" ON inventory FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert inventory" ON inventory FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update inventory" ON inventory FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete inventory" ON inventory FOR
DELETE USING (auth.role
() = 'authenticated');

-- Business settings policies
CREATE POLICY "Authenticated users can view business_settings" ON business_settings FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert business_settings" ON business_settings FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update business_settings" ON business_settings FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete business_settings" ON business_settings FOR
DELETE USING (auth.role
() = 'authenticated');

-- General settings policies
CREATE POLICY "Authenticated users can view general_settings" ON general_settings FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert general_settings" ON general_settings FOR
INSERT WITH CHECK (auth.role() = 'authenticated')
;
CREATE POLICY "Authenticated users can update general_settings" ON general_settings FOR
UPDATE USING (auth.role()
= 'authenticated');
CREATE POLICY "Authenticated users can delete general_settings" ON general_settings FOR
DELETE USING (auth.role
() = 'authenticated');

-- Insert some default data
INSERT INTO business_settings
    (business_name, tax_rate, currency, timezone)
VALUES
    ('Restaurant & Spa', 0.15, 'USD', 'UTC')
ON CONFLICT DO NOTHING;

-- Insert default general settings
INSERT INTO general_settings
    (key, value, description, data_type)
VALUES
    ('enable_online_booking', 'true', 'Enable online booking system', 'boolean'),
    ('booking_advance_days', '30', 'Days in advance customers can book', 'number'),
    ('default_service_duration', '60', 'Default service duration in minutes', 'number'),
    ('auto_confirm_bookings', 'false', 'Automatically confirm bookings', 'boolean'),
    ('send_booking_reminders', 'true', 'Send booking reminder emails', 'boolean'),
    ('reminder_hours_before', '24', 'Hours before appointment to send reminder', 'number'),
    ('max_cancellation_hours', '24', 'Hours before appointment when cancellation is allowed', 'number'),
    ('enable_waitlist', 'true', 'Enable waitlist for fully booked slots', 'boolean')
ON CONFLICT
(key) DO NOTHING;

-- Create some sample data (optional - comment out if not needed)
INSERT INTO menu_items
    (name, description, price, category, dietary, is_available)
VALUES
    ('Caesar Salad', 'Fresh lettuce with caesar dressing and croutons', 12.00, 'food', ARRAY
['vegetarian'], true),
('Grilled Salmon', 'Fresh salmon with herbs and lemon', 25.00, 'food', ARRAY['gluten-free'], true),
('Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 18.00, 'food', NULL, true),
('Chicken Burger', 'Grilled chicken breast with lettuce and tomato', 15.00, 'food', NULL, true),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 5.00, 'drinks', ARRAY['vegan', 'gluten-free'], true),
('Coffee', 'Freshly brewed coffee', 3.00, 'drinks', ARRAY['vegan'], true),
('Chocolate Cake', 'Rich chocolate cake with vanilla ice cream', 7.00, 'desserts', ARRAY['vegetarian'], true),
('Tiramisu', 'Classic Italian tiramisu', 8.00, 'desserts', ARRAY['vegetarian'], true)
ON CONFLICT DO NOTHING;

INSERT INTO spa_services
    (name, description, duration, price, category, is_active)
VALUES
    ('Swedish Massage', 'Relaxing full body massage using Swedish techniques', 60, 80.00, 'massage', true),
    ('Deep Tissue Massage', 'Therapeutic massage targeting muscle tension', 90, 120.00, 'massage', true),
    ('Facial Treatment', 'Deep cleansing and moisturizing facial', 45, 60.00, 'facial', true),
    ('Manicure', 'Complete nail care and polish', 30, 35.00, 'nails', true),
    ('Pedicure', 'Foot care and nail treatment', 45, 45.00, 'nails', true),
    ('Hot Stone Massage', 'Relaxing massage with heated stones', 75, 100.00, 'massage', true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, triggers, and RLS policies are in place.' as status;
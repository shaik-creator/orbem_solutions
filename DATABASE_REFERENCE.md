# ORBEM Database - Complete Reference

## Database Overview

**Database Name:** `operations_dashboard`  
**Tables:** 16  
**Connections:** MySQL 5.7+  
**Port:** 3306  
**Connection String:** `mysql://root:suhealshaik.123@127.0.0.1:3306/operations_dashboard`

---

## Table Schemas

### 1. users
Stores all system users (staff, admin, operations)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'User',
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Sample Data:**
- admin@orbem.local (Admin)
- ops@orbem.local (Operations)
- accounts@orbem.local (Accounts Staff)

**Password:** All are hashed "password"

---

### 2. customers
Stores customer/company information

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(50),
  country VARCHAR(50),
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Sample Customers:**
1. TechCorp India
2. GlobalTrade Express
3. FashionHub Stores
4. ElectroMart Online
5. SpiceExport Co

---

### 3. bookings ⭐ (Main Entity)
Stores air cargo bookings

```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  awb_number VARCHAR(20) UNIQUE,
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  cargo_type VARCHAR(50),
  pieces INT,
  weight DECIMAL(10,2),
  chargeable_weight DECIMAL(10,2),
  status VARCHAR(30) DEFAULT 'Pending',
  booking_date DATETIME,
  expected_delivery_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX (status),
  INDEX (booking_id)
);
```

**Statuses:** Pending, Confirmed, In Transit, Delivered, Completed, Cancelled, Delayed

**Sample Data:** 20 bookings (ORB001-ORB020) ranging from ₹30K to ₹220K

**Routes:** DEL-BOM, BOM-BLR, BLR-DEL, DEL-CCU, etc.

---

### 4. shipments
Tracks shipment progress and location

```sql
CREATE TABLE shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  awb_number VARCHAR(20),
  origin VARCHAR(10),
  destination VARCHAR(10),
  current_status VARCHAR(30) DEFAULT 'Pending',
  current_location VARCHAR(100),
  expected_delivery_date DATETIME,
  is_delayed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX (current_status),
  INDEX (awb_number)
);
```

**Statuses:** Pending, Picked Up, In Transit, Out for Delivery, Delivered, Completed, Cancelled

**Sample Data:** One shipment per booking with tracking

---

### 5. shipment_timeline
Tracks each shipment status change and location update

```sql
CREATE TABLE shipment_timeline (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  status VARCHAR(30),
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX (shipment_id)
);
```

**Usage:** Records each time shipment status changes or location updates

---

### 6. documents
Manages shipping documents (invoices, permits, BOL, etc.)

```sql
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  shipment_id INT,
  document_type VARCHAR(50),
  file_path VARCHAR(255),
  status VARCHAR(30) DEFAULT 'Pending',
  uploaded_by INT,
  verified_by INT,
  due_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  INDEX (status),
  INDEX (document_type)
);
```

**Document Types:** Invoice, Packing List, Bill of Lading, Export Permit, Import Permit, Certificate of Origin, Airway Bill, Customs Declaration

**Statuses:** Pending, Verified, Rejected, Expired

---

### 7. payments
Tracks payment records and invoices

```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance_amount DECIMAL(12,2),
  payment_status VARCHAR(30) DEFAULT 'Pending',
  due_date DATETIME,
  paid_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX (payment_status),
  INDEX (invoice_number)
);
```

**Statuses:** Pending, Partial, Paid, Overdue, Cancelled

**Auto-Calculation:**
- Paid: if paid_amount >= invoice_amount
- Partial: if paid_amount > 0
- Overdue: if due_date < today AND balance > 0
- Pending: otherwise

**Sample Data:** 20 payments (mix of all statuses)

---

### 8. revenue
Alternative revenue tracking (mirrors payments table for reporting)

```sql
CREATE TABLE revenue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  customer_id INT,
  invoice_number VARCHAR(50),
  invoice_amount DECIMAL(12,2),
  paid_amount DECIMAL(12,2),
  payment_status VARCHAR(30),
  due_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

**Used for:** Revenue reporting and dashboard aggregation

---

### 9. staff
Detailed staff information

```sql
CREATE TABLE staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  department VARCHAR(50),
  position VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  hire_date DATE,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Departments:** Operations, Accounts, Management, Logistics

---

### 10. staff_activity
Audit log of all user actions

```sql
CREATE TABLE staff_activity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  related_type VARCHAR(50),
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (created_at),
  INDEX (action_type)
);
```

**Action Types:** Booking, Shipment, Document, Payment, User, System

**Logged:** All CRUD operations, login attempts, important status changes

---

### 11. alerts
System alerts for delayed shipments, overdue payments, etc.

```sql
CREATE TABLE alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alert_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  related_id INT,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (is_read),
  INDEX (alert_type)
);
```

**Alert Types:**
- Delayed Shipments (Critical)
- Overdue Payments (Warning)
- Pending Documents (Warning)
- New Booking (Info)
- Document Verified (Info)
- Shipment Delivered (Success)
- Payment Received (Success)
- Staff Activity (Info)

**Auto-Created for:**
- Shipments delayed beyond expected delivery date
- Payments overdue (due_date < today AND balance > 0)
- Documents pending more than 2 days before delivery

---

### 12. assistant_messages
Stores chatbot conversation history

```sql
CREATE TABLE assistant_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role VARCHAR(20),
  message LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id),
  INDEX (created_at)
);
```

**Roles:** 'user' or 'assistant'

**Usage:** Stores all chat messages for history and context

---

### 13. settings
User preferences and system settings

```sql
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  setting_key VARCHAR(100),
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY (user_id, setting_key)
);
```

**Sample Keys:** theme, language, notifications_enabled, etc.

---

### 14. rates
Shipping rates and charges

```sql
CREATE TABLE rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  rate_per_kg DECIMAL(10,2),
  minimum_charge DECIMAL(10,2),
  currency VARCHAR(5) DEFAULT 'INR',
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (origin, destination)
);
```

---

### 15. complaints
Customer complaint tracking

```sql
CREATE TABLE complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  customer_id INT,
  complaint_type VARCHAR(50),
  description TEXT,
  status VARCHAR(30) DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

---

### 16. connections
Connection matrix between entities

```sql
CREATE TABLE connections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_type VARCHAR(50),
  from_id INT,
  to_type VARCHAR(50),
  to_id INT,
  connection_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (from_type, from_id, to_type, to_id)
);
```

---

## Key Relationships

```
users (1) ──────────────────── (many) staff_activity
          ├── password_hash
          ├── role
          └── is_active

customers (1) ───────────────── (many) bookings
              ├── company_name
              └── email

bookings (1) ────────────┬───── (many) shipments
            ├── status   │      └── current_status
            ├── dates    └───── (many) documents
            ├── cargo    └───── (many) payments
            └── AWB           └───── (many) revenue

shipments (1) ───────────────── (many) shipment_timeline
              └── current_status
                  └── current_location

documents (1) ──── (links to) bookings, shipments
              ├── status
              └── verified_by

payments (1) ────── (calculated) payment_status
             ├── Paid when: paid_amount >= invoice_amount
             ├── Partial when: paid_amount > 0
             ├── Overdue when: due_date < today AND balance > 0
             └── Pending otherwise
```

---

## Query Examples

### Get Dashboard Summary
```sql
SELECT 
  COUNT(*) as totalBookings,
  (SELECT COUNT(*) FROM shipments 
   WHERE current_status NOT IN ('Delivered', 'Completed')) as activeShipments,
  (SELECT SUM(paid_amount) FROM payments 
   WHERE MONTH(created_at)=MONTH(CURDATE()) 
   AND YEAR(created_at)=YEAR(CURDATE())) as monthlyRevenue,
  (SELECT COUNT(*) FROM alerts WHERE is_read=0) as unreadAlerts
FROM bookings;
```

### Get Delayed Shipments
```sql
SELECT s.*, b.booking_id, c.company_name
FROM shipments s
JOIN bookings b ON s.booking_id = b.id
JOIN customers c ON b.customer_id = c.id
WHERE s.is_delayed = 1 AND s.current_status NOT IN ('Delivered', 'Completed');
```

### Get Revenue by Customer (Current Month)
```sql
SELECT c.company_name, SUM(p.paid_amount) as total_paid
FROM payments p
JOIN customers c ON p.customer_id = c.id
WHERE MONTH(p.created_at)=MONTH(CURDATE())
AND YEAR(p.created_at)=YEAR(CURDATE())
GROUP BY c.id;
```

### Get Overdue Payments
```sql
SELECT p.*, b.booking_id, c.company_name
FROM payments p
JOIN bookings b ON p.booking_id = b.id
JOIN customers c ON p.customer_id = c.id
WHERE p.payment_status IN ('Pending', 'Partial')
AND p.due_date < CURDATE()
AND p.balance_amount > 0;
```

### Get Document Status by Booking
```sql
SELECT booking_id, document_type, status, COUNT(*) as count
FROM documents
GROUP BY booking_id, document_type, status;
```

---

## Indexes for Performance

```sql
-- Bookings
INDEX (status)
INDEX (booking_id)
INDEX (customer_id)

-- Shipments
INDEX (current_status)
INDEX (awb_number)
INDEX (booking_id)

-- Documents
INDEX (status)
INDEX (document_type)
INDEX (booking_id)

-- Payments
INDEX (payment_status)
INDEX (invoice_number)
INDEX (created_at)

-- Activity
INDEX (created_at)
INDEX (action_type)
INDEX (user_id)

-- Alerts
INDEX (is_read)
INDEX (alert_type)
```

---

## Data Relationships Summary

| Entity | Parents | Children | Count |
|--------|---------|----------|-------|
| Users | - | Staff, Activity, Documents (created by) | 5+ |
| Customers | - | Bookings, Payments | 5 |
| Bookings | Customers | Shipments, Documents, Payments | 20 |
| Shipments | Bookings | Timeline | 20+ |
| Documents | Bookings, Shipments | - | 40+ |
| Payments | Bookings, Customers | - | 20 |
| Revenue | Bookings, Customers | - | 20+ |
| Alerts | - | - | Auto |
| Activity | Users | - | Auto |

---

## Sample SQL Dumps

### Create & Populate (One Command)
```bash
# Create database and import schema
mysql -u root -p < backend/database/schema.sql

# Import demo data
mysql -u root -p operations_dashboard < backend/database/seed.sql

# Verify
mysql -u root -p -e "USE operations_dashboard; SELECT COUNT(*) as total_bookings FROM bookings;"
```

### Expected Counts After Seeding
```
users: 5
customers: 5
bookings: 20
shipments: 20
documents: 40+
payments: 20
revenue: 20+
alerts: 5-10 (auto-generated)
staff_activity: 50+ (logged)
```

---

## Connection String Examples

### Terminal/CLI
```bash
mysql -u root -p -h 127.0.0.1 operations_dashboard
```

### Node.js (mysql2/promise)
```javascript
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'suhealshaik.123',
  database: 'operations_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Python (pymysql)
```python
import pymysql
conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='suhealshaik.123',
    database='operations_dashboard'
)
```

---

## Backup & Restore

### Backup
```bash
mysqldump -u root -p operations_dashboard > operations_dashboard_backup.sql
```

### Restore
```bash
mysql -u root -p operations_dashboard < operations_dashboard_backup.sql
```

---

**Everything is documented. Your database is ready for production!**

# ORBEM Operations Dashboard - Complete Setup Guide

## ✅ Project Status: MySQL Integration Complete

This document provides step-by-step instructions to fully connect the ORBEM Operations Dashboard to MySQL.

---

## 🗄️ Step 1: Database Setup

### 1.1 Create Database and Import Schema

1. **Open MySQL Command Line or MySQL Workbench**

2. **Create the database and import schema:**
   ```sql
   -- Open and run the schema file:
   -- File: backend/database/schema.sql
   -- This will create:
   -- - Database: operations_dashboard
   -- - 16 tables with proper relationships and indexes
   ```

   OR run from terminal:
   ```bash
   mysql -u root -p < "c:\Users\suheal\OneDrive\Desktop\my 4th term project\backend\database\schema.sql"
   ```

   **When prompted for password:** Use the password from backend/.env (DB_PASSWORD)

3. **Verify database was created:**
   ```sql
   USE operations_dashboard;
   SHOW TABLES;
   ```

### 1.2 Import Seed Data

```bash
mysql -u root -p operations_dashboard < "c:\Users\suheal\OneDrive\Desktop\my 4th term project\backend\database\seed.sql"
```

This creates:
- ✅ 3 demo users (admin, ops, accounts)
- ✅ 5 customers
- ✅ 20 bookings with shipments
- ✅ Payments and revenue records
- ✅ Documents, alerts, activity logs
- ✅ All sample data needed for testing

---

## 🔧 Step 2: Backend Configuration

### 2.1 Environment Variables
File: `backend/.env` (already configured with)

```
PORT=5000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=suhealshaik.123
DB_NAME=operations_dashboard
JWT_SECRET=change_this_secret
CORS_ORIGIN=http://localhost:5173
GROK_API_KEY='[Your API key]'
GROK_MODEL=grok-4.3
```

### 2.2 Database Connection Test

1. **Clear any old node_modules and reinstall:**
   ```bash
   cd backend
   npm install
   ```

2. **Start backend server:**
   ```bash
   npm run dev
   ```

3. **Expected output:**
   ```
   ORBEM Operations API running on http://localhost:5000
   MySQL connection successful
   ```

4. **Test health endpoint:**
   ```
   GET http://localhost:5000/api/health
   ```

---

## 🚀 Step 3: Test Login (Demo Credentials)

### 3.1 Backend Login Test

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "admin@orbem.local",
  "password": "password"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Ananya Rao",
    "email": "admin@orbem.local",
    "role": "Admin / Owner"
  }
}
```

**Demo Users:**
- Email: `admin@orbem.local` | Password: `password` | Role: Admin
- Email: `ops@orbem.local` | Password: `password` | Role: Operations
- Email: `accounts@orbem.local` | Password: `password` | Role: Accounts

---

## 📊 Step 4: Test Key APIs

### 4.1 Dashboard Summary
**GET** `http://localhost:5000/api/dashboard/summary`

Returns: `totalBookings, activeShipments, completedShipments, pendingDocuments, delayedShipments, pendingPayments, monthlyRevenue, overduePayments, unreadAlerts`

### 4.2 Dashboard Charts
**GET** `http://localhost:5000/api/dashboard/charts`

Returns: Monthly bookings, revenue, shipment/document/payment status distributions

### 4.3 Bookings List
**GET** `http://localhost:5000/api/bookings`

Returns: All 20 demo bookings with customer and payment info

### 4.4 Shipments List
**GET** `http://localhost:5000/api/shipments`

Returns: All shipments with status and location

### 4.5 Revenue
**GET** `http://localhost:5000/api/revenue`

Returns: All payment records

### 4.6 Alerts Check
**POST** `http://localhost:5000/api/alerts/check`

Returns: Checks and creates alerts for delayed shipments and overdue payments

---

## 💻 Step 5: Frontend Setup & Connection

### 5.1 Frontend Environment
File: `frontend/.env` (already configured)

```
VITE_API_BASE_URL=http://localhost:5000
```

### 5.2 Start Frontend
```bash
cd frontend
npm install
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

### 5.3 Frontend Login Flow
1. Frontend displays login page
2. User enters credentials (use demo credentials above)
3. Frontend calls: `POST /api/auth/login`
4. Backend returns JWT token + user info
5. Frontend stores in localStorage
6. All subsequent requests include JWT in Authorization header
7. User is redirected to Dashboard

---

## 📱 Step 6: Test Frontend Features

### 6.1 Login
- Open `http://localhost:5173`
- Use demo credentials
- Should redirect to Dashboard

### 6.2 Dashboard
- Views dashboard summary with KPIs
- Charts show monthly bookings and revenue
- All data comes from MySQL

### 6.3 Bookings
- Navigate to Bookings page
- See all 20 demo bookings from database
- Click on booking to view details
- Status, dates, customer info all from MySQL

### 6.4 Create New Booking
- Click "New Booking" button
- Fill form and submit
- Data should save to MySQL
- New booking appears in list immediately

### 6.5 Revenue/Payments
- Navigate to Revenue section
- See all payment records from database
- Can update payment status
- Data syncs to MySQL

### 6.6 Assistant Chat
- Click Assistant tab
- Ask questions like:
  - "How many bookings?"
  - "Total revenue this month?"
  - "Show delayed shipments"
  - "What is status of AWB001?"
- Assistant queries MySQL and provides answers
- With Grok API key: Provides enhanced explanations

---

## 🔄 Real-time Updates (Socket.IO)

Backend already has Socket.IO configured. When new entries are created:
1. Backend saves to MySQL
2. Socket.IO emits `dashboard:refresh` event
3. Frontend listeners trigger data refetch
4. Dashboard updates in real-time

---

## 📋 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/register` - Register new user

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Shipments
- `GET /api/shipments` - List shipments
- `POST /api/shipments` - Create shipment
- `PUT /api/shipments/:id/status` - Update shipment status
- `POST /api/shipments/:id/timeline` - Add timeline entry

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `PUT /api/documents/:id/status` - Update document status

### Revenue
- `GET /api/revenue` - List revenue records
- `POST /api/revenue` - Create revenue record
- `PUT /api/revenue/:id` - Update revenue record
- `GET /api/revenue/summary` - Revenue summary

### Dashboard
- `GET /api/dashboard/summary` - Dashboard KPIs
- `GET /api/dashboard/charts` - Chart data

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts/check` - Check and create alerts
- `PUT /api/alerts/:id/read` - Mark as read

### Assistant
- `POST /api/assistant/chat` - Chat with assistant
- `GET /api/assistant/history` - Get chat history

---

## ✨ All Integrated Features

✅ **Authentication** - JWT + bcrypt, demo accounts ready
✅ **MySQL Database** - 16 tables with seed data
✅ **Bookings CRUD** - Full create/read/update/delete from MySQL
✅ **Shipments** - Track shipments with status and timeline
✅ **Documents** - Manage shipping documents
✅ **Revenue/Payments** - Track payments and revenue
✅ **Customers** - Full customer management
✅ **Dashboard** - Real-time summary and charts from MySQL
✅ **Assistant Chat** - Database-driven Q&A with optional Grok AI
✅ **Alerts** - Auto-check for delays and overdue payments
✅ **Activity Logging** - Track all user actions
✅ **Socket.IO** - Real-time notifications (optional)

---

## 🐛 Troubleshooting

### Backend won't start
1. Check MySQL is running
2. Verify DB credentials in backend/.env
3. Check DB_NAME exists in MySQL
4. Run: `npm install` in backend folder

### "Database connection failed" error
1. Verify MySQL is running
2. Check DB_HOST, DB_USER, DB_PASSWORD in backend/.env
3. Run schema.sql to create database

### Frontend can't connect to backend
1. Verify backend is running on port 5000
2. Check VITE_API_BASE_URL in frontend/.env
3. Restart frontend dev server after changing .env

### Login fails
1. Verify demo users exist in database
2. Check that schema.sql was imported successfully
3. Verify seed.sql was imported

### No data showing in dashboard
1. Verify seed.sql was imported
2. Check MySQL queries directly in MySQL Workbench
3. Look at browser console for API errors

---

## 📝 Notes

- All passwords in seed data: `password` (bcrypt hashed)
- Demo data includes 20 bookings across 5 customers
- All MySQL queries are parameterized (SQL injection safe)
- JWT tokens expire in 8 hours
- Socket.IO is optional but recommended for real-time updates

---

## 🎯 Next Steps (Optional Enhancements)

1. Deploy to production server
2. Update JWT_SECRET to strong random value
3. Configure email notifications
4. Set up automated daily backups
5. Add more custom roles and permissions
6. Integrate with actual payment gateways

---

**Setup Complete! Your ORBEM Dashboard is fully connected to MySQL.**

Questions? Check API responses and browser console for errors.

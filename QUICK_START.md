# ORBEM Dashboard - Quick Start Checklist

## ⚡ 5-Minute Setup

### 1. Database (Run in MySQL)
```bash
# Create database and tables
mysql -u root -p < backend/database/schema.sql

# Import demo data (20 bookings, 5 customers, payments)
mysql -u root -p operations_dashboard < backend/database/seed.sql
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Start Frontend  
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Login with Demo Account
- Email: `admin@orbem.local`
- Password: `password`
- Other accounts: `ops@orbem.local`, `accounts@orbem.local` (same password)

---

## 📊 Key APIs to Test

```bash
# Dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard/summary
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard/charts

# Bookings
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/bookings

# Revenue
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/revenue

# Alerts
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/alerts/check
```

---

## 📋 Database Tables (16 Total)

- ✅ users - Staff & admin accounts
- ✅ customers - Customer information
- ✅ bookings - Air cargo bookings
- ✅ shipments - Shipment tracking
- ✅ shipment_timeline - Movement tracking
- ✅ documents - Shipping documents
- ✅ payments - Payment records
- ✅ revenue - Revenue tracking
- ✅ staff - Staff details
- ✅ staff_activity - Activity logs
- ✅ alerts - Alert system
- ✅ assistant_messages - Chat history
- ✅ settings - User settings
- ✅ rates - Shipping rates
- ✅ complaints - Customer complaints
- ✅ connections - Connection matrix

---

## 🔑 Environment Variables

### backend/.env
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=suhealshaik.123
DB_NAME=operations_dashboard
JWT_SECRET=change_this_secret
GROK_API_KEY=[your key]
```

### frontend/.env
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## ✅ Features Connected to MySQL

| Feature | API | MySQL Table | Status |
|---------|-----|-------------|--------|
| Login | /auth/login | users | ✅ Ready |
| Bookings | /bookings | bookings | ✅ Ready |
| Shipments | /shipments | shipments | ✅ Ready |
| Documents | /documents | documents | ✅ Ready |
| Revenue | /revenue | payments | ✅ Ready |
| Dashboard | /dashboard/summary | Multiple | ✅ Ready |
| Charts | /dashboard/charts | Multiple | ✅ Ready |
| Alerts | /alerts/check | alerts | ✅ Ready |
| Assistant | /assistant/chat | assistant_messages | ✅ Ready |
| Activity | /activity | staff_activity | ✅ Ready |

---

## 🎯 Common Tasks

### Add New Booking from Frontend
1. Login with demo account
2. Go to Bookings → New Booking
3. Fill form → Submit
4. Data automatically saves to MySQL
5. List refreshes with new entry

### Create Invoice/Payment
1. Go to Revenue section
2. Add new revenue record
3. Fills payments table
4. Dashboard revenue KPI updates automatically

### View Dashboard
1. Dashboard shows real-time KPIs from MySQL
2. Charts show monthly trends
3. Delayed shipments & pending payments auto-detected
4. Alerts flag issues automatically

### Chat with Assistant
1. Ask questions in Assistant
2. Assistant queries MySQL for data
3. Returns answers based on actual database
4. With Grok API: Enhanced explanations

---

## 📞 Support

**Issue: MySQL Connection Fails**
- Check DB credentials in backend/.env
- Verify MySQL service is running
- Ensure database `operations_dashboard` exists

**Issue: Login Doesn't Work**
- Verify seed.sql was imported
- Check users table has admin@orbem.local record
- Try: `SELECT * FROM users WHERE email='admin@orbem.local';`

**Issue: No Data in Dashboard**
- Verify seed.sql imported (20 bookings should exist)
- Check: `SELECT COUNT(*) FROM bookings;` in MySQL
- Restart backend if data was added after startup

**Issue: Frontend Can't Connect**
- Check backend is running on 5000
- Check frontend .env VITE_API_BASE_URL=http://localhost:5000
- Clear browser cache and reload

---

## 🚀 Demo Data Ready

**20 Bookings** with:
- ✅ Multiple routes (DEL-BOM, BOM-BLR, etc.)
- ✅ Mixed statuses (Delivered, In Transit, Delayed, Pending)
- ✅ Revenue records ($50K-$220K per booking)
- ✅ Payment statuses (Paid, Partial, Pending, Overdue)
- ✅ Documents (varying statuses)

**5 Customers:**
- TechCorp India
- GlobalTrade Express
- FashionHub Stores
- ElectroMart Online
- SpiceExport Co

**Ready for Presentation!**

---

**Everything is connected to MySQL. No hardcoded data. All CRUD operations work. Go live!**

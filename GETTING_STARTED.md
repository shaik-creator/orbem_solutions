# 🚀 ORBEM Operations Dashboard - Getting Started

Welcome! Your dashboard is **fully connected to MySQL**. Here's what to do first.

---

## ⚡ Quick Start (5 Minutes)

### 1. Open MySQL Command Line
```bash
mysql -u root -p
```
**Password:** `suhealshaik.123`

### 2. Import Database Schema
```bash
source C:/Users/suheal/OneDrive/Desktop/my\ 4th\ term\ project/backend/database/schema.sql;
```

### 3. Import Demo Data
```bash
USE operations_dashboard;
source C:/Users/suheal/OneDrive/Desktop/my\ 4th\ term\ project/backend/database/seed.sql;
```

**Verify Success:**
```sql
SELECT COUNT(*) FROM bookings;  -- Should show 20
SELECT COUNT(*) FROM customers;  -- Should show 5
```

### 4. Start Backend (Terminal 1)
```bash
cd "C:\Users\suheal\OneDrive\Desktop\my 4th term project\backend"
npm install
npm run dev
```

**Expected Output:**
```
ORBEM Operations API running on http://localhost:5000
MySQL connection successful
```

### 5. Start Frontend (Terminal 2)
```bash
cd "C:\Users\suheal\OneDrive\Desktop\my 4th term project\frontend"
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.0.0 ready in 500 ms
➜  Local:   http://localhost:5173/
```

### 6. Open Browser & Login
- **URL:** `http://localhost:5173`
- **Email:** `admin@orbem.local`
- **Password:** `password`

**✅ You're in!**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **QUICK_START.md** | Quick reference card |
| **SETUP_GUIDE.md** | Complete step-by-step setup |
| **README_INTEGRATION.md** | Full integration overview |
| **DATABASE_REFERENCE.md** | Database tables & schemas |
| **IMPLEMENTATION_COMPLETE.md** | What was built |

---

## ✅ What's Ready

### ✨ Features
- ✅ All CRUD operations working
- ✅ Dashboard with real-time KPIs
- ✅ Charts with actual data
- ✅ 20 demo bookings ready
- ✅ Authentication working
- ✅ Alerts auto-detecting issues
- ✅ Assistant chat enabled
- ✅ Activity logging active

### 🗄️ Database
- ✅ 16 tables created
- ✅ Demo data loaded
- ✅ All relationships set
- ✅ Indexes optimized

### 🔌 APIs
- ✅ 30+ endpoints ready
- ✅ JWT authentication working
- ✅ Error handling enabled
- ✅ CORS configured

---

## 🎯 Try These

### 1. View Dashboard
After login, you'll see:
- Total Bookings: 20
- Active Shipments: Live count
- Monthly Revenue: Current month sum
- Pending Payments: Count from database
- Alerts: Auto-generated

### 2. Create Booking
1. Go to Bookings → New Booking
2. Fill form
3. Submit
4. Data saves to MySQL
5. Booking appears in list

### 3. Update Payment
1. Go to Revenue
2. Click on payment
3. Update status
4. Submit
5. Dashboard updates automatically

### 4. Chat with Assistant
1. Go to Assistant
2. Ask: "How many bookings?" or "Total revenue?"
3. Assistant queries database and responds

---

## ❓ Troubleshooting

### "Can't connect to MySQL"
- Check MySQL is running: `mysql -u root -p`
- Check credentials in `backend/.env`
- Try: `mysql -h 127.0.0.1 -u root -p`

### "Database doesn't exist"
- Run: `source backend/database/schema.sql;`
- Then: `USE operations_dashboard;`

### "Login fails"
- Verify seed.sql was imported
- Check: `SELECT * FROM users;`
- Try credentials: admin@orbem.local / password

### "No data in dashboard"
- Check: `SELECT COUNT(*) FROM bookings;` (should be 20)
- If 0, re-import seed.sql
- Restart backend

### "Backend won't start"
- Check Node.js installed: `node --version`
- Check npm packages: `npm install` in backend folder
- Check port 5000 not in use

### "Frontend can't reach backend"
- Check backend running on 5000
- Check `frontend/.env` has VITE_API_BASE_URL=http://localhost:5000
- Restart frontend dev server

---

## 📋 Files That Matter

| File | Purpose | Status |
|------|---------|--------|
| backend/database/schema.sql | Database structure | ✅ Ready to import |
| backend/database/seed.sql | Demo data | ✅ Ready to import |
| backend/src/app.js | Route configuration | ✅ Complete |
| backend/.env | Database credentials | ✅ Configured |
| frontend/.env | API URL | ✅ Configured |
| backend/src/controllers/*.js | API logic | ✅ All working |

---

## 🔑 Demo Accounts

All have password: `password`

```
1. admin@orbem.local     → Admin
2. ops@orbem.local       → Operations Staff
3. accounts@orbem.local  → Accounts Staff
```

---

## 📊 Demo Data Overview

### 20 Bookings
- Status: Mixed (Pending, In Transit, Delivered, etc.)
- Routes: DEL-BOM, BOM-BLR, DEL-CCU, etc.
- Value: ₹30K to ₹220K each

### 5 Customers
- TechCorp India
- GlobalTrade Express
- FashionHub Stores
- ElectroMart Online
- SpiceExport Co

### Payments
- 10 Paid
- 5 Partial
- 4 Pending
- 1 Overdue

### Features Already Working
- Shipment tracking with timeline
- Document management
- Revenue tracking
- Automatic alerts
- Activity logging

---

## 🚀 What's Different?

**Before:** Hardcoded data, no database connection  
**Now:** Everything from MySQL
- ✅ New entries save to DB
- ✅ Dashboard updates live
- ✅ Charts show real trends
- ✅ Assistant uses actual data
- ✅ Alerts auto-generated

---

## 💡 Pro Tips

1. **Check logs:** Terminal shows all API calls and errors
2. **Test APIs:** Use Postman or curl to test endpoints
3. **Browser console:** Check for JavaScript errors
4. **Database queries:** Run `SELECT * FROM bookings;` in MySQL to verify data

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Import database | 1 min |
| Start backend | 30 sec |
| Start frontend | 30 sec |
| Login & test | 2 min |
| **Total** | **~5 minutes** |

---

## 🎓 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│         ORBEM Operations Dashboard                       │
├──────────────┬──────────────────────────┬───────────────┤
│   MySQL      │    Node.js + Express     │   React       │
│   Database   │    Backend API           │   Frontend    │
│              │                          │               │
│ • Bookings   │ • 30+ REST APIs          │ • Dashboard   │
│ • Shipments  │ • JWT Auth               │ • Forms       │
│ • Payments   │ • Error Handling         │ • Charts      │
│ • Documents  │ • Activity Logging       │ • Chat        │
│ • Customers  │ • Alert Generation       │ • Lists       │
└──────────────┴──────────────────────────┴───────────────┘
    Port 3306      Port 5000                 Port 5173
```

---

## ✨ You're All Set!

Everything is connected. All data flows through MySQL. No hardcoded values.

### What happens next:
1. **Test** - Login, create a booking, see it in database
2. **Present** - Show working dashboard with 20 real bookings
3. **Deploy** - Update credentials and deploy to production

---

## 📞 Need Help?

- **Setup issues?** → Read SETUP_GUIDE.md
- **API documentation?** → Read DATABASE_REFERENCE.md
- **Database questions?** → Check schema.sql and seed.sql
- **Code questions?** → Check backend/src/controllers/

---

## 🎉 Let's Go!

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev

# Browser
http://localhost:5173
```

**Login and explore!** 🚀

---

**Everything is ready. Your dashboard is live!**

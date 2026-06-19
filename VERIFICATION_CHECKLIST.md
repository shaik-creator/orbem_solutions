# ✅ ORBEM Dashboard - Final Verification Checklist

Use this checklist to verify everything is set up correctly.

---

## 📋 Pre-Setup Verification

### System Requirements
- [ ] MySQL 5.7+ installed and running
- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm 6+ installed (`npm --version`)
- [ ] Git (optional, for version control)

### Project Files Present
- [ ] `backend/` folder exists
- [ ] `frontend/` folder exists
- [ ] `backend/database/schema.sql` exists
- [ ] `backend/database/seed.sql` exists
- [ ] `backend/.env` file exists
- [ ] `frontend/.env` file exists

---

## 🗄️ Database Setup

### Create Database
```bash
# In MySQL command line:
mysql -u root -p
```

**Paste in MySQL:**
```sql
source C:/Users/suheal/OneDrive/Desktop/my\ 4th\ term\ project/backend/database/schema.sql;
```

### Verification
```sql
-- Run in MySQL to verify database created
SHOW DATABASES;
-- Should include "operations_dashboard"

-- Check table count
USE operations_dashboard;
SHOW TABLES;
-- Should show 16 tables
```

- [ ] Database `operations_dashboard` created
- [ ] 16 tables visible (`SHOW TABLES;`)
- [ ] No errors during import

### Import Demo Data

**In MySQL:**
```sql
USE operations_dashboard;
source C:/Users/suheal/OneDrive/Desktop/my\ 4th\ term\ project/backend/database/seed.sql;
```

### Verify Demo Data
```sql
-- Verify users
SELECT COUNT(*) FROM users;
-- Should show 3

-- Verify customers
SELECT COUNT(*) FROM customers;
-- Should show 5

-- Verify bookings
SELECT COUNT(*) FROM bookings;
-- Should show 20

-- Verify payments
SELECT COUNT(*) FROM payments;
-- Should show 20

-- Check a sample booking
SELECT * FROM bookings LIMIT 1;
-- Should show columns: id, booking_id, customer_id, awb_number, origin, destination, etc.
```

- [ ] 3 users created
- [ ] 5 customers created
- [ ] 20 bookings created
- [ ] 20 payments created
- [ ] All tables have data
- [ ] No import errors

---

## 🔧 Backend Configuration

### Check Environment File
File: `backend/.env`

- [ ] `PORT=5000` exists
- [ ] `DB_HOST=127.0.0.1` (or localhost)
- [ ] `DB_USER=root`
- [ ] `DB_PASSWORD=suhealshaik.123`
- [ ] `DB_NAME=operations_dashboard`
- [ ] `JWT_SECRET` is set
- [ ] `CORS_ORIGIN=http://localhost:5173`

### Install Dependencies
```bash
cd backend
npm install
```

- [ ] `npm install` completes successfully
- [ ] `node_modules` folder created
- [ ] No critical errors during installation

### Check Key Files
- [ ] `backend/src/app.js` exists
- [ ] `backend/src/config/db.js` exists
- [ ] `backend/src/controllers/` folder has files
- [ ] `backend/src/routes/` folder has files
- [ ] `backend/src/middleware/` folder has files

### Start Backend Server
```bash
npm run dev
```

**Expected Output:**
```
ORBEM Operations API running on http://localhost:5000
MySQL connection successful
```

- [ ] Backend starts without errors
- [ ] "ORBEM Operations API running" message appears
- [ ] "MySQL connection successful" message appears
- [ ] Server listening on port 5000

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"ok","message":"ORBEM backend running"}
```

- [ ] Health check returns 200 status
- [ ] Response shows `"status":"ok"`

### Keep Backend Running
- [ ] Leave terminal window open with backend running
- [ ] Backend is ready for frontend to connect

---

## 💻 Frontend Configuration

### Check Environment File
File: `frontend/.env`

- [ ] `VITE_API_BASE_URL=http://localhost:5000`

### Install Dependencies
```bash
cd frontend
npm install
```

- [ ] `npm install` completes successfully
- [ ] `node_modules` folder created
- [ ] No critical errors during installation

### Check Key Files
- [ ] `frontend/src/App.jsx` exists
- [ ] `frontend/src/services/api.js` exists
- [ ] `frontend/src/services/authService.js` exists
- [ ] `frontend/src/pages/Login.jsx` exists
- [ ] `frontend/src/pages/Dashboard.jsx` exists

### Start Frontend Server
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.0.0 ready in 500 ms
➜  Local:   http://localhost:5173/
```

- [ ] Frontend starts without errors
- [ ] "VITE" message appears
- [ ] Local URL shows `http://localhost:5173/`

### Test Frontend Load
- [ ] Open `http://localhost:5173/` in browser
- [ ] Login page appears with form
- [ ] No console errors (check browser DevTools)

- [ ] Frontend loads successfully
- [ ] No JavaScript errors in console

---

## 🔐 Authentication Test

### Test Login with Demo Account
1. Navigate to: `http://localhost:5173/`
2. Enter Email: `admin@orbem.local`
3. Enter Password: `password`
4. Click Login

**Expected Result:**
- [ ] Login succeeds (no error message)
- [ ] Redirected to Dashboard
- [ ] User name appears in navbar
- [ ] No error messages in console

### Verify JWT Token
1. Open Browser DevTools (F12)
2. Go to Application → Local Storage
3. Look for `orbem_token` and `orbem_user`

- [ ] `orbem_token` exists in localStorage
- [ ] `orbem_user` exists in localStorage
- [ ] Both values are non-empty

### Try Other Accounts
- [ ] Login with `ops@orbem.local` / `password` works
- [ ] Login with `accounts@orbem.local` / `password` works
- [ ] Each redirects to Dashboard

---

## 📊 Dashboard Verification

### Dashboard Page Loads
- [ ] Dashboard page displays without errors
- [ ] Page title shows "Dashboard" or similar
- [ ] Navigation menu visible

### Dashboard Displays Data
- [ ] Total Bookings shows: **20**
- [ ] Active Shipments shows: A number > 0
- [ ] Completed Shipments shows: A number
- [ ] Pending Documents shows: A number
- [ ] Delayed Shipments shows: A number
- [ ] Pending Payments shows: A number

### Dashboard Charts Appear
- [ ] Monthly Bookings chart displays
- [ ] Monthly Revenue chart displays
- [ ] Shipment Status chart displays
- [ ] Document Status chart displays
- [ ] Payment Status chart displays

### Check Console for Errors
- [ ] Open Browser DevTools (F12)
- [ ] Check Console tab
- [ ] No red error messages
- [ ] Network requests showing 200 status

- [ ] All dashboard data visible
- [ ] All charts rendering
- [ ] No console errors

---

## 📋 API Endpoint Verification

### Test Key Endpoints

#### Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@orbem.local","password":"password"}'
```

- [ ] Returns JWT token
- [ ] Returns user object
- [ ] Status 200

#### Get Bookings
```bash
# Copy token from login response, replace YOUR_TOKEN
curl http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] Returns array of 20 bookings
- [ ] Each booking has: id, booking_id, status, customer_id
- [ ] Status 200

#### Dashboard Summary
```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] Returns summary object
- [ ] Has fields: totalBookings, activeShipments, etc.
- [ ] Values are numbers

#### Dashboard Charts
```bash
curl http://localhost:5000/api/dashboard/charts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] Returns charts object
- [ ] Has fields: monthlyBookings, monthlyRevenue, etc.
- [ ] Arrays contain data points

#### Alerts
```bash
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- [ ] Returns alerts array
- [ ] May be empty or have items
- [ ] Each has: id, title, description

---

## 🧪 Feature Testing

### Create New Booking (Frontend)
1. Go to Bookings page
2. Click "New Booking" button
3. Fill in form with:
   - Customer: Select one
   - AWB Number: TEST123456
   - Origin: DEL
   - Destination: BOM
   - Cargo Type: Electronics
   - Pieces: 10
   - Weight: 100
4. Click Submit

**Verification:**
- [ ] No error message appears
- [ ] Page redirects to bookings list or shows success
- [ ] Browser DevTools Network tab shows POST 200 or 201
- [ ] In MySQL: `SELECT COUNT(*) FROM bookings;` shows 21 (increased from 20)

### Verify New Booking in Database
```sql
SELECT * FROM bookings WHERE booking_id LIKE 'TEST%' OR awb_number = 'TEST123456';
```

- [ ] New booking appears in MySQL
- [ ] All fields match what was entered
- [ ] Booking has timestamp

### Test Payment Update
1. Go to Revenue/Payments page
2. Find a payment with status "Pending"
3. Click to edit
4. Change paid_amount to something higher
5. Click Save

- [ ] No error message
- [ ] Payment status may auto-update
- [ ] Dashboard payment count decreases

### Test Chat with Assistant
1. Go to Assistant page
2. Ask: "How many bookings?"
3. Send message

- [ ] Message appears in chat
- [ ] Assistant responds with a number (21 now)
- [ ] Response comes from database

### Test Alerts
1. Go to Alerts page
2. Should see some alerts listed
3. Click on alert to view details

- [ ] Alerts appear
- [ ] Can mark as read
- [ ] New alerts can be created if conditions met

---

## 🎯 Complete Feature Checklist

### Core Features
- [ ] Login works with demo account
- [ ] Dashboard loads with real data
- [ ] All 5 dashboard KPIs show numbers
- [ ] All 5 dashboard charts render
- [ ] Can create new booking
- [ ] Can edit existing booking
- [ ] Can delete booking
- [ ] Can view booking details

### Data Persistence
- [ ] New bookings save to MySQL
- [ ] Updates save to MySQL
- [ ] Deletes remove from MySQL
- [ ] Dashboard updates after changes

### Database Integration
- [ ] Database connection established
- [ ] All 16 tables exist
- [ ] Demo data (20 bookings) present
- [ ] Demo data (5 customers) present
- [ ] Demo data (20 payments) present

### API Integration
- [ ] Backend APIs return correct data
- [ ] Frontend can call all endpoints
- [ ] JWT authentication works
- [ ] CORS not blocking requests

### Error Handling
- [ ] Invalid login shows error
- [ ] 404 errors handled gracefully
- [ ] Database errors don't crash app
- [ ] Network errors show message

---

## 🚀 Final Check

### Everything Working?
- [ ] Backend running and healthy
- [ ] Frontend running without errors
- [ ] MySQL database connected
- [ ] Can login successfully
- [ ] Dashboard shows real data
- [ ] Can create new entries
- [ ] Data saves to database
- [ ] All navigation works

### Ready for Presentation?
- [ ] 20 demo bookings visible
- [ ] Dashboard KPIs displaying
- [ ] Charts showing
- [ ] Can demonstrate CRUD
- [ ] No error messages

### Ready for Deployment?
- [ ] All tests passing
- [ ] No console errors
- [ ] Database backup created
- [ ] Credentials configured
- [ ] HTTPS ready (if needed)

---

## 📝 Troubleshooting Checklist

If something isn't working, go through this:

### "Cannot connect to MySQL"
- [ ] MySQL service is running
- [ ] Credentials in backend/.env are correct
- [ ] Database `operations_dashboard` exists
- [ ] Port 3306 is open

### "Backend won't start"
- [ ] Node.js is installed
- [ ] npm install ran successfully
- [ ] No port 5000 conflicts
- [ ] No syntax errors in app.js
- [ ] Database credentials are correct

### "Frontend won't load"
- [ ] npm install ran successfully
- [ ] Backend is running on port 5000
- [ ] frontend/.env has correct API URL
- [ ] No browser cache issues (hard refresh)

### "Login fails"
- [ ] Database imported with seed.sql
- [ ] User exists: `SELECT * FROM users WHERE email='admin@orbem.local';`
- [ ] Password is correct: `password`
- [ ] Backend is running

### "No data in dashboard"
- [ ] Bookings exist: `SELECT COUNT(*) FROM bookings;` = 20
- [ ] Backend is calling correct endpoints
- [ ] Browser console shows API requests
- [ ] Response contains data

### "Charts not showing"
- [ ] Dashboard chart data endpoint works
- [ ] API returns correct format
- [ ] Frontend chart library is loaded
- [ ] Browser supports canvas/SVG

---

## ✅ Sign-Off

Once all items are checked, you're ready to:
- ✅ Present the project
- ✅ Deploy to production
- ✅ Show to stakeholders
- ✅ Add new features

**Congratulations! Your ORBEM Dashboard is fully operational.** 🎉

---

## 📞 Support

| Issue | Solution |
|-------|----------|
| Database connection fails | Check credentials, restart MySQL |
| Backend won't start | Check Node.js version, run npm install |
| Frontend won't load | Clear cache, restart dev server |
| Login fails | Verify seed.sql imported |
| No data showing | Check MySQL has 20 bookings |
| Charts blank | Check browser console for errors |

---

**All set! You're ready to go.** 🚀

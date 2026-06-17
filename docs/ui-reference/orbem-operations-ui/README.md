# ORBEM Operations Dashboard UI

Complete React + Vite UI for ORBEM Solutions Private Limited air-cargo operations.

## Includes
- Login page
- Dashboard KPIs and charts
- Bookings table
- Shipment timeline/detail
- Documents checklist
- Revenue page
- Customers page
- Staff workload
- Airline rate manager
- Alerts page
- Reports page
- Ops Assistant panel
- Profile page
- WhatsApp-style settings page

## Assistant API

This folder is a static UI reference. The working full-stack project uses a single backend Grok key:

```env
GROK_API_KEY=your_xai_key_here
GROK_MODEL=grok-4.3
```

Set the real key only in the main project file `backend/.env`. Do not add real API keys to this UI reference or to tracked README files.

## Run
```bash
npm install
npm run dev
```

Then open the localhost URL shown in the terminal.

## Paste into existing project
Copy `src/App.jsx` and `src/styles.css` into your frontend project, then import `./styles.css` from your main entry file.

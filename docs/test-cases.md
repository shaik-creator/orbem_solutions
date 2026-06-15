# Test Cases

## Authentication

- Register a new operations user with valid email and password.
- Try registering with an existing email and confirm a clean error.
- Login with seeded admin user `admin@orbem.local` and password `password`.
- Access `/api/auth/me` with and without token.

## Dashboard

- Load dashboard after login and verify KPI cards show seeded data.
- Apply status, date, route, customer, and owner filters.
- Confirm charts load without console errors.
- Use printable view.

## Bookings

- Create a booking with dimensions and verify chargeable weight.
- Edit the booking and confirm updated values appear on details page.
- Update shipment status and confirm a timeline milestone is added.
- Delete a booking as admin or operations user.
- Search bookings by booking ID and customer name.

## Documents

- Open a booking document checklist.
- Mark a document Received, Verified, and Rejected.
- Add file metadata and remarks.
- Filter bookings with pending documents.

## Payments

- Update invoice amount, paid amount, due date, and payment method.
- Confirm balance amount and payment status update.
- Set overdue due date and run alert check.

## Airline Rates

- Add a new rate.
- Edit rate values and validity dates.
- Compare route rates by chargeable weight.
- Import a CSV row and export all rates.
- Delete a rate as admin.

## Assistant

- Ask for dashboard summary.
- Ask about pending documents.
- Ask about chargeable weight.
- Ask for a customer update using a booking ID.
- Ask for weather on `BOM DXB`.
- Stop Ollama and Gemini, then confirm rule-based fallback still responds.

## Alerts and Reports

- Run manual alert check from Notifications.
- Mark a notification as read.
- Assign a notification to a task and confirm it appears on Tasks.
- Dismiss a notification and confirm it moves to Resolved.
- Download bookings, revenue, and pending documents CSV reports.
- Verify monthly summary rows.

## Feature Upgrades

- Open Dashboard and verify KPI cards, revenue chart, shipment status chart, today operations, quick actions, recent bookings, pending documents, delayed shipments, and activity feed render.
- Use each Dashboard quick action: New Booking, Add Payment, Upload Document, Run Alert Check, Ask AI Assistant, and Export Report.
- Open Customers and search by customer/company; open Customer 360 and verify details, revenue, pending payments, shipments, complaints, and document counts.
- Create a customer from the Customers modal and verify it appears in the list.
- Open Tasks, create a task, move it between To Do, In Progress, Waiting, and Completed.
- Open Calendar and verify delivery, payment, and pickup events appear for the selected date range.
- Open a booking detail page and confirm the milestone timeline shows status, date/time, updated by, location, and remarks.
- Open Documents and verify summary cards, filters, metadata fields, remarks, rejected reason hint, and verification details.
- Open Payments and verify summary cards plus Pending, Partial, Paid, and Overdue filters.
- Open AI Assistant and click each quick tool card to prefill a prompt.
- Confirm breadcrumbs appear on protected pages.
- Confirm empty states appear instead of blank page areas when a list has no records.

## Settings

- Open the Settings page after login and confirm the left menu and right details panel render.
- Open Account settings and verify current user name, email, role, phone, account status, and joined date.
- Edit appearance theme, sidebar mode, density, table row size, card style, and accent color; confirm changes apply immediately.
- Toggle a privacy setting, refresh, and confirm it persists.
- Toggle a notification setting and update summary/quiet-hour timing.
- Change assistant tone and confirm AI provider status displays without API keys.
- Clear local cache and confirm the login session remains active.
- Export bookings, payments, and pending documents from Data & Storage.
- Submit a support ticket from Help & Support and confirm a success message.
- View About Project and confirm version, company, stack, internship note, build date, and license note.
- Refresh Settings and confirm saved settings persist.
- Check mobile settings view: menu first, detail after tap, and back button returns to the menu.
- Logout from Security settings and confirm the app returns to Login.
- Refresh AI status and confirm connected/configured/unavailable states display.
- Check Security summary for last login, current browser/device, role, active session, and login activity.

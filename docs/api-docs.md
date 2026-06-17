# API Documentation

Base URL: `http://localhost:5000/api`

All routes except auth require `Authorization: Bearer <token>`.

## Auth

- `POST /auth/register` creates a user.
- `POST /auth/login` returns user and JWT.
- `GET /auth/me` returns the current user.

## Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/revenue`
- `GET /dashboard/status`
- `GET /dashboard/customer-business`
- `GET /dashboard/delayed-trend`

Summary filters: `dateFrom`, `dateTo`, `status`, `customer`, `origin`, `destination`, `owner`.

## Bookings

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `PUT /bookings/:id`
- `DELETE /bookings/:id`
- `PUT /bookings/:id/status`

Booking list filters: `q`, `status`, `customer`, `origin`, `destination`, `owner`, `dateFrom`, `dateTo`, `pendingDocuments=1`.

Chargeable weight is calculated on backend:

```text
volumetric_weight = length_cm * width_cm * height_cm * package_count / 6000
chargeable_weight = max(actual_weight, volumetric_weight)
```

## Documents

- `GET /documents/booking/:bookingId`
- `PUT /documents/:id/status`

Statuses: `Pending`, `Received`, `Verified`, `Rejected`.

## Payments

- `GET /payments`
- `PUT /payments/:bookingId`

Statuses: `Pending`, `Partial`, `Paid`, `Overdue`.

## Airline Rates

- `POST /rates`
- `GET /rates`
- `PUT /rates/:id`
- `DELETE /rates/:id`
- `GET /rates/compare?origin=BOM&destination=DXB&weight=100`
- `POST /rates/import`
- `GET /rates/export.csv`

CSV import expects `csvText` with headers:

```csv
airline_name,origin_airport,destination_airport,rate_per_kg,fuel_surcharge,handling_charge,valid_from,valid_to,notes
```

## Assistant

- `POST /assistant/chat`
- `GET /assistant/history`

Provider order: Grok API, rule-based fallback.

## Notifications

- `GET /notifications`
- `PUT /notifications/:id/read`
- `POST /notifications/run-alert-check`

## Reports

- `GET /reports/bookings.csv`
- `GET /reports/revenue.csv`
- `GET /reports/pending-documents.csv`
- `GET /reports/monthly-summary`

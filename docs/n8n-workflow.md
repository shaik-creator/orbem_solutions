# n8n Workflow Guide

The app sends alert payloads to `N8N_WEBHOOK_URL` when the variable is configured. If it is not configured, alerts stay in the in-app notifications table.

## Sample Workflow

1. Create an n8n workflow.
2. Add a Webhook trigger.
3. Set method to `POST`.
4. Copy the production webhook URL.
5. Add the URL to backend `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n-host/webhook/orbem-alerts
```

6. Add optional steps:
   - Send Slack or email notification for `severity = Critical`.
   - Create a Google Sheet row for each alert.
   - Route payment alerts to accounts.
   - Route document alerts to documentation team.

## Payload Shape

```json
{
  "event": "operations_alert",
  "notification": {
    "id": 123,
    "title": "Payment overdue",
    "message": "ORB-2026-0009 has an overdue balance.",
    "type": "Payment",
    "severity": "Critical",
    "related_booking_id": 9
  },
  "createdAt": "2026-06-11T09:00:00.000Z"
}
```

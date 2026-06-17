# Deployment Guide

## Production Checklist

- Use a strong `JWT_SECRET`.
- Use a dedicated MySQL user with limited permissions.
- Keep `.env` files out of version control.
- Serve the backend behind HTTPS.
- Set `CLIENT_URL` to the deployed frontend URL.
- Run the frontend build before hosting.

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm start
```

For a server process manager, use PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name orbem-api
```

## Frontend

```bash
cd frontend
npm install
npm run build
```

Host `frontend/dist` on any static host. Set:

```env
VITE_API_BASE_URL=https://your-api-domain/api
```

Then rebuild.

## MySQL

Import schema and seed only for demo environments. For production, import schema and create users through the register flow or admin database process.

## Optional Services

- Ollama can run on the same machine as backend or another internal host.
- Gemini requires only a backend key.
- SMTP is optional.

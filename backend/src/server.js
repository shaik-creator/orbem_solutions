require('dotenv').config();
const http = require('http');
const socketHelper = require('./config/socket');
const app = require('./app');
const { testConnection } = require('./config/db');
const { scheduleDailyAlerts } = require('./services/alertService');

const port = Number(process.env.PORT || 5000);
const corsOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
];
const server = http.createServer(app);
const io = socketHelper.init(server, corsOrigins);

app.set('io', io);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Close the old backend terminal or change PORT in .env.`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, () => {
  console.log(`ORBEM Operations API running on http://localhost:${port}`);
  testConnection()
    .then(() => console.log('MySQL database connected.'))
    .catch((error) => console.error(error.message || 'MySQL connection failed. Check backend/.env database settings.'));
  scheduleDailyAlerts();
});

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { scheduleDailyAlerts } = require('./services/alertService');

const port = Number(process.env.PORT || 5000);
const corsOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
];
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Connected to ORBEM Operations API.' });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Close the old backend terminal or change PORT in .env.`);
    process.exit(1);
  }

  throw error;
});

server.listen(port, () => {
  console.log(`ORBEM Operations API running on http://localhost:${port}`);
  scheduleDailyAlerts();
});

const { Server } = require('socket.io');

let io = null;

function init(server, corsOrigins) {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Connected to ORBEM Operations API.' });
  });

  return io;
}

function getIo() {
  return io;
}

function emit(event, data) {
  if (io) {
    io.emit(event, data);
    return true;
  }
  return false;
}

module.exports = {
  init,
  getIo,
  emit
};

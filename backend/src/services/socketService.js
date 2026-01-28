const { Server } = require('socket.io');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room for targeted updates
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined room user-${userId}`);
    });

    // Join job-specific room for job updates
    socket.on('subscribe-job', (jobId) => {
      socket.join(`job-${jobId}`);
      console.log(`Socket ${socket.id} subscribed to job-${jobId}`);
    });

    socket.on('unsubscribe-job', (jobId) => {
      socket.leave(`job-${jobId}`);
      console.log(`Socket ${socket.id} unsubscribed from job-${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit job progress to specific job room
const emitJobProgress = (jobId, data) => {
  if (io) {
    io.to(`job-${jobId}`).emit('job:progress', {
      jobId,
      ...data
    });
  }
};

// Emit job completed to specific job room
const emitJobCompleted = (jobId, data) => {
  if (io) {
    io.to(`job-${jobId}`).emit('job:completed', {
      jobId,
      ...data
    });
  }
};

// Emit job failed to specific job room
const emitJobFailed = (jobId, data) => {
  if (io) {
    io.to(`job-${jobId}`).emit('job:failed', {
      jobId,
      ...data
    });
  }
};

// Emit upload progress to user
const emitUploadProgress = (userId, uploadId, progress) => {
  if (io) {
    io.to(`user-${userId}`).emit('upload:progress', {
      uploadId,
      progress
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitJobProgress,
  emitJobCompleted,
  emitJobFailed,
  emitUploadProgress
};

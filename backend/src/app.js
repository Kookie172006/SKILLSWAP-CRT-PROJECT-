//member 3
const skillRoutes = require('../routes/skillRoutes');
const swapRoutes = require('../routes/swapRoutes');
const creditRoutes = require('../routes/creditRoutes');

//member 4
const messageRoutes = require('../routes/messageRoutes');
const sessionRoutes = require('../routes/sessionRoutes');
const reviewRoutes = require('../routes/reviewRoutes');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.FRONTEND_ORIGIN;

    if (!origin && !allowedOrigin) {
      callback(null, true);
      return;
    }

    if (!allowedOrigin) {
      callback(new Error('CORS origin not configured'));
      return;
    }

    if (origin === allowedOrigin || !origin) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  return next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSwap backend is running',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});


app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy'
  });
});


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSwap API is running!'
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

//member 3
app.use('/api/skills', skillRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/credits', creditRoutes);

//member 4
app.use('/api/messages', messageRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

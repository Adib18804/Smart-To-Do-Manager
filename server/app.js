const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import middlewares and routers
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const studyRoutes = require('./routes/studyRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'smart_student_session_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 Hours
    httpOnly: true,
    sameSite: 'lax',
    secure: false // Set to true if deploying over HTTPS
  }
}));

// Static files configuration
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// VIEW ROUTING (Serving static view files with auth checks)
// ==========================================

app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/register', authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

app.get('/dashboard', authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/tasks', authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/tasks.html'));
});

app.get('/expenses', authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/expenses.html'));
});

app.get('/study', authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/study.html'));
});

app.get('/goals', authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/goals.html'));
});

// ==========================================
// REST API ROUTING
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../views/login.html')); // Fallback
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

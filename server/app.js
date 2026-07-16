const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import database pool to auto-create tables
const pool = require('./config/db'); // আপনার db.js ফাইলের পাথ এটিই হওয়ার কথা

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
// DATABASE AUTO-MIGRATION (টেবিল অটো-তৈরি করার স্ক্রিপ্ট)
// ==========================================
async function initDatabase() {
  try {
    console.log('⏳ Checking and initializing database tables...');
    
    // ১. ইউজার টেবিল তৈরি
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // ২. টাস্ক টেবিল তৈরি (যদি আপনার প্রোজেক্টে থাকে)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ৩. এক্সপেন্স/খরচ টেবিল তৈরি
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ৪. স্টাডি সেশন টেবিল তৈরি
    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        duration INT NOT NULL, -- duration in minutes
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ৫. গোল/লক্ষ্য টেবিল তৈরি
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        target_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('✅ All database tables checked/created successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error.message);
  }
}

// ডাটাবেজ টেবিলগুলো তৈরি করার ফাংশনটি রান করানো হলো
initDatabase();

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

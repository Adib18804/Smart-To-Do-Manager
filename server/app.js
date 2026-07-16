const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import database pool
const pool = require('./config/db'); // db.js ফাইলটি server/config/db.js-এ আছে

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
// DATABASE AUTO-MIGRATION FROM SQL FILE
// ==========================================
async function initDatabase() {
  try {
    console.log('⏳ Checking and initializing database tables from SQL file...');
    
    // database/student_life_management.sql ফাইলের সঠিক পাথ নির্ধারণ
    const sqlFilePath = path.join(__dirname, '../database/student_life_management.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      let sqlQueries = fs.readFileSync(sqlFilePath, 'utf8');
      
      // ১. SQL ফাইলের সব কমেন্ট লাইন (যেমন -- বা /* */) এবং ফালতু স্পেস মুছে ফেলা হচ্ছে
      sqlQueries = sqlQueries
        .replace(/--.*$/gm, '') // একক লাইনের কমেন্ট মুছে ফেলা
        .replace(/\/\*[\s\S]*?\*\//g, '') // মাল্টি-লাইন কমেন্ট মুছে ফেলা
        .replace(/\r/g, ''); // উইন্ডোজ ক্যারি রিটার্ন রিমুভ করা

      // ২. সেমিকোলন দিয়ে প্রতিটি কুয়েরি আলাদা করা হচ্ছে
      const queries = sqlQueries
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (let query of queries) {
        const upperQuery = query.toUpperCase();
        
        // ৩. DROP DATABASE, CREATE DATABASE বা USE কুয়েরিগুলোকে বাদ দেওয়া হচ্ছে
        if (
          upperQuery.startsWith('DROP DATABASE') ||
          upperQuery.startsWith('CREATE DATABASE') ||
          upperQuery.startsWith('USE')
        ) {
          continue; 
        }
        
        // ৪. প্রতিটি কুয়েরি আলাদা ব্লকে চালানো হচ্ছে যেন একটি টেবিলে ওয়ার্নিং আসলেও বাকিগুলো না থামে
        try {
          await pool.query(query);
        } catch (err) {
          // যদি টেবিল অলরেডি তৈরি থাকে, তবে সেই ওয়ার্নিংটি আমরা ইগনোর করব
          if (!err.message.includes('already exists') && !err.message.includes('Already exists')) {
            console.warn(`⚠️ Execution warning on query: "${query.substring(0, 50)}..." -> ${err.message}`);
          }
        }
      }
      console.log('✅ Database initialization process completed successfully!');
    } else {
      console.warn('⚠️ SQL file not found at:', sqlFilePath);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error.message);
  }
}

// ডাটাবেজ ইনিশিয়েট করার ফাংশনটি কল করা হলো
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

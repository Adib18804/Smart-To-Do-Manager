const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Apply Helmet security middleware (CSP disabled to allow external CDNs)
app.use(helmet({
  contentSecurityPolicy: false
}));

// Import database pool
const pool = require("./config/db");

// Import middlewares and routers
const authMiddleware = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const studyRoutes = require("./routes/studyRoutes");
const goalRoutes = require("./routes/goalRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// New module routes
const attendanceRoutes = require("./routes/attendanceRoutes");
const noteRoutes = require("./routes/noteRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    name: "sid",
    secret:
      process.env.SESSION_SECRET || "smart_student_session_secret_key_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 Hours
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Set to true if deploying over HTTPS
    },
  }),
);

// Global target user resolution middleware for Super Admin workspace tracking
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    if (req.session.role === 'Super Admin') {
      const studentId = req.query.studentId || req.body.studentId;
      if (studentId) {
        req.userId = parseInt(studentId);
        return next();
      }
    }
    req.userId = req.session.userId;
  }
  next();
});

// Static files configuration
app.use(express.static(path.join(__dirname, "../public")));

// ==========================================
// DATABASE AUTO-MIGRATION FROM ORIGINAL SQL
// ==========================================
async function initDatabase() {
  try {
    console.log(
      "⏳ Checking and initializing database tables from original SQL file...",
    );

    // পাথের ঝামেলা এড়াতে সরাসরি প্রজেক্টের রুট থেকে পাথ হিসেব করা হচ্ছে
    const sqlFilePath = path.join(
      process.cwd(),
      "database",
      "student_life_management.sql",
    );

    if (fs.existsSync(sqlFilePath)) {
      let sqlQueries = fs.readFileSync(sqlFilePath, "utf8");

      // ১. SQL ফাইলের সব কমেন্ট লাইন এবং উইন্ডোজ ক্যারি রিটার্ন রিমুভ করা হচ্ছে
      sqlQueries = sqlQueries
        .replace(/--.*$/gm, "") // সিঙ্গেল লাইন কমেন্ট
        .replace(/\/\*[\s\S]*?\*\//g, "") // মাল্টি-লাইন কমেন্ট
        .replace(/\r/g, ""); // স্পেশাল ক্যারেক্টার ক্লিনআপ

      // ২. সেমিকোলন দিয়ে কুয়েরিগুলো আলাদা করা হচ্ছে
      const queries = sqlQueries
        .split(";")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      for (let query of queries) {
        const upperQuery = query.toUpperCase();

        // ৩. DROP DATABASE, CREATE DATABASE বা USE কুয়েরিগুলোকে বাদ দেওয়া হচ্ছে
        if (
          upperQuery.startsWith("DROP DATABASE") ||
          upperQuery.startsWith("CREATE DATABASE") ||
          upperQuery.startsWith("USE")
        ) {
          continue;
        }

        try {
          await pool.query(query);
        } catch (err) {
          // যদি টেবিল অলরেডি তৈরি করা থাকে বা ডেমো ডাটা অলরেডি ইনসার্ট করা থাকে, তবে সেই ওয়ার্নিং ইগনোর করব
          if (
            !err.message.includes("already exists") &&
            !err.message.includes("Duplicate entry")
          ) {
            console.warn(
              `⚠️ Query Execution warning: "${query.substring(0, 50)}..." -> ${err.message}`,
            );
          }
        }
      }
      console.log(
        "✅ All original database tables and sample data successfully initialized!",
      );

      // Run migrations for role and reset columns
      try {
        const [columns] = await pool.query("SHOW COLUMNS FROM `users` LIKE 'role'");
        if (columns.length === 0) {
          console.log("Adding 'role' column to users table...");
          await pool.query("ALTER TABLE `users` ADD COLUMN `role` VARCHAR(20) DEFAULT 'User'");
        }
      } catch (e) {
        console.warn("Migration warning (role):", e.message);
      }

      try {
        const [columns] = await pool.query("SHOW COLUMNS FROM `users` LIKE 'reset_token'");
        if (columns.length === 0) {
          console.log("Adding 'reset_token' and 'reset_token_expires' columns to users table...");
          await pool.query("ALTER TABLE `users` ADD COLUMN `reset_token` VARCHAR(255) DEFAULT NULL, ADD COLUMN `reset_token_expires` DATETIME DEFAULT NULL");
        }
      } catch (e) {
        console.warn("Migration warning (reset_token):", e.message);
      }

      try {
        console.log("Ensuring expenses category column type is VARCHAR(100)...");
        await pool.query("ALTER TABLE `expenses` MODIFY COLUMN `category` VARCHAR(100) DEFAULT 'Others'");
      } catch (e) {
        console.warn("Migration warning (modify category):", e.message);
      }

      // Dynamically make sure new tables exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS \`attendance\` (
            \`attendance_id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NOT NULL,
            \`subject\` VARCHAR(100) NOT NULL,
            \`date\` DATE NOT NULL,
            \`status\` ENUM('Present', 'Absent', 'Late') DEFAULT 'Present',
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS \`notes\` (
            \`note_id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NOT NULL,
            \`title\` VARCHAR(255) NOT NULL,
            \`content\` TEXT NULL,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS \`categories\` (
            \`category_id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`user_id\` INT NOT NULL,
            \`name\` VARCHAR(100) NOT NULL,
            \`color\` VARCHAR(50) DEFAULT NULL,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE,
            UNIQUE KEY \`user_category\` (\`user_id\`, \`name\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
      } catch (e) {
        console.warn("Migration warning (create tables):", e.message);
      }

      // Check and insert default Super Admin
      try {
        const adminEmail = 'admin@smartstudent.com';
        const [adminRows] = await pool.query("SELECT * FROM users WHERE email = ?", [adminEmail]);
        if (adminRows.length === 0) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('Admin@123', salt);
          await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ['Administrator', adminEmail, hashedPassword, 'Super Admin']
          );
          console.log("✅ Default Super Admin account successfully created!");
        }
      } catch (e) {
        console.warn("Migration warning (admin account):", e.message);
      }
    } else {
      console.warn(
        "⚠️ student_life_management.sql file not found at:",
        sqlFilePath,
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error.message);
  }
}

// ডাটাবেজ বিল্ড রান করানো হলো
initDatabase();

// ==========================================
// VIEW ROUTING (Serving static view files with auth checks)
// ==========================================

app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

app.get("/register", authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

app.get("/dashboard", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard.html"));
});

app.get("/tasks", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/tasks.html"));
});

app.get("/expenses", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/expenses.html"));
});

app.get("/study", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/study.html"));
});

app.get("/goals", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/goals.html"));
});

app.get("/attendance", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/attendance.html"));
});

app.get("/notes", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/notes.html"));
});

app.get("/categories", authMiddleware.requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/categories.html"));
});

app.get("/users", authMiddleware.requireSuperAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/users.html"));
});

app.get("/forgot-password", authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/forgot.html"));
});

app.get("/reset-password", authMiddleware.redirectIfAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/reset.html"));
});

// ==========================================
// REST API ROUTING
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../views/login.html")); // Fallback
});

app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ success: false, error: "Internal Server Error." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

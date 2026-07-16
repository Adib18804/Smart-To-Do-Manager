# Smart Student Productivity & Life Management System

A premium, full-stack DBMS web application designed to help students track and organize tasks, academic study hours, financial expenditures, and personal goals in a unified dashboard.

---

## 🌟 Key Features

1. **MVC Architecture**: Robust separation of concerns via Models (data layer), Views (HTML templates), and Controllers (business logic).
2. **Interactive Dashboard**: Compile real-time widgets including Productivity Scores, Upcoming Deadlines checklists, and Activity History logs.
3. **Smart Task Planner**: Search, sort by priority, and filter tasks by status with checklist completion toggles.
4. **Expense Tracker**: Register costs, monitor monthly limits, and analyze distribution trends via category charts.
5. **Study Scheduler**: Log study sessions per course/subject to analyze learning performance metrics.
6. **Goal Tracker**: Manage life milestones using progress sliders with automatic complete state updates.
7. **Bcrypt Password Security**: Advanced account registration featuring bcrypt cryptographic hashing.
8. **Real-time Analytics**: Built-in integrations using **Chart.js** displaying study timelines, spending graphs, and progress breakdowns.
9. **Dark & Light Mode**: Seamless global style transitions persisted across reloads.
10. **Activity Log**: Automatically audit logs of student creations, updates, or deletions.

---

## 📂 Project Structure

```
student-life-management/
├── database/
│   └── student_life_management.sql     # Database Schema & Mock Dataset
├── public/
│   ├── css/
│   │   └── style.css                   # Tailwind styles, Glassmorphism, Theme styles
│   ├── js/
│   │   ├── auth.js                     # Auth session & toast indicators
│   │   ├── dashboard.js                # Dashboard widgets & Chart.js instances
│   │   ├── tasks.js                    # Tasks CRUD & status toggling
│   │   ├── expenses.js                 # Expense log entries & pie charts
│   │   ├── study.js                    # Study planner logs & bar graphs
│   │   └── goals.js                    # Goals checklist & progress sliders
│   └── assets/
├── server/
│   ├── config/
│   │   └── db.js                       # MySQL2 Pool Setup
│   ├── controllers/
│   │   ├── authController.js           # Signup & session control
│   │   ├── taskController.js           # Tasks logic & logger hook
│   │   ├── expenseController.js        # Cost summaries & categories
│   │   ├── studyController.js          # Subject sessions tracking
│   │   ├── goalController.js           # Progress validation & status check
│   │   └── analyticsController.js      # Dashboard widgets & aggregate queries
│   ├── middleware/
│   │   └── authMiddleware.js           # Session checker & API redirects
│   ├── models/
│   │   ├── userModel.js                # Profile statements
│   │   ├── taskModel.js                # Tasks queries & stats
│   │   ├── expenseModel.js             # Expenses trends & groupings
│   │   ├── studyModel.js               # Hours totals & weekly groupings
│   │   ├── goalModel.js                # Goals CRUD queries
│   │   └── activityModel.js            # Logging statements
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── studyRoutes.js
│   │   ├── goalRoutes.js
│   │   └── analyticsRoutes.js
│   └── app.js                          # Express Entrypoint & View Routers
├── .env                                # Environmental configurations (Host, DB, Secrets)
├── package.json                        # Node description & run scripts
└── README.md                           # Documentation
```

---

## ⚙️ Installation & Running Guide

Follow these steps to run the project locally on your machine:

### 1. Database Setup
1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Create a new database named `student_life_management`.
4. Click on the **Import** tab.
5. Select the SQL script located in the project folder: [student_life_management.sql](file:///c:/Users/h/Desktop/miniproject/database/student_life_management.sql).
6. Click **Import** at the bottom to build tables and sample entries.

> [!NOTE]
> Alternatively, you can copy the contents of the SQL file and run it inside **MySQL Workbench** or any other MySQL administration tool.

### 2. Environment Configuration
Verify or edit database credentials in the [.env](file:///c:/Users/h/Desktop/miniproject/.env) file located in the root of the project:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=student_life_management
SESSION_SECRET=smart_student_session_secret_key_123
```

### 3. Install Dependencies
Open a terminal in the project directory (`c:/Users/h/Desktop/miniproject`) and run:
```bash
npm install
```

### 4. Start the Application
To run the server, execute:
```bash
npm start
```

For developer watch mode (requires nodemon):
```bash
npm run dev
```

### 5. Access the Web App
Open your browser and navigate to:
```url
http://localhost:3000
```

---

## 🔑 Demo Account Credentials

A default student account has been preloaded in the database sample dataset for quick testing and demonstration:

* **Email**: `test@test.com`
* **Password**: `password123`
* **Name**: `Demo Student`

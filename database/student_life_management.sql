  -- Smart Student Productivity & Life Management System Database Script
  -- Compatible with XAMPP MySQL and MySQL Workbench

  CREATE DATABASE IF NOT EXISTS `student_life_management`;
  USE `student_life_management`;

  -- Drop tables if they exist (ordered by foreign key dependencies)
  DROP TABLE IF EXISTS `activity_logs`;
  DROP TABLE IF EXISTS `goals`;
  DROP TABLE IF EXISTS `study_sessions`;
  DROP TABLE IF EXISTS `expenses`;
  DROP TABLE IF EXISTS `tasks`;
  DROP TABLE IF EXISTS `users`;

  -- 1. Users Table
  CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 2. Tasks Table
  CREATE TABLE `tasks` (
    `task_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
    `status` ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    `deadline` DATE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`status`),
    INDEX (`priority`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 3. Expenses Table
  CREATE TABLE `expenses` (
    `expense_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `category` ENUM('Food', 'Transport', 'Education', 'Entertainment', 'Others') DEFAULT 'Others',
    `expense_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`category`),
    INDEX (`expense_date`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 4. Study Sessions Table
  CREATE TABLE `study_sessions` (
    `session_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `subject_name` VARCHAR(100) NOT NULL,
    `study_date` DATE NOT NULL,
    `duration_hours` DECIMAL(4, 2) NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`study_date`),
    INDEX (`subject_name`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 5. Goals Table
  CREATE TABLE `goals` (
    `goal_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `deadline` DATE NOT NULL,
    `progress_percentage` INT DEFAULT 0,
    `status` ENUM('Active', 'Completed') DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`status`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 6. Activity Logs Table
  CREATE TABLE `activity_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `activity_type` ENUM('Create', 'Update', 'Delete', 'Complete') NOT NULL,
    `module_name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`created_at`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- ==========================================
  -- INSERT SAMPLE DATA (For Instant Dashboard Rendering)
  -- ==========================================

  -- Default student user (Email: test@test.com, Password: password123)
  -- The password hash below corresponds to standard bcrypt('password123')
  INSERT INTO `users` (`user_id`, `name`, `email`, `password`) VALUES
  (1, 'Demo Student', 'test@test.com', '$2a$10$wK1F5lI.0h2R6eQ9k076P.pSefZ3HshG6B6Jq7GgeZ3b4rM9Lge/K');

  -- Tasks
  INSERT INTO `tasks` (`user_id`, `title`, `description`, `priority`, `status`, `deadline`) VALUES
  (1, 'Finish DBMS Mini Project', 'Complete implementation, write SQL file, integrate Charts, style dashboard.', 'High', 'In Progress', CURDATE() + INTERVAL 2 DAY),
  (1, 'Read Research Paper on AI Agents', 'Read and summarize arXiv paper on agentic coding workflows.', 'Medium', 'Pending', CURDATE() + INTERVAL 5 DAY),
  (1, 'Buy Reference Textbooks', 'Purchase required reference textbooks for the new semester.', 'Low', 'Completed', CURDATE() - INTERVAL 2 DAY),
  (1, 'Prepare for Viva Presentation', 'Create slides and practice explaining DB normalization rules.', 'High', 'Pending', CURDATE() + INTERVAL 3 DAY),
  (1, 'Weekly Coding Contest', 'Participate in the online coding challenge on Saturday.', 'Medium', 'Pending', CURDATE() + INTERVAL 4 DAY);

  -- Expenses
  INSERT INTO `expenses` (`user_id`, `title`, `amount`, `category`, `expense_date`, `notes`) VALUES
  (1, 'Lunch with Friends', 450.00, 'Food', CURDATE() - INTERVAL 3 DAY, 'Burgers and fries'),
  (1, 'Monthly Bus Pass', 1200.00, 'Transport', CURDATE() - INTERVAL 10 DAY, 'Student discount applied'),
  (1, 'Reference Book', 850.00, 'Education', CURDATE() - INTERVAL 5 DAY, 'Database Management Systems'),
  (1, 'Movie Ticket', 350.00, 'Entertainment', CURDATE() - INTERVAL 1 DAY, 'Weekend release'),
  (1, 'Notebooks and Pens', 250.00, 'Others', CURDATE() - INTERVAL 4 DAY, 'Stationery items');

  -- Study Sessions
  INSERT INTO `study_sessions` (`user_id`, `subject_name`, `study_date`, `duration_hours`, `notes`) VALUES
  (1, 'Database Systems', CURDATE() - INTERVAL 4 DAY, 2.50, 'Studied SQL JOINs and Aggregations'),
  (1, 'Operating Systems', CURDATE() - INTERVAL 3 DAY, 1.50, 'Process scheduling algorithms'),
  (1, 'Computer Networks', CURDATE() - INTERVAL 2 DAY, 3.00, 'TCP/IP Model and IP addressing'),
  (1, 'Database Systems', CURDATE() - INTERVAL 1 DAY, 2.00, 'Normalization forms 1NF to 3NF'),
  (1, 'Software Engineering', CURDATE(), 1.50, 'Agile methodologies and Scrum framework');

  -- Goals
  INSERT INTO `goals` (`user_id`, `title`, `deadline`, `progress_percentage`, `status`) VALUES
  (1, 'Maintain 9.0+ CGPA', CURDATE() + INTERVAL 60 DAY, 85, 'Active'),
  (1, 'Complete 5 Core Projects', CURDATE() + INTERVAL 30 DAY, 60, 'Active'),
  (1, 'Daily Exercise for 30 Days', CURDATE() - INTERVAL 5 DAY, 100, 'Completed');

  -- Activity Logs
  INSERT INTO `activity_logs` (`user_id`, `activity_type`, `module_name`, `description`, `created_at`) VALUES
  (1, 'Create', 'Goal', 'Created goal: Maintain 9.0+ CGPA', CURRENT_TIMESTAMP - INTERVAL 5 HOUR),
  (1, 'Create', 'Study Planner', 'Logged study session for Database Systems: 2.5 hours', CURRENT_TIMESTAMP - INTERVAL 4 HOUR),
  (1, 'Create', 'Task', 'Added task: Finish DBMS Mini Project', CURRENT_TIMESTAMP - INTERVAL 3 HOUR),
  (1, 'Create', 'Expense', 'Logged expense for Reference Book: 850.00 INR', CURRENT_TIMESTAMP - INTERVAL 2 HOUR),
  (1, 'Complete', 'Task', 'Marked task: Buy Reference Textbooks as Completed', CURRENT_TIMESTAMP - INTERVAL 1 HOUR);

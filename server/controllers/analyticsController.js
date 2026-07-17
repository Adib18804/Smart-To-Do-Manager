const Task = require('../models/taskModel');
const Expense = require('../models/expenseModel');
const StudySession = require('../models/studyModel');
const Goal = require('../models/goalModel');
const Activity = require('../models/activityModel');
const Attendance = require('../models/attendanceModel');
const Note = require('../models/noteModel');
const User = require('../models/userModel');

const analyticsController = {
  /**
   * Main dashboard aggregation API
   */
  async getDashboardData(req, res) {
    try {
      const userId = req.userId || req.session.userId;
      const isSuperAdmin = req.session.role === 'Super Admin';

      // 1. Fetch card statistics in parallel
      const [taskStats, monthlyExpenses, totalStudyHours, goalStats, attendanceStats, notesCount, totalExpenses, allUsers] = await Promise.all([
        Task.getStats(userId),
        Expense.getMonthlyTotal(userId),
        StudySession.getTotalHours(userId),
        Goal.getStats(userId),
        Attendance.getStats(userId),
        Note.getCount(userId),
        Expense.getTotal(userId),
        isSuperAdmin ? User.getAll() : []
      ]);

      // 2. Fetch lists for widgets
      const [recentActivities, upcomingDeadlines] = await Promise.all([
        Activity.getRecent(userId, 6),
        Task.getUpcomingDeadlines(userId, 5)
      ]);

      // 3. Fetch chart datasets
      const [expenseTrend, weeklyStudy, expenseCategories] = await Promise.all([
        Expense.getMonthlyTrend(userId),
        StudySession.getWeeklyStats(userId),
        Expense.getCategoryTotals(userId)
      ]);

      // 4. Calculate dynamic Productivity Score
      // Formula weights: Task Completion rate (40%), Goal Achievement rate (30%), Study Consistency (30%)
      const taskRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) : 1.0;
      const goalRate = goalStats.total > 0 ? (goalStats.completed / goalStats.total) : 1.0;
      
      // Assume a target of 15 study hours for a high weekly score
      const studyRate = Math.min(1.0, totalStudyHours / 15.0);
      
      const productivityScore = Math.round((taskRate * 40) + (goalRate * 30) + (studyRate * 30));

      return res.json({
        success: true,
        cards: {
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed,
          pendingTasks: taskStats.pending,
          monthlyExpenses,
          totalExpenses,
          totalStudyHours,
          activeGoals: goalStats.active,
          completedGoals: goalStats.completed,
          attendanceStats,
          notesCount,
          totalStudents: isSuperAdmin ? allUsers.length : null
        },
        productivityScore,
        widgets: {
          recentActivities,
          upcomingDeadlines,
          allUsers: isSuperAdmin ? allUsers : null
        },
        charts: {
          expenseTrend,
          weeklyStudy,
          expenseCategories
        }
      });
    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = analyticsController;

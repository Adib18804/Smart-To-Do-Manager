const authMiddleware = {
  /**
   * Block unauthenticated access. Redirects normal views to /login,
   * sends 401 status for API routes starting with '/api/'.
   */
  requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
      return next();
    }
    
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }
    
    res.redirect('/login');
  },

  /**
   * Redirect logged-in users away from auth pages like Login/Register to Dashboard
   */
  redirectIfAuth(req, res, next) {
    if (req.session && req.session.userId) {
      return res.redirect('/dashboard');
    }
    next();
  }
};

module.exports = authMiddleware;

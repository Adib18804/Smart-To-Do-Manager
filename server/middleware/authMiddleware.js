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
  },

  /**
   * Block access for non-Super Admins. Redirects normal views to /dashboard,
   * sends 403 status for API routes starting with '/api/'.
   */
  requireSuperAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'Super Admin') {
      return next();
    }
    
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ success: false, error: 'Forbidden. Super Admin access required.' });
    }
    
    res.redirect('/dashboard');
  }
};

module.exports = authMiddleware;

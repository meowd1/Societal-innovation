function authenticate(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    // If it's an API request, return 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    // Otherwise redirect to login
    res.redirect('/login');
}

module.exports = authenticate;

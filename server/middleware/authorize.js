function authorize(allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.role) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ error: 'Unauthorized.' });
            }
            return res.redirect('/login');
        }

        if (allowedRoles.includes(req.session.role) || req.session.role === 'SUPER_ADMIN') {
            return next();
        }

        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }
        res.status(403).send('Forbidden. Insufficient permissions.');
    };
}

module.exports = authorize;

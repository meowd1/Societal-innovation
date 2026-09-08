const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/connection');

// Login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Login submission
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.render('login', { error: 'Invalid email or password.' });
        }
        
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.fullName = user.full_name;
        
        // Redirect based on role
        if (user.role === 'CITIZEN') return res.redirect('/citizen/dashboard');
        if (user.role === 'STUDENT' || user.role === 'FACULTY') return res.redirect('/university/dashboard');
        if (user.role === 'UNIVERSITY_ADMIN') return res.redirect('/university/dashboard');
        if (user.role === 'INDUSTRY_PARTNER') return res.redirect('/industry/dashboard');
        if (user.role === 'GOVERNMENT_ADMIN' || user.role === 'SUPER_ADMIN') return res.redirect('/admin/dashboard');
        
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred during login.' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const isTimeInRange = (lower, upper) => {
    return new Date().getHours() >= lower && new Date().getHours() <= upper;
}

const greetings = [
    { inTimeRange: isTimeInRange(0, 10), greeting: 'Good Morning' },
    { inTimeRange: isTimeInRange(11, 13), greeting: 'Good Day' },
    { inTimeRange: isTimeInRange(12, 16), greeting: 'Good Afternoon' },
    { inTimeRange: isTimeInRange(17, 20), greeting: 'Good Evening' },
    { inTimeRange: isTimeInRange(21, 24), greeting: 'Good Night' },
]

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
    res.render('dashboard', {
        user: req.user,
        greeting: greetings.filter(g => g.inTimeRange)[0]['greeting']
    })
);

module.exports = router;
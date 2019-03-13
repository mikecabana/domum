const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const Unsplash = require('unsplash-js').default;

const unsplash = new Unsplash({
    applicationId: process.env.UNSPLASH_ACCESS_KEY,
    secret: process.env.UNSPLASH_SECRET_KEY
});

const isTimeInRange = (lower, upper) => {
    return new Date().getHours() >= lower && new Date().getHours() <= upper;
}

const greetings = [
    { inTimeRange: isTimeInRange(0, 10), greeting: 'Good Morning', range: [0, 10] },
    { inTimeRange: isTimeInRange(11, 13), greeting: 'Good Day', range: [11, 13] },
    { inTimeRange: isTimeInRange(12, 16), greeting: 'Good Afternoon', range: [12, 16] },
    { inTimeRange: isTimeInRange(17, 20), greeting: 'Good Evening', range: [17, 20] },
    { inTimeRange: isTimeInRange(21, 24), greeting: 'Good Night', range: [21, 24] },
]

const isCurrentHourInRange = range => {
    if (range.length !== 2) {
        return false;
    }

    if (new Date().getHours() < range[0] || new Date().getHours() > range[1]) {
        return false;
    }

    return true;
}

let photo = '';
let hourRange = [];

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {

    const { greeting, range } = greetings.filter(g => g.inTimeRange)[0];

    const query = greeting;

    if (!photo && hourRange.length <= 0 && isCurrentHourInRange(range)) {

        try {
            const response = await unsplash.photos.getRandomPhoto({ query });
            const body = await response.json();
            const { urls, height, width, user } = body;

            photo = {
                urls,
                height,
                width,
                user
            };
            hourRange = range;

            res.render('dashboard', {
                user: req.user,
                greeting: greetings.filter(g => g.inTimeRange)[0]['greeting'],
                photo
            });

        } catch (err) {
            console.error(err);
        }
    } else {
        res.render('dashboard', {
            user: req.user,
            greeting: greetings.filter(g => g.inTimeRange)[0]['greeting'],
            photo
        });
    }
});

module.exports = router;
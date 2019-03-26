const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
// Load User model
const User = require('../models/User');
const Token = require('../models/Token');

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
    const { name, shortName, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !shortName || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            shortName,
            email,
            password,
            password2
        });
    } else {
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name,
                    shortName,
                    email,
                    password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser
                            .save()
                            .then(user => {
                                req.flash(
                                    'success_msg',
                                    'You are now registered and can log in'
                                );
                                res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
});

// Login
router.post('/login', passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
}), (req, res, next) => {

    // issue a remember me cookie if the option was checked
    if (!req.body.remember_me) {
        return next();
    }

    const token = jwt.sign({ userId: req.user._id }, 'secret');

    const tokenForDb = new Token({
        token,
        userId: req.user._id
    });

    tokenForDb.save()
        .then(() => {
            // 1 min = 60000
            // 1 day = 86400000
            res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: process.env.REMEMBER_ME_COOKIE_MAX_AGE });

            return next();
        })
        .catch(err => {
            return next(err);
        });
}, (req, res) => {
    res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
    res.clearCookie('remember_me');
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

module.exports = router;
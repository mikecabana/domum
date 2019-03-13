const LocalStrategy = require('passport-local').Strategy;
const RememberMeStrategy = require('passport-remember-me').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../models/User');
const Token = require('../models/Token');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            // Match user
            User.findOne({
                email: email
            }).then(user => {
                if (!user) {
                    return done(null, false, { message: 'That email is not registered' });
                }

                // Match password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) {
                        return done(err);
                    }

                    if (isMatch) {
                        return done(null, user);
                    }

                    return done(null, false, { message: 'Password incorrect' });
                });
            });
        })
    );

    passport.use(new RememberMeStrategy(
        {
            key: 'remember_me',
            cookie: {
                path: '/',
                httpOnly: true,
                maxAge: process.env.REMEMBER_ME_COOKIE_MAX_AGE
            }
        },
        // consume token
        async (token, done) => {
            try {
                const tokenFromDb = await Token.findOne({ token }).exec();

                if (!tokenFromDb) {
                    return done(null, false);
                }

                const user = await User.findOne({ _id: tokenFromDb.userId }).exec();

                if (!user) {
                    return done(null, false);
                }

                console.log('deleting token');


                await Token.findOneAndDelete({ _id: tokenFromDb._id }).exec();

                return done(null, user);

            } catch (err) {
                return done(err);
            }
        },
        // issue token
        (user, done) => {
            const token = jwt.sign({ userId: user._id }, 'secret');

            const tokenForDb = new Token({
                token,
                userId: user._id
            });

            console.log('issuing token');

            tokenForDb.save()
                .then(() => {
                    return done(null, token);
                })
                .catch(err => {
                    return done(err);
                });
        }
    ));

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
};
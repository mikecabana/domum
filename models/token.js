const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: new Date()
    }
});

const Token = mongoose.model('Token', TokenSchema);

module.exports = Token;
const mongoose = require('mongoose');

const UserInviteLink = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
        unique: true,
    },
});

const UserSchema = mongoose.model('userInviteLink',UserInviteLink);

module.exports = UserSchema;

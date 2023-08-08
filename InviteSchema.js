const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
    token: String,
    expiresAt: Date,
    isUsed: Boolean,
    email: String,
});

const Invite = mongoose.model('Invite', InviteSchema);
module.exports = Invite
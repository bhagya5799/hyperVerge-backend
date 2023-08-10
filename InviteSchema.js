const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
});

const Invite = mongoose.model('Invite', inviteSchema);

module.exports = Invite;

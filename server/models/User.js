const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    defaultShippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

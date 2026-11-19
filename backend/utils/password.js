'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 12;
let dummyPasswordHash;

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS,
    );
  }
  return dummyPasswordHash;
}

async function verifyPassword(passwordHash, password) {
  const hash = passwordHash || (await getDummyPasswordHash());
  const matches = await bcrypt.compare(password, hash);
  return Boolean(passwordHash) && matches;
}

module.exports = { verifyPassword };

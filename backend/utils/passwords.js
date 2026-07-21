const crypto = require("crypto");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateAlphabeticPassword = (length = 12) => {
  let password = "";

  while (password.length < length) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < LETTERS.length * 4) {
      password += LETTERS[byte % LETTERS.length];
    }
  }

  return password;
};

module.exports = {
  generateAlphabeticPassword,
};

const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
};

module.exports = hashPassword;

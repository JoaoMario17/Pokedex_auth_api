const { User } = require('../models');

module.exports = async function emailChecker(email) {
  const user = await User.findOne({ where: { email }});

  if(user != null) {
    throw new error(
      'this email is already in use',
      409
    )
  }
}

function error(message, code) {
  this.message = message;
  this.code = code;
}

const { User } = require('../models');

module.exports = async function findMostFaved () {
  const users = await User.findAll();
  let idsArray = [];
  let MostFavedId;

  for(var i = 0; i < users.length; i++) {
    if(users[i].favpokemons[0] !== undefined) {
      MostFavedId = users[i].favpokemons[0];
      break;
    }
  }

  users.map(user => {
    user.favpokemons.map(id => {
      if(!idsArray[id]) {
        idsArray[id] = 1;
      } else {
        idsArray[id]++;
      }
    });
  });

  idsArray.map((idcount, index) => {
    if(idsArray[MostFavedId] < idcount) {
      MostFavedId = index;
    }
  });

  return MostFavedId;
}
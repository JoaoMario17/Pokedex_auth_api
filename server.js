const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sequelize, User } = require('./models');
const userAuthentication = require('./algorithms/auth/userAuthentication')
const emailChecker = require('./algorithms/emailChecker');
const findMostFaved = require('./algorithms/findMostFaved');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 5000;
const SECRET_KEY = '123456789';

app.post('/auth/register', async(req, res) => {

  const {name, email, password, adminUser} = req.body;
  let user_role = 'basic';
  if(adminUser) user_role = 'admin';

  try {
    await emailChecker(email);
    await User.create({name, email, password, user_role});
    res.status(200).json("Cadastro Realizado");
  }catch(err) {
    if(err.code === 409) {
      return res.status(409).json({message: err.message});
    }
    return res.send(err);
  }
});

app.post('/auth/login', async (req,res) => {

  const {email, password } = req.body;
  const user = await userAuthentication(email,password);

  if(!user) {
    const status = 401;
    const message = 'Incorrect e-mail or password';
    return res.status(status).json({message});
  }

  const access_token = jwt.sign(user.uuid,SECRET_KEY);
  return res.status(200).json({access_token, user: {
    uuid: user.uuid,
    user_role: user.user_role,
  }});
});

app.get('/userdata/:uuid', authenticateToken, async (req,res) => {
  const user = await User.findOne({ where: { uuid: req.params.uuid }});
  return res.status(200).json({user});
});

app.delete('/userdelete', (req,res) => {
  const { uuid } = req.body;

  User.destroy({
    where: {
      uuid: uuid
    }
  });

  console.log('user with uuid: ', uuid, 'deleted');

  return res.status(200).send();
});

app.put('/favpokemon/add',authenticateToken, async (req,res) => {

  await User.update(
    {favpokemons: sequelize.fn('array_append', sequelize.col('favpokemons'), req.body.id)},
    {where: { uuid: req.uuid}}
  ); 

  return res.status(200).json({message: 'pokemon added to users fav list'});
});

app.put('/favpokemon/remove',authenticateToken, (req, res) => {
  User.update(
    {favpokemons: sequelize.fn('array_remove', sequelize.col('favpokemons'), req.body.id)},
    {where: { uuid: req.uuid}}
  );

  return res.status(200).json({message: 'pokemon removed from users fav list'});
});

app.get('/userscount', authenticateToken ,async (req,res) => {
  const { count } = await User.findAndCountAll();

  return res.status(200).json({usersCount: count});
});

app.get('/mostfaved', authenticateToken ,async (req,res) => {
  const mostFavedId = await findMostFaved();

  return res.status(200).json({mostFavedId: mostFavedId});
});

function authenticateToken(req,res,next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(!token) return res.sendStatus(401)

  jwt.verify(token, SECRET_KEY, (err, token_uuid) => {
    if(err) return res.sendStatus(403)

    req.uuid = token_uuid;
    next();
    return res.status(401);
  })
}

app.listen({ port: PORT}, async () => {
  console.log('Server up on PORT:', PORT);
  await sequelize.authenticate();
  console.log('DataBase Connected!');
});
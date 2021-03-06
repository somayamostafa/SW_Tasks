const _ = require('lodash');
const express = require('express');
const bcrypt = require('bcrypt');
const { User, validate } = require('../models/user');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
});
router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ userName: req.body.userName });
  if (user) return res.status(400).send('The user name is already taken');
  user = new User(_.pick(req.body, ['userName', 'name', 'password', 'hr']));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'userName', 'name']));
});

module.exports = router;

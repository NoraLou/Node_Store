const mongoose = require('mongoose');
const uuid = require('uuid');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login'})
}

exports.registerForm = (req, res) => {
  //res.send('register!!!')
  res.render('register', {title: 'Register'})
}

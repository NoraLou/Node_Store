const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify')
const uuid = require('uuid');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login'})
}

exports.registerForm = (req, res) => {
  //res.send('register!!!')
  res.render('register', {title: 'Register'})
}

//https://github.com/ctavan/express-validator
// sanitize method from express-validator indicated in app.js file...
// adds a bunch of sanitize method to the request body...

exports.validateRegister = (req, res, next) => {
  // console.log("next :", next)
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email');
  req.checkBody('password', 'password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'confirmed password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

  // check above methods and put error in a validtion object
  const errors = req.validationErrors();
  // handle error yourself
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {title: 'Register', body: req.body,
      flashes: req.flash()
     });

    return;
  }
  // no errors move on
  next()
}

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name,
  });

  // register function is from require('passport-local-mongoose')
  // User.js userSchema.plugin(passportLocalMongoose, { usernameField: 'email'})
  // function is is hashing password.
  // lib is callback based... so we use the es-6 promisify util to make it work like our promises
  // no cb - User.register(user, req.body.password, function (err, user){})
  // do this -this is better :
  const register = promisify( User.register, User );
  //store hash of password in db
  await register(user, req.body.password)
  next()
}

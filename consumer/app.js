'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

const config = require('./config');
const logger = require('morgan');
const request = require('request')
const expressLayouts = require('express-ejs-layouts');

require('debug-trace')({ always: true, colors: { log: '31', warn: '35', info: '32' } })
// Express configuration
const app = express();
// layout configuration
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.use(expressLayouts);

app.use(logger('dev'))
app.use(cookieParser());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(errorHandler());
app.use(session({ secret: 'keyboard dog', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.
//   Typically, this will be as simple as storing the user ID when serializing,
//   and finding the user by ID when deserializing.
//   However, since this example does not have a database of user records,
//   the complete user profile is serialized and deserialized.
passport.serializeUser((user, done) =>  done(null, user));
passport.deserializeUser((user, done) => {
  console.log('deserializeUser')
  console.log(user)
  done(null, user);
});

let providerName = 'oauth2Provider'
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  console.log('userProfile is called')
  console.log('accessToken : ', accessToken)
  request.get('http://localhost:3000/api/userinfo', {
    'auth': { 'bearer': accessToken }
  }, (err, res, body) => {
    console.log('body : ', body)
    return done(null, body)
  })
}
let auth2Client = new OAuth2Strategy({
    authorizationURL: config.oauth2ServerBaseUrl + config.authorizationUrl,
    tokenURL: config.oauth2ServerBaseUrl + config.tokenUrl,
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackUrl
  },
  // verify
  function(accessToken, refreshToken, profile, cb) {
    console.log('verify')
    console.log(accessToken, refreshToken)
    console.log(profile)
    cb(null, profile)
  }
)
passport.use(providerName, auth2Client)

app.get('/', (req, res, next) => {
  console.log('req.isAuthenticated', req.isAuthenticated())
  console.log('req.user', req.user)
  let user = ""
  if(req.user) user = JSON.parse(req.user)
  res.render('index', { user, isLogged: req.isAuthenticated() })
});
app.get('/login', (req, res, next) => res.render('login'));

app.get('/auth/oauth2-example', 
  passport.authenticate(providerName, { scope: ['sms','email','profile']}))

app.get('/auth/oauth2-example/callback',
  passport.authenticate(providerName, { failureRedirect: '/login' }), 
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});

const port = process.argv[2] || 3002;
app.listen(port, function() {
  console.log('OAuth2 provider is listening on port ' + port);
});

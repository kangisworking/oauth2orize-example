'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');
const passport = require('passport');
const logger = require('morgan');
const routes = require('./routes');

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
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

app.get('/', routes.site.index);
app.get('/login', routes.site.loginForm);
app.post('/login', routes.site.login);
app.get('/logout', routes.site.logout);
app.get('/account', routes.site.account);

app.get('/auth/oauth2/authorize', routes.oauth2.authorization);
app.post('/auth/oauth2/authorize/decision', routes.oauth2.decision);
app.post('/auth/oauth2/token', routes.oauth2.token);

app.get('/api/userinfo', routes.user.info);
app.get('/api/clientinfo', routes.client.info);

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('OAuth2 provider is listening on port ' + port);
});

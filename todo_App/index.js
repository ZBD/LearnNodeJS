#!/bin/env node
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var util = require('util');
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;

var uristring = 'mongodb://'+process.env.OPENSHIFT_MONGODB_DB_HOST+':'+process.env.OPENSHIFT_MONGODB_DB_PORT;

var port = process.env.OPENSHIFT_NODEJS_PORT || 5000;
/*
mongoose.connect(uristring, function (err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uristring + '. ' + err);
	}
	else {
		console.log('Succeed connected to: ' + uristring);
	}
});
*/

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Google profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
      done(null, user);
});

passport.deserializeUser(function(obj, done) {
        done(null, obj);
});


// Use the GoogleStrategy within Passport.
// Strategies in passport require a `validate` function, which accept
// credentials (in this case, an OpenID identifier and profile), and invoke a
// callback with a user object.
passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:5000/auth/google/return',
    realm: 'http://localhost:5000/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user. In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));





app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
    app.use(express.cookieParser());
  	app.use(express.session({ secret: 'keyboard cat' }));
  	// Initialize Passport! Also use passport.session() middleware, to support
  	// persistent login sessions (recommended).
  	app.use(passport.initialize());
  	app.use(passport.session());
});

//define model
var Todo = mongoose.model('Todo', {text : String});

//routes
app.get('/api/todos', ensureAuthenticated, function(req, res) {
	Todo.find(function(err, todos) {
		if (err) {
			res.send(err);
		}
		res.json(todos);
	});
});

app.post('/api/todos', ensureAuthenticated, function(req, res) {
	Todo.create({
		text : req.body.text,
		done : false
	}, function(err, todo) {
		if (err) {
			res.send(err);
		}
		Todo.find(function(err, todos) {
			if (err) {
				res.send(err);
			}
			res.json(todos);
		});
	});
});

app.delete('/api/todos/:todo_id', ensureAuthenticated, function(req, res) {
	Todo.remove({_id : req.params.todo_id}, function(err, todo) {
		if (err) {
			res.send(err);
		}
		Todo.find(function(err, todos) {
			if (err) {
				res.send(err);
			}
			res.json(todos);
		});
	});
});


// GET /auth/google
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Google authentication will involve redirecting
// the user to google.com. After authenticating, Google will redirect the
// user back to this application at /auth/google/return
app.get('/auth/google',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// GET /auth/google/return
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get('*', function(req, res) {
	res.sendfile('./public/login.html');
});


app.listen(port);
console.log('App listening on port ' + port);

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}



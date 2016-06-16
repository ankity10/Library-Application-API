
var JwtStrategy = require('passport-jwt').Strategy;

// ExtractJwt to extract the authentication token from http request header
var ExtractJwt = require('passport-jwt').ExtractJwt;

// User model to manipulate data in mongodb
var User = require('../models/model');

// Creating instance of config module
var config = require('./config');

//for google login
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Exporting passport module with a required argument as passport instance 
module.exports = function(passport) {

	// setting up options like token and secret key
	var opts = {};
	opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
	opts.secretOrKey = config.secret;

	// Configuring passport to use JwtStrategy
	passport.use(new JwtStrategy(opts, function(jwt_payload, callback){
		// finding one user whose id is equal to id inside the token
    console.log("jwt_payload="+jwt_payload.id);
		User.findOne({_id:jwt_payload.id},function(err,user){
			// if there is any error
			if(err)
			{
				return callback(err,false);
			}
			// if a user found successfully
			if(user)
			{
				callback(null,user);
			}
			// if a user not found
			else
			{
				callback(null,false);
			}
		})
	}));

	//Google login 
	 passport.use(new GoogleStrategy({
      clientID: "518965649631-hl58ps21eq9gm8ufk2rc9bnobs0h8ofo.apps.googleusercontent.com",
      clientSecret: "wPgGaelgCMgqhNkfZHQK0cfW",
      callbackURL: "http://localhost:63342/nodejs_api-Angularjs_front_end/index.html"
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'google.id': profile.id
      }, function(err, user) {
        if (user) {
          return done(err, user);
        }
        // user = new User({
        //   name: profile.displayName,
        //   email: profile.emails[0].value,
        //   username: profile.emails[0].value,
        //   provider: 'google',
        //   google: profile._json,
        //   roles: ['authenticated']
        // });
        // user.save(function(err) {
        //   if (err) {
        //     console.log(err);
        //     return done(null, false, {message: 'Google login failed, email already used by other login strategy'});
        //   } else {
        //     return done(err, user);
        //   }
        // });
      });
    }
  ));
}
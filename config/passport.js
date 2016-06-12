
var JwtStrategy = require('passport-jwt').Strategy;

// ExtractJwt to extract the authentication token from http request header
var ExtractJwt = require('passport-jwt').ExtractJwt;

// User model to manipulate data in mongodb
var User = require('../models/model');

// Creating instance of config module
var config = require('./config');

// Exporting passport module with a required argument as passport instance 
module.exports = function(passport) {

	// setting up options like token and secret key
	var opts = {};
	opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
	opts.secretOrKey = config.secret;

	// Configuring passport to use JwtStrategy
	passport.use(new JwtStrategy(opts, function(jwt_payload, callback){
		// finding one user whose id is equal to id inside the token
		User.findOne({id:jwt_payload.sub},function(err,user){
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
}
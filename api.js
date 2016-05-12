
// Express instance
var express = require('express');

// Express router instance as apiRouter
var apiRouter = express.Router();

// Creating instance of config module
var config = require('./config/config');

// Exporting apiRouter, so that in can be included in root express app.
module.exports = apiRouter;

// jsonwebtoken instance to create json web tokens
var jwt = require('jsonwebtoken');

// Mongoose ODM to manipulate mongodb.
var mongoose = require('mongoose');

// Connecting to database using preconfigured path in 'config/config.js' (config.db)
mongoose.connect(config.db);

// Passport instance for Json web token login strategy.
var passport = require('passport');

// Initializing passport
apiRouter.use(passport.initialize());

// loading passport configuration.
require('./config/passport')(passport);

// User model to manipulate data in mongodb
var User = require('./models/model');

/**
 * ['/register' api route, for registration of user]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[json]}                                  [Returns a json object]
 */
apiRouter.post("/register",function(req, res){
	var user = new User(req.body);
	user.provider = 'local';           // user is registered by our signup form
    user.roles = ['authenticated'];    // setting default role
    user.save(function(err)
    {
        // some error in saving the user then return
      	if(err){
      		res.send(err);
                  return;
      	}
        // if no error then return json object with success message
      	res.json({
      		"success" : true,
      		"message" : "User created successfully. Great job!"
      	});
    });
});

/**
 * ["/login" api route to login in.]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[Json]}                                  [Return a json object with keys "success" and "messaage"]
 */
apiRouter.post("/login",function( req, res ){
    var username = req.body.username;
    var password = req.body.password;
    // finding one user with username = 'username' or email = 'username' by using mongodb $or query
    User.findOne({$or:[{ username:username },{ email:username }]},function(err,user){
        // if error in finding the user
        if(err){
            res.send(err);
        }
        // if User not found
        if(!user)
        {
            res.json({
                success:false,
                message: "Authentication failed. User not found. "
            });

        }
        // if a user found with that username
        else
        {
            // if password matches
            if(user.authenticate(password))
            {
                var token = jwt.sign(user, config.secret,{
                    expiresIn: 100080
                });
                res.json({
                    success: true,
                    token: "JWT "+token
                });
            }
            // if password does not matches
            else
            {
                res.json({
                    success:false,
                    message: "Authentication failed. Password did not match. "
                });
            }
        }

    });
});

/**
 * [Unprotected testing route, can be accessed without authenticating]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[Json]}          [Returns a json object]
 */
apiRouter.get("/test",function(req, res){
    res.json({
        "message" : "This is a testing route ==> "+ req.baseUrl+req.url
    })
});

// Protect dash route with JWT
apiRouter.get('/dash', passport.authenticate('jwt', { session: false }), function(req, res) {
  res.send('It worked! User id is: ' + req.user._id + '.');
});
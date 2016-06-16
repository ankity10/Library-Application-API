
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

// crypto module to generate verification token
var crypto = require('crypto');
// base64url module to convert base64 to base64 url friendly token
var base64url = require('base64url');

// sparkpost email api module
var SparkPost = require('sparkpost');
var sp = new SparkPost(config.sparkpost_api_key);

// async task
var async = require('async');


/**
 * @param  {String}
 * @return {[type]}
 */
var emailToken = function(email, username, token, route, callback){
        sp.transmissions.send({
          transmissionBody: {
            content: {
              from: config.emailFrom,
              subject: 'Testing!',
              html:'<html><body><p>Hey Siteflu your verification token is <a href="' + config.app_url + ':' + config.app_port + '/api' + route+  '/?token='+token+'&username='+username+'" >Click this link to verify</a> </p></body></html>'
            },
            recipients: [
              {address: 'siteflu@gmail.com'}
            ]
          }
        }, function(err, res) {
          if (err) {
            callback(err);
            console.log('Whoops! Something went wrong');
            console.log(err);
          } else {
            callback(null);
            console.log('Woohoo! You just sent your first mailing!');
          }
        });
};















//================== unprotected routes starts =======================
/**
 * ['/register' api route, for registration of user]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[json]}                                  [Returns a json object]
 */
apiRouter.post("/register",function(req, res){
    var user = new User(req.body);
    user.provider = 'local';                           // user is registered by our signup form
    user.verificationToken = base64url(crypto.randomBytes(200));
    user.verificationTokenExpires = Date.now() + 259200000 // 3 Days         
    user.save(function(err, user)
    {
        // some error in saving the user then return
        if(err){
            res.send(err);
                  return;
        }

        // sending verification email
        emailToken(user.email, user.username, user.verificationToken, "/userverify", function(err){
            if(err){
                console.log("Error-log: Email not sent");
            }
        });

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
                // if user is verified
                // if(user.verified){
                    var jwtuser = user._id;
                    // console.log("user id : "+jwtuser);
                    var token = jwt.sign(jwtuser, config.secret, {
                    expiresIn: 100080 // one week
                    });
                    res.json({
                        success: true,
                        token: "JWT "+token
                    });
                // }
                // if user is not verified
                // else
                // {
                //     res.json({
                //         success:false,
                //         message: "Authentication failed. User not verified"
                //     })
                // }
               
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
        "message" : "This is a testing route ==> "+ req.user.id
    })
});

apiRouter.route('/resetpassword')
    // generate a reset token and send an email
    .post(function(req, res){

         async.waterfall([
                function(done) {
                    crypto.randomBytes(200, function(err, buf) {
                        var token = base64url(buf);
                        done(err, token);
                    });
                },

                function(token, done) {
                    User.findOne({
                        $or: [{
                            email: req.body.username
                        }, {
                            username: req.body.username
                        }]
                    }, function(err, user) {
                        if (err || !user) return done(true);
                        done(err, user, token);
                    });
                },

                function(user, token, done) {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                },

                function(token, user, done) {
                    emailToken(user.email, user.username, user.resetPasswordToken, "/resetpassword", function(err){
                        if(!err){
                            done(null, user);
                            // return;
                        }else{
                            error = {
                                message:"Email sending failed",
                                error:err
                            };
                            done(error,user);
                        }
                    })
                }
            ],
            // callback for async
            function(err, user) {
                var response = {
                    message: 'Mail successfully sent',
                    status: 'success'
                };
                if (err) {
                    res.json(err);
                }
                else{
                    res.json(response);                   
                }

               
            });
    })
    // verify the generated resetpassword link
    .get(function(req, res){
        // res.json({
        //     message:"Hey this is get request "+req.query.token
        // });
        
         // find one user with queried email and token
        User.findOne({
            username: req.query.username,
            resetPasswordToken: req.query.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
            },function(err,user){
                // if there is any error
                if(err){
                    res.json({
                        success: false,
                        message: "Reset Password failed. Some unkown error occured"
                    });
                }
                // if no user found with that token
                if(!user){
                    res.json({
                        success: false,
                        message: "Reset Password failed. Reset token expired or invalid"
                    });
                }
                // if user found then set verified and reset the token
                else
                {
                    // set user verified and reset verification token
                    user.resetPasswordToken="";
                    user.resetPasswordExpires="";
                    // save the updated user instance
                    user.save(function(err){
                        if(err){
                            res.send(err);
                        }
                        else{
                             res.json({
                                success: true,
                                message: "Password reset successful"
                            });
                        }
                    })
                }
        });

    });


//Checks for username available or not while signup
apiRouter.post('/usercheck',function(req,res){

    if(req.body.username){
    User.findOne({
                    $or: [{
                            email: req.body.username
                        }, {
                            username: req.body.username
                        }]},function(err,user){
                    // if there is any error
                    if(err){
                        res.json({
                            success: false,
                            message: "Error while finding username!!"
                        });
                    }
                    // if no user found with that token
                    if(user){
                        res.json({
                            success: false,
                            message: "Username Already exists!!"
                        });
                    }
                    // if user found then set verified and reset the token
                    else
                    {
                            res.json({
                                success: true,
                                message: "Username is available"
                            });

                    }

         });
    }
    else
    {
        res.json({
                success : false,
                message : "Field is empty!"
        });
    }
    });

//================== unprotected routes ends =======================










//========================== protected routes starts ==================================

 
// ===== protection middleware starts ========
// apiRouter.use(function(req, res, next){


//     passport.authenticate('jwt', function (err, user, info) {
//         if (err) { return next(err); }
//         if (!user) { return res.json({
//             success:false,
//             message:"user not authenticated"
//         }) }

//         req.logIn(user, { session: false }, function (err) {

//           // Should not cause any errors

//           if (err) { return next(err); }

//           console.log(req.user);
//           next();
//         });
//       })(req, res, next);

// });
// ===== protection middleware ends ==========

// ===== user verification middleware starts ======
// apiRouter.use(function(req, res, next){

//     User.findOne({_id: req.user._id}, function(err, user){
//         if(err){
//             return res.jsonwebtoken({
//                 success:false,
//                 message:err
//             });
//         }
//         if(!user){
//             return res.json({
//                 success:false,
//                 message:"user not found"
//             })
//         }
//         else{

//             console.log(user);

//             if(user.verified)
//             {
//                 console.log("User verified");
//                 next();
//             }
//             else
//             {
//                 res.json({
//                     success:false,
//                     message: "user not verified"
//                 })
//             }
//         }
//     })
// });
// ===== user verification middleware ends ======


// Protect dash route with JWT
apiRouter.get('/dash', passport.authenticate('jwt', { session: false }), function(req, res) {
    // res.render('/index.html');
  console.log('It worked! User id is: ' + req.user + '.');
  res.send("hi!");
  
});

/**
 * [Unprotected verification route, used for email verification]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[Json]}
 */
apiRouter.get('/userverify',function(req, res){

    // find one user with queried username and token
    User.findOne({
        username: req.query.username,
        verificationToken: req.query.token,
        verificationTokenExpires: {
            $gt: Date.now()
        }
        },function(err,user){
            // if there is any error
            if(err){
                res.json({
                    success: false,
                    message: "Verification failed. Some unkown error occured"
                });
            }
            // if no user found with that token
            if(!user){
                res.json({
                    success: false,
                    message: "Verification failed. Verification token expired or invalid"
                });
            }
            // if user found then set verified and reset the token
            else
            {
                // set user verified and reset verification token
                user.verified = true;
                user.verificationToken="";
                user.verificationTokenExpires="";
                // save the updated user instance
                user.save(function(err){
                    if(err){
                        res.send(err);
                    }
                    else{
                         res.json({
                            success: true,
                            message: "Verification successful"
                        });
                    }
                })
            }
    })
});

//Update username only
apiRouter.put('/user/id/edit/username', passport.authenticate('jwt', { session: false }), function(req, res) {

        User.findOne({_id:req.user._id},function(err,user){               // if there is any error
                if(err){
                    res.json({
                        success: false,
                        message: "Error occur"
                    });
                }
                if(!user){
                    res.json({
                        success: false,
                        message: "Username not found! User not Exists or Authentication failed."
                    });
                }
                else{
                        // console.log(req.body.username.length);
                        //User find successful and updating the updated fields
                        if(req.body.username.length)
                        {

                            // console.log("Inside if");
                            User.findOne({username:req.body.username},function(err,user){
                                if(err){
                                    res.json({
                                        success: false,
                                        message: "Error occur"
                                    });
                                    return;
                                }
                                if(user){
                                    res.json({
                                        success: false,
                                        message: "Username already exists"
                                    });
                                    return;
                                }
                                else{

                                    //if Updating Username
                                    User.update({_id:req.user._id},
                                        {
                                            $set: { username: req.body.username}
                                        }, function(err, results) {

                                                if(err)
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: "Error in Updating username"
                                                    });
                                                    return;
                                                }

                                                if(results)
                                                {
                                                    console.log("inside last else");
                                                    res.json({
                                                        success: true,
                                                        message: "Updating username Successful"
                                                    });
                                                    return;
                                                }
                                                else
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: "Username not update"
                                                    });
                                                    return;
                                                }
                                       });
                                    }
                                   
                            });
                        }
                }
        });
    });    

apiRouter.put('/user/id/edit',passport.authenticate('jwt',{session : false}), function(req,res){

    User.findOne({_id:req.user._id},function(err,user){               // if there is any error
                        if(err){
                            res.json({
                                success: false,
                                message: "Error occur"
                            });
                        }
                        if(!user){
                            res.json({
                                success: false,
                                message: "Username not found! User not Exists or Authentication failed."
                            });
                        }
                        else{
                                User.update({_id:req.user._id},
                                        {
                                            $set:   { 
                                                        name: req.body.name,
                                                        mobile: req.body.mobile,
                                                        country: req.body.country
                                                    }

                                        }, function(err, results) {

                                                if(err)
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: "Error in Updating"
                                                    });
                                                    return;
                                                }

                                                if(results)
                                                {
                                                    res.json({
                                                        success: true,
                                                        message: "Updating Successful"
                                                    });
                                                    return;
                                                }
                                                else
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: "Profile not updated"
                                                    });
                                                    return;
                                                }

                                        });
                            }

                });
});

// '/users/me' route for angular to check whether the user is signed in or not
apiRouter.get('/users/me',passport.authenticate('jwt', {session: false}), function(req, res){

});

//========================== protected routes ends ==================================















// /**
//  * ['/register' api route, for registration of user]
//  * @param  {[request object]} req                    [By default provided by express application]
//  * @param  {[response object]} res                   [By default provided by express application]
//  * @return {[json]}                                  [Returns a json object]
//  */
// apiRouter.post("/register",function(req, res){
//  var user = new User(req.body);
//  user.provider = 'local';                           // user is registered by our signup form
//     user.verificationToken = base64url(crypto.randomBytes(200));
//     user.verificationTokenExpires = Date.now() + 259200000 // 3 Days         
//     user.save(function(err, user)
//     {
//         // some error in saving the user then return
//          if(err){
//              res.send(err);
//                   return;
//          }

//         // sending verification email
//         emailToken(user.email, user.username, user.verificationToken, "/userverify", function(err){
//             if(err){
//                 console.log("Error-log: Email not sent");
//             }
//         });

//         // if no error then return json object with success message
//          res.json({
//              "success" : true,
//              "message" : "User created successfully. Great job!"
//          });
//     });
// });

// /**
//  * ["/login" api route to login in.]
//  * @param  {[request object]} req                    [By default provided by express application]
//  * @param  {[response object]} res                   [By default provided by express application]
//  * @return {[Json]}                                  [Return a json object with keys "success" and "messaage"]
//  */
// apiRouter.post("/login",function( req, res ){
//     var username = req.body.username;
//     var password = req.body.password;
//     // finding one user with username = 'username' or email = 'username' by using mongodb $or query
//     User.findOne({$or:[{ username:username },{ email:username }]},function(err,user){
//         // if error in finding the user
//         if(err){
//             res.send(err);
//         }
//         // if User not found
//         if(!user)
//         {
//             res.json({
//                 success:false,
//                 message: "Authentication failed. User not found. "
//             });

//         }
//         // if a user found with that username
//         else
//         {
//             // if password matches
//             if(user.authenticate(password))
//             {
//                 // if user is verified
//                 // if(user.verified){
//                     var jwtuser = user._id;
//                     // console.log("user id : "+jwtuser);
//                     var token = jwt.sign(jwtuser, config.secret, {
//                     expiresIn: 100080 // one week
//                     });
//                     res.json({
//                         success: true,
//                         token: "JWT "+token
//                     });
//                 // }
//                 // if user is not verified
//                 // else
//                 // {
//                 //     res.json({
//                 //         success:false,
//                 //         message: "Authentication failed. User not verified"
//                 //     })
//                 // }
               
//             }
//             // if password does not matches
//             else
//             {
//                 res.json({
//                     success:false,
//                     message: "Authentication failed. Password did not match. "
//                 });
//             }
//         }

//     });
// });

// /**
//  * [Unprotected testing route, can be accessed without authenticating]
//  * @param  {[request object]} req                    [By default provided by express application]
//  * @param  {[response object]} res                   [By default provided by express application]
//  * @return {[Json]}          [Returns a json object]
//  */
// apiRouter.get("/test",function(req, res){
//     res.json({
//         "message" : "This is a testing route ==> "+ req.baseUrl+req.url
//     })
// });

// // Protect dash route with JWT
// apiRouter.get('/dash', passport.authenticate('jwt', { session: false }), function(req, res) {
//     // res.render('/index.html');
//   console.log('It worked! User id is: ' + req.user + '.');
//   res.send("hi!");
  
// });

// /**
//  * [Unprotected verification route, used for email verification]
//  * @param  {[request object]} req                    [By default provided by express application]
//  * @param  {[response object]} res                   [By default provided by express application]
//  * @return {[Json]}
//  */
// apiRouter.get('/userverify',function(req, res){

//     // find one user with queried username and token
//     User.findOne({
//         username: req.query.username,
//         verificationToken: req.query.token,
//         verificationTokenExpires: {
//             $gt: Date.now()
//         }
//         },function(err,user){
//             // if there is any error
//             if(err){
//                 res.json({
//                     success: false,
//                     message: "Verification failed. Some unkown error occured"
//                 });
//             }
//             // if no user found with that token
//             if(!user){
//                 res.json({
//                     success: false,
//                     message: "Verification failed. Verification token expired or invalid"
//                 });
//             }
//             // if user found then set verified and reset the token
//             else
//             {
//                 // set user verified and reset verification token
//                 user.verified = true;
//                 user.verificationToken="";
//                 user.verificationTokenExpires="";
//                 // save the updated user instance
//                 user.save(function(err){
//                     if(err){
//                         res.send(err);
//                     }
//                     else{
//                          res.json({
//                             success: true,
//                             message: "Verification successful"
//                         });
//                     }
//                 })
//             }
//     })
// });


// apiRouter.route('/resetpassword')
//     // generate a reset token and send an email
//     .post(function(req, res){

//          async.waterfall([
//                 function(done) {
//                     crypto.randomBytes(200, function(err, buf) {
//                         var token = base64url(buf);
//                         done(err, token);
//                     });
//                 },

//                 function(token, done) {
//                     User.findOne({
//                         $or: [{
//                             email: req.body.username
//                         }, {
//                             username: req.body.username
//                         }]
//                     }, function(err, user) {
//                         if (err || !user) return done(true);
//                         done(err, user, token);
//                     });
//                 },

//                 function(user, token, done) {
//                     user.resetPasswordToken = token;
//                     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//                     user.save(function(err) {
//                         done(err, token, user);
//                     });
//                 },

//                 function(token, user, done) {
//                     emailToken(user.email, user.username, user.resetPasswordToken, "/resetpassword", function(err){
//                         if(!err){
//                             done(null, user);
//                             // return;
//                         }else{
//                             error = {
//                                 message:"Email sending failed",
//                                 error:err
//                             };
//                             done(error,user);
//                         }
//                     })
//                 }
//             ],
//             // callback for async
//             function(err, user) {
//                 var response = {
//                     message: 'Mail successfully sent',
//                     status: 'success'
//                 };
//                 if (err) {
//                     res.json(err);
//                 }
//                 else{
//                     res.json(response);                   
//                 }

               
//             });
//     })
//     // verify the generated resetpassword link
//     .get(function(req, res){
//         // res.json({
//         //     message:"Hey this is get request "+req.query.token
//         // });
        
//          // find one user with queried email and token
//         User.findOne({
//             username: req.query.username,
//             resetPasswordToken: req.query.token,
//             resetPasswordExpires: {
//                 $gt: Date.now()
//             }
//             },function(err,user){
//                 // if there is any error
//                 if(err){
//                     res.json({
//                         success: false,
//                         message: "Reset Password failed. Some unkown error occured"
//                     });
//                 }
//                 // if no user found with that token
//                 if(!user){
//                     res.json({
//                         success: false,
//                         message: "Reset Password failed. Reset token expired or invalid"
//                     });
//                 }
//                 // if user found then set verified and reset the token
//                 else
//                 {
//                     // set user verified and reset verification token
//                     user.resetPasswordToken="";
//                     user.resetPasswordExpires="";
//                     // save the updated user instance
//                     user.save(function(err){
//                         if(err){
//                             res.send(err);
//                         }
//                         else{
//                              res.json({
//                                 success: true,
//                                 message: "Password reset successful"
//                             });
//                         }
//                     })
//                 }
//         });

//     });



// //Checks for username available or not while signup
// apiRouter.post('/usercheck',function(req,res){

//     if(req.body.username){
//     User.findOne({
//                     $or: [{
//                             email: req.body.username
//                         }, {
//                             username: req.body.username
//                         }]},function(err,user){
//                     // if there is any error
//                     if(err){
//                         res.json({
//                             success: false,
//                             message: "Error while finding username!!"
//                         });
//                     }
//                     // if no user found with that token
//                     if(user){
//                         res.json({
//                             success: false,
//                             message: "Username Already exists!!"
//                         });
//                     }
//                     // if user found then set verified and reset the token
//                     else
//                     {
//                             res.json({
//                                 success: true,
//                                 message: "Username is available"
//                             });

//                     }

//          });
// }
// else
// {
//     res.json({
//             success : false,
//             message : "Field is empty!"
//     });
// }
// });


// //Update username only
// apiRouter.put('/user/id/edit/username', passport.authenticate('jwt', { session: false }), function(req, res) {

//         User.findOne({_id:req.user._id},function(err,user){               // if there is any error
//                 if(err){
//                     res.json({
//                         success: false,
//                         message: "Error occur"
//                     });
//                 }
//                 if(!user){
//                     res.json({
//                         success: false,
//                         message: "Username not found! User not Exists or Authentication failed."
//                     });
//                 }
//                 else{
//                         // console.log(req.body.username.length);
//                         //User find successful and updating the updated fields
//                         if(req.body.username.length)
//                         {

//                             // console.log("Inside if");
//                             User.findOne({username:req.body.username},function(err,user){
//                                 if(err){
//                                     res.json({
//                                         success: false,
//                                         message: "Error occur"
//                                     });
//                                     return;
//                                 }
//                                 if(user){
//                                     res.json({
//                                         success: false,
//                                         message: "Username already exists"
//                                     });
//                                     return;
//                                 }
//                                 else{

//                                     //if Updating Username
//                                     User.update({_id:req.user._id},
//                                         {
//                                             $set: { username: req.body.username}
//                                         }, function(err, results) {

//                                                 if(err)
//                                                 {
//                                                     res.json({
//                                                         success: false,
//                                                         message: "Error in Updating username"
//                                                     });
//                                                     return;
//                                                 }

//                                                 if(results)
//                                                 {
//                                                     console.log("inside last else");
//                                                     res.json({
//                                                         success: true,
//                                                         message: "Updating username Successful"
//                                                     });
//                                                     return;
//                                                 }
//                                                 else
//                                                 {
//                                                     res.json({
//                                                         success: false,
//                                                         message: "Username not update"
//                                                     });
//                                                     return;
//                                                 }
//                                        });
//                                     }
                                   
//                             });
//                         }
//                 }
//         });
//     });    




// //route to edit/update profile details
// apiRouter.put('/user/id/edit',passport.authenticate('jwt',{session : false}), function(req,res){

//     User.findOne({_id:req.user._id},function(err,user){               // if there is any error
//                         if(err){
//                             res.json({
//                                 success: false,
//                                 message: "Error occur"
//                             });
//                         }
//                         if(!user){
//                             res.json({
//                                 success: false,
//                                 message: "Username not found! User not Exists or Authentication failed."
//                             });
//                         }
//                         else{
//                                 User.update({_id:req.user._id},
//                                         {
//                                             $set:   { 
//                                                         name: req.body.name,
//                                                         mobile: req.body.mobile,
//                                                         country: req.body.country
//                                                     }

//                                         }, function(err, results) {

//                                                 if(err)
//                                                 {
//                                                     res.json({
//                                                         success: false,
//                                                         message: "Error in Updating"
//                                                     });
//                                                     return;
//                                                 }

//                                                 if(results)
//                                                 {
//                                                     res.json({
//                                                         success: true,
//                                                         message: "Updating Successful"
//                                                     });
//                                                     return;
//                                                 }
//                                                 else
//                                                 {
//                                                     res.json({
//                                                         success: false,
//                                                         message: "Profile not updated"
//                                                     });
//                                                     return;
//                                                 }

//                                         });
//                             }

//                 });
// });


//       // Setting the google oauth routes
// // apiRouter.route('/auth/google')
//         .get(passport.authenticate('google', {
//           failureRedirect: "/",
//           scope: [
//             'https://www.googleapis.com/auth/userinfo.profile',
//             'https://www.googleapis.com/auth/userinfo.email'
//           ]
//         }), function(req, res) {
//           if (req.isAuthenticated()) {
//             return res.redirect('/');
//           }
//           res.redirect('/test');
//         });

//       apiRouter.route('/api/auth/google/callback')
//         .get(passport.authenticate('google', {
//           failureRedirect: "/"
//         }), function(req, res) {
//           if (req.isAuthenticated()) {
//             return res.redirect('/');
//           }
//           res.redirect('/test');
//         });
//  
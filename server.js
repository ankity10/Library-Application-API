const env          = process.env;
var express = require('express');

// Express app instance
var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');



    next();
}

    app.use(allowCrossDomain);


// Morgan instance to log each request on terminal
var morgan = require('morgan');

// BodyParser instance to include body attribute in "POST" requests and parse the variables in that body object.
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Passport instance for Json web token login strategy.
var passport = require('passport');

// var port =  8080;

// rootRouter for root express app
var rootRouter = express.Router();

// Start using morgan to log request on terminal
app.use(morgan('dev'));

// Initializing passport
app.use(passport.initialize());

// loading passport configuration.
require('./config/passport')(passport);


/**
 * [Root level middleware, Every request passes through this function]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @param  {[next object]} next						 [By default provided by express application]
 */
rootRouter.use(function(req, res, next){
	console.log('Request came');
	next(); // move to other routes
});

/**
 * [Unprotected testing route root level, can be accessed without authenticating]
 * @param  {[request object]} req                    [By default provided by express application]
 * @param  {[response object]} res                   [By default provided by express application]
 * @return {[Json]}          [Returns a json object]
 */
rootRouter.get('/', function(req, res){
	res.json({message: 'Welcome to our api!'});
});

// registeering our roootRoute.
app.use(rootRouter);

// API module instance.
var apiRouter = require('./api');

// Registering API Router
app.use('/api',apiRouter);

// Start listening on port 3000
app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
  console.log(`Application worker ${process.pid} started...`);
});
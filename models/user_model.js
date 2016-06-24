'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
  Schema    = mongoose.Schema,
  crypto    = require('crypto'),
  _   = require('lodash');

/**
 * Validations
 */
var validatePresenceOf = function(value) {
  // If you are authenticating by any of the oauth strategies, don't validate.
  return (this.provider && this.provider !== 'local') || (value && value.length);
};

var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model('User');
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0);
  });
};

var validateUniqueUsername = function(value, callback) {
  var User = mongoose.model('User');
  User.find({
    $and: [{
      username: value
    },
    {
      _id: {
          $ne: this._id
      }
    }]
  }, function(err, user){
    callback(err || user.length === 0);
  });
};
/**
 * Getter
 */
var escapeProperty = function(value) {
  return _.escape(value); // for more info check https://lodash.com/docs#escape
};

/**
 * User Schema
 */



var UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    get: escapeProperty,
    maxlength: [80, "Name should be less 80 characters"]
  },
  email: {
    type: String,
    required: true,
    unique: true,
    // Regexp to validate emails with more strict rules 
    match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please enter a valid email'],
    validate: [validateUniqueEmail, 'E-mail address is already in-use'],
    maxlength: [80, "Email should be less 80 characters"]
  },
  username: {
    type: String,
    unique: true,
    required: true,
    get: escapeProperty,
    validate: [validateUniqueUsername, 'Username is already in-use'],
    maxlength: [50, "Username should be less 50 characters"],
    match: [/^[a-zA-Z0-9_]*$/, "Please enter a valid username, use only alphabet or numeric or underscore. No special charecters are allowed."]
  },
  role: {
    type: String,
    enum: ['publisher','reader','admin'],
    maxlength: [20, "Roles should be less then 20 characters"]
  },
  hashed_password: {
    type: String,
    validate: [validatePresenceOf, 'Password cannot be blank']
  },
  provider: {
    type: String,
    default: 'local'
  },
  mobile: {
    type: String,
    match: [/^\d{10}$/,"Please enter a valid mobile number"]
  },
  country: {
    type: String,
    maxlength: [30, "Country should be less then 30 characters"]
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  salt: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profile: {},
  facebook: {},
  twitter: {},
  github: {},
  google: {},
  linkedin: {}
});

/**
 * Virtuals
 */
UserSchema.virtual('password').set(function(password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashed_password = this.hashPassword(password);
}).get(function() {
  return this._password;
});

/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
  if (this.isNew && this.provider === 'local' && this.password && !this.password.length)
    return next(new Error('Invalid password'));
  next();
});

/**
 * Methods
 */

/**
 * HasRole - check if the user has required role
 *
 * @param {String} plainText
 * @return {Boolean}
 * @api public
 */
UserSchema.methods.hasRole = function(role) {
  var roles = this.roles;
  return roles.indexOf('admin') !== -1 || roles.indexOf(role) !== -1;
};

/**
 * IsAdmin - check if the user is an administrator
 *
 * @return {Boolean}
 * @api public
 */
UserSchema.methods.isAdmin = function() {
  return this.role== 'admin';
};

/**
 * Authenticate - check if the passwords are the same
 *
 * @param {String} plainText
 * @return {Boolean}
 * @api public
 */
UserSchema.methods.authenticate = function(plainText) {
  return this.hashPassword(plainText) === this.hashed_password;
};

/**
 * Make salt
 *
 * @return {String}
 * @api public
 */
UserSchema.methods.makeSalt = function() {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Hash password
 *
 * @param {String} password
 * @return {String}
 * @api public
 */
UserSchema.methods.hashPassword = function(password) {
  if (!password || !this.salt) return '';
  var salt = new Buffer(this.salt, 'base64');
  return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

/**
 * Hide security sensitive fields
 *
 * @returns {*|Array|Binary|Object}
 */
UserSchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj.hashed_password;
  delete obj.salt;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.resetPasswordExpires;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
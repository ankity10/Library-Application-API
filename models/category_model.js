/**
 * Created by siteflu on 21/6/16.
 */
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
// var validatePresenceOf = function(value) {
//     // If you are authenticating by any of the oauth strategies, don't validate.
//     return (this.provider && this.provider !== 'local') || (value && value.length);
// };
//
//
// /**
//  * Getter
//  */
// var escapeProperty = function(value) {
//     return _.escape(value); // for more info check https://lodash.com/docs#escape
// };


var CategorySchema = new Schema({

    name : {                        
        type : String,
        default : 'test'
    }
});

module.exports = mongoose.model('Category', CategoriesSchema);
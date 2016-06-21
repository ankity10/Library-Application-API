/**
 * Created by siteflu on 18/6/16.
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

/**
 * Getter
 */
var escapeProperty = function(value) {
    return _.escape(value); // for more info check https://lodash.com/docs#escape
};

/**
 * Book Schema
 */


var BookSchema = new Schema({
    
   name : {
       type : String,
       required : true,
       get : escapeProperty,
       maxlength : [100, "Name should be less 100 characters"]
   }, 
    categories : {
        type : String,
        default : 'test',
        required : true
    },
    pages : {
        type : String,
        required : true,
    },
    view : {
        type : Number,
        default : 0
    },
    reponse :{
        type : Number,
        default : 0
    },
    publish_duration :{
        type : Number,
        default : 30            //in days
    },
    publisher :{
        type: Schema.ObjectId,
        ref:'User',
        required: true
    },

    first_published_date : Date,
    publish_start_date : Date,
    publish_end_date : Date,

    cover_image : {},
    pdf_path : {},
    slug : {},
    response_ratio: {}


    
});

module.exports = mongoose.model('Book', BookSchema);
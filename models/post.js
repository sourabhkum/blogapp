const mongoose = require('mongoose');
const validator = require('validator');
const moment = require('moment');
const _ = require('lodash');
const Schema = mongoose.Schema;

var PostSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        minlength: 10,
        trim: true,

    },
    body: {
        type: String,
        required: true,
        minlength: 200,
        trim: true

    },
    imageUrl: {
        type: String,
        trim: true,
    },
    dateCreated: {
        type: Date, default: Date.now
    },
    dateModified: {
        type: Date, default: Date.now
    },
    creator:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [{
        commentBody:{
            type:String,
            require:true
        },
        commentDate:{
            type:Date,
            default:Date.now  
        },
        commentuser:{
            type:Schema.Types.ObjectId,
            ref:'User'
        }
    }]
});

PostSchema.methods.toJSON = function () {
    var post = this;
    var postObject = post.toObject();
    return _.pick(postObject, ['_id', 'heading', 'body', 'imageUrl','dateCreated','dateModified','creator.firstName','creator.lastName','comments']);
};
var Post = mongoose.model('Post', PostSchema);
module.exports = { Post };

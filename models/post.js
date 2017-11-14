const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

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
        text: String,
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
});
PostSchema.methods.toJSON = function () {
    var post = this;
    var postObject = post.toObject();
    return _.pick(postObject, ['_id', 'heading', 'body', 'imageUrl','creator.firstName','creator.lastName']);
};
var Post = mongoose.model('Post', PostSchema);
module.exports = { Post };

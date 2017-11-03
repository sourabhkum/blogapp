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
});
PostSchema.methods.toJSON = function () {
    var post = this;
    var userObject = post.toObject();
    return _.pick(userObject, ['_id', 'heading', 'body', 'imageUrl']);
};
var Post = mongoose.model('Post', PostSchema);
module.exports = { Post };

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const { Post } = require('../models/post');
const { mongoose } = require('../db/connection');
const { User } = require('../models/user');



var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images/post');
    },
    filename: function (req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|JPEG)$/)) {
            var err = new Error();
            err.code = 'filetype';
            return callback(err);
        } else {
            callback(null, Date.now() + file.originalname);
        }

    }
});
var upload = multer({ storage: storage, limits: { fileSize: 1000000 } }).single('imageUrl');
router.post('/posts', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.send({ success: false, msg: 'limit file size 1MB ' })
            } else if (err.code === 'filetype') {
                return res.send({ success: false, msg: 'Must be valid file extension only jpg or png' })
            } else {
                return res.send({ success: false, msg: 'something went wrong' })
            }
        } else {
            if (!req.file) {
                return res.send({ success: false, msg: 'No file selected' })
            }
            var post = new Post({
                heading: req.body.heading,
                body: req.body.body,
                imageUrl: req.file.filename,
            });
            post.save().then((result) => {
                res.send({ post: result, sucess: true, msg: 'Post created' });
            }).catch((err) => {
                res.send({ sucess: false, msg: 'post not created', error: err })
            });
        }
    });

});
router.get('/posts', (req, res) => {

    Post.find().then((result) => {
        res.send({ posts: result, sucess: true });
    }).catch((err) => {
        res.send({ sucess: false, error: err });
    });
});

router.get('/posts/:id', (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request Invalid Id' });
    }
    Post.findOne({ _id: id }).then((result) => {
        if (!result) {
            res.status(404).send({ sucess: false, msg: 'Post not found' });
        } else {
            res.send({ post: result, sucess: true });
        }
    }).catch((err) => {
        res.send({ sucess: false, error: err });
    });
});
router.delete('/posts/:id', (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request invalid Id' });
    };
    Post.findOneAndRemove({ _id: id }).then((result) => {
        if (!result) {
            res.status(404).send({ success: false, msg: 'Post not found' });
        }
        else {
            res.send({ success: true, post: result });
        }
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'Bad Request', error: err });
    });
});

router.patch('/posts/:id', (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request Invalid Id' })
    }
    Post.findOneAndUpdate({ _id: id }, {
        $set: {
            'heading': req.body.heading,
            'body': req.body.body
        }
    }, { new: true }).then((result) => {
        res.send({ post: result, success: true, msg: 'update sucessfully' });
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'Bad Request', error: err });
    });
});

router.get('/search', (req, res) => {
    var matchelement = req.query.keyword;
    Post.find({ $text: { $search: matchelement } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).then((result) => {
        res.send({ result })
    }).catch((err) => {
        res.send({ err });
    });
});

module.exports = router;

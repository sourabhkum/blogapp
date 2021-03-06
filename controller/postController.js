const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const joi = require('joi');
const moment = require('moment');
const router = express.Router();

const { Post } = require('../models/post');
const { mongoose } = require('../db/connection');
const { User } = require('../models/user');
const { authenticate } = require('../middleware/authenticate');

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
router.post('/posts', authenticate, (req, res) => {
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
                creator: req.user.id,
            });
            post.save().then((result) => {
                res.send({ post: result, sucess: true, msg: 'Post created' });
            }).catch((err) => {
                res.send({ sucess: false, msg: 'post not created', error: err })
            });
        }
    });

});
router.get('/posts', authenticate, (req, res) => {

    Post.find({ creator: req.user.id }).sort('-dateCreated').populate('creator').populate( 'comments.commentuser',('firstName lastName') ).then((result) => {
        res.send({ posts: result, sucess: true });
        }).catch((err) => {
            res.send({ sucess: false, error: err });
        });
});

router.get('/posts/:id', authenticate, (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request Invalid Id' });
    }
    Post.findOne({ _id: id, creator: req.user.id }).populate('creator').populate('comments.commentuser',('fistName lastName')).then((result) => {
        if (!result) {
            res.status(404).send({ sucess: false, msg: 'Post not found' });
        } else {
            res.send({ post: result, sucess: true });
        }
    }).catch((err) => {
        res.send({ sucess: false, error: err });
    });
});
router.post('/comment/:id',authenticate,(req,res)=>{
    Post.findOne({_id:req.params.id}).populate('creator').populate('comments.commentuser',('firstName lastName')).then((post)=>{
        const newComment={
            commentBody:req.body.commentBody,
            commentuser:req.user.id
        }
        post.comments.unshift(newComment);
        post.save().then((result)=>{
            if(result){
                Post.findOne({_id:req.params.id}).populate('creator').populate('comments.commentuser',('firstName lastName')).then((post)=>{
                    res.send({post:post,success:true,msg:'Comment Posted'})
                }).catch((err)=>{
                    res.send({success:false,error:err})
                });
            }  
        })
    });
        
    });
router.delete('/posts/:id', authenticate, (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request invalid Id' });
    };
    Post.findOneAndRemove({ _id: id, creator: req.user.id }).then((result) => {
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

router.patch('/posts/:id', authenticate, (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request Invalid Id' })
    }
    Post.findOneAndUpdate({ _id: id, creator: req.user.id }, {
        $set: {
            'heading': req.body.heading,
            'body': req.body.body,
            'dateModified':Date.now()
        }
    }, { new: true }).then((result) => {
        res.send({ post: result, success: true, msg: 'update sucessfully' });
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'Bad Request', error: err });
    });
});

router.get('/search', (req, res) => {
    var matchelement = req.query.keyword;
    Post.find({ $text: { $search: matchelement } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).populate('creator').populate('comments.creator').then((result) => {
        res.send({ result })
    }).catch((err) => {
        res.send({ err });
    });
});
function validationPostData(req, res, next) {
    let PostSchema = joi.object().keys({
        heading: joi.string().min(10).max(40).required(),
        body: joi.string().min(200).max(500).required(),
        imageUrl: joi.string().required()
    });
    joi.validate(req.body, PostSchema, function (err, value) {
        if (err) {

            return res.status(400).send({ success: false, msg: 'Bad Request', error: err })
        }
        next();
    });
}

module.exports = router;

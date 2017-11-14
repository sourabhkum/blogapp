const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const { Post } = require('../models/post');
const { authenticate } = require('../middleware/authenticate');
const { mongoose } = require('../db/connection');
const { User } = require('../models/user');


router.use((req, res, next) => {
    var now = new Date().toDateString();
    var log = `${now}:${req.method}${req.url}`;
    console.log(log);
    fs.appendFile('server.log', log + '\n', (err) => {
        if (err) {
            console.log('unable to write');
        }
    });
    next();
});

router.post('/users', (req, res) => {

    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobile: req.body.mobile,
        email: req.body.email,
        password: req.body.password
    });
    user.save().then((result) => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send({ user, success: true, msg: 'user Created' })
    }).catch((e) => {
        res.status(400).send({ success: false, msg: 'Something went wrong', error: e })
    })
});
router.post('/users/login', (req, res) => {

    User.findByCredentials(req.body.email, req.body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send({ user, msg: 'login Sucessfully', success: true })
        });
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'Invalid credentails', error: err })
    });
});

router.get('/profile', authenticate, (req, res) => {
    User.findOne({
        _id: req.user._id
    }).then((user) => {
        res.send({ user: user, success: true });
    }).catch((err) => {
        res.status(400).send({ msg: 'Something went wrong', error: err });
    });

});

router.delete('/user/logout', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send({ msg: 'logout Sucessfully', success: true });
    }).catch((err) => {
        res.status(400).send({ msg: 'something went wrong', success: false, error: err });
    });
});

router.delete('/users/:id', (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request' });
    }
    User.findOneAndRemove({ _id: id }).then((user) => {
        if (!user) {
            res.status(404).send({ success: false, msg: 'user not found' });
        } else {
            res.send({ success: true, user: user, msg: 'delete sucessfully' });
        }
    }).catch((err) => {
        res.send({ success: false })
    });
});
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images/users');
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
var upload = multer({ storage: storage, limits: { fileSize: 1000000 } }).single('userUrl');
router.patch('/updateProfile', authenticate, (req, res) => {
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
            User.findOneAndUpdate({ _id: req.user.id }, {
                $set: {
                    'firstName': req.body.firstName,
                    'lastName': req.body.lastName,
                    'email': req.body.email,
                    'mobile': req.body.mobile,
                    'userUrl':req.file.filename
                }
            }, { new: true }).then((user) => {
                res.send({ user: user, msg: 'update sucessfully', success: true })
            }).catch((err) => {
                res.send({ success: false, error: err });
            });
        }

    });
});
module.exports = router;
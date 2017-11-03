const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const { Post } = require('../models/post');
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
        res.send({ success: true, msg: 'user save sucessfully', user: result });
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'something went wrong', error: err });
    });
});
router.post('/users/login', (req, res) => {

    User.findByCredentials(req.body.email, req.body.password).then((user) => {
        res.send({ success: true, msg: 'login sucessfully', user: user })
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'invalid credentail', error: err });
    });

});

router.get('/users/:id', (req, res) => {
    var id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request Invalid Id' })
    }
    User.findOne({ _id: id }).then((user) => {
        if (!user) {
            res.status(404).send({ success: false, msg: 'user not found' })
        }
        res.send({ success: false, user: user })
    }).catch((err) => {
        res.status(400).send({ success: false, msg: 'something went wrong' });
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

router.patch('/users/:id', (req, res) => {
    var id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({ success: false, msg: 'Bad Request' });
    }
    User.findByIdAndUpdate({ _id: id }, {
        $set: {
            'firstName': req.body.firstName,
            'lastName': req.body.lastName,
            'email': req.body.email,
            'mobile': req.body.mobile
        }
    }, { new: true }).then((user) => {
        res.send({ user: user, msg: 'update sucessfully', success: true })
    }).catch(() => {
        res.send({ success: false, error: err });
    });
});
module.exports = router;
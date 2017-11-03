const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const port = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.json());

//exports controllers
app.use(require('./controller/userController'));
app.use(require('./controller/postController'));

app.use(function(req, res) {
    return res.status(404).send({ success: false, msg: 'API not found' })
  });

app.listen(port, () => {
    console.log(`server up on ${port}`);
});


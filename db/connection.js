const mongoose = require('mongoose');
mongoose.Promise=global.Promise;

mongoose.connect('mongodb://localhost/blog',{ useMongoClient: true });
module.exports={mongoose}

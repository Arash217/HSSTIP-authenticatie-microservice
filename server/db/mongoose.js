const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/db`);

module.exports = {
  mongoose
};


var mongoose = require('mongoose');
var mongodb = require('mongodb');
mongoose.Promise=global.Promise;
mongoose.set('strictQuery', false);

// DB key
const db = 'mongodb://localhost:27017/mizuban'
// // Connect to MongoDB
// mongoose.connect(db, { useNewUrlParser: true });
const uri = "mongodb+srv://bes2ho:H990TZLQovG8nhkr@wachi.qoglm.mongodb.net/mizuban?retryWrites=true&w=majority"
console.log(`process.env.PORT=${process.env.PORT}`);
// HerokuやAzureのようなクラウドホストでは、PORT変数を使用して、ルーティングが正しく動作するためにサーバがどのポートをリッスンすべきかを教えてくれます。
target = (process.env.PORT)? uri :db;
console.log(target)
mongoose.connect(
  target,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);
// Error control
var connection = mongoose.connection;
connection.on('connected', function() {
  console.log('-----------------');
  console.log('MongoDB connected');
  console.log('-----------------');
});

connection.on('disconnected', function() {
  console.log('-----------------');
  console.log('Disconnected from MongoDB');
  console.log('-----------------');
});

connection.on('error', function(error) {
    console.log('db connection error', error);
});

process.on('SIGINT', function() {
    connection.close(function() {
      console.log('-----------------');
      console.log('MongoDB connection closed due to process termination');
      console.log('-----------------');
      process.exit(0);
    });
});

module.exports = connection;

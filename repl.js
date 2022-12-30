const mongoose=require("mongoose");
const TamboModel=require("./models/tambodata.js");
const mongodb = require('mongodb');

// DB key
const db = 'mongodb://localhost:27017/myDB'
// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true });
mongoose.Promise=global.Promise;
TamboModel.find({})
  .then(r=>{
    console.log(r);
  });
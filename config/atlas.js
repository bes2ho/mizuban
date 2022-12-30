const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://bes2ho:H990TZLQovG8nhkr@wachi.qoglm.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("mizuban").collection("tambo");
  collection.find()
    .toArray((error, data)=> {
      if (error) throw error;
      console.log(data);
    })
  // client.close();
});
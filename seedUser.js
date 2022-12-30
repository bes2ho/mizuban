const mongoose=require("mongoose"),
      UserData=require("./models/userdata.js");
const { Schema } = mongoose;
mongoose.Promise = global.Promise;
mongoose.connect(
  "mongodb://localhost:27017/mizuban",
  {useNewUrlParser:true}
);
// mongoose.connect(
//   "mongodb://localhost:27017/mizuban",
//   {useNewUrlParser:true}
// );
// mongoose.connection;


// const uri = "mongodb+srv://bes2ho:H990TZLQovG8nhkr@wachi.qoglm.mongodb.net/mizuban?retryWrites=true&w=majority"
// mongoose.connect(
//   uri,
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }
// );



let users=[
  {name:"選択してね",turn:0},
  {name:"梅原主次",turn:1},
  {name:"梅原三好",turn:2},
  {name:"片山勝利",turn:3},
  {name:"正田周吉",turn:4},
  {name:"梅原久代",turn:5},
  {name:"梅原義幸",turn:6},
  {name:"谷本貴明",turn:7},
  {name:"正田久仁雄",turn:8},
  {name:"片山光次",turn:9},
  {name:"尾池允嘉",turn:10},
  {name:"尾池吉嗣",turn:11},
  {name:"尾池俊明",turn:12},
  {name:"梅原眞",turn:13},
  {name:"片山里史",turn:14},
  {name:"片山博至",turn:15},
  {name:"尾池テル",turn:16},
  {name:"白樫貢",turn:17},
  {name:"片山弘明",turn:18},
  {name:"谷本徹",turn:19},
  {name:"別所秀一",turn:20},
  {name:"築山茂治",turn:21},
  {name:"隅山昌明",turn:22},
  {name:"松村千絵",turn:23},
]
UserData.deleteMany()
  .exec()
  .then(()=>{
    console.log("empty");
  });
let commands=[];
users.forEach((c)=>{
  commands.push(UserData.create({
    name:c.name,
    turn:c.turn
  }));
});
Promise.all(commands)
  .then(r=> {
    console.log(JSON.stringify(r));
  })
  .then(()=>{
    UserData.find({}).sort({'turn': 1}).exec()
    .then(data=>{
      data.forEach(user=>console.log(`{_id:"${user._id}", name:"${user.name}", turn:${user.turn}},`));
      mongoose.connection.close();
    });
  })
  .catch(error=>{
    console.log('errror: ${error}');
  });


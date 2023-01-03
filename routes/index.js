const express = require('express');
const router = express.Router();
const TamboModel = require('../models/tambodata.js');
const pug = require('pug');
const tz = require("date-fns-tz");
// import { formatInTimeZone } from 'date-fns-tz'

router.get('/tambolayers', function (req, res) {
  console.log('/tambolayers');
  TamboModel.TamboData.find({}).exec()
  .then(data=>res.json(data))
  .catch(err=>res.send(err));
});

router.get('/suiro', function (req, res) {
  console.log('/suiro');
  TamboData.getSuiroData(function (err, data) {
    if(err){
      res.send(err);
    }
    res.json(data); // 入力:JSON, javascriptオブジェクトを返す
  });
});

function Log(date, time, name, total){  // 一日分のデータ
  this.date=date,
  this.time=time,
  this.name=name,
  this.total=total,  // その日の合計
  this.record=[] // ゾーンごとの配水数
};
function Record(zone, count){ // ゾーンごとの配水数
  this.zone=zone,
  this.count=count
};

const tools={
  writeLog:(req,res,next)=>{
    const myId=req.cookies.myId;
    const recordItem = new TamboModel.LogData({
      farmer:myId,
      record:[]
    });
    TamboModel.TamboData.aggregate( [
      {$match: {$or:[{'properties.color':'yellow'},{'properties.color':'dodgerblue'}]}},
      {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
      {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
    ])
    .then(r=>{
      r.forEach(e=>{
        // console.log(`e ${e}`);
        recordItem.record.push(e);
      });
      recordItem.save();
    })
    .then(()=>next())
    .catch(err=>{
      console.log(err.message);
      next(err);
    });
  },
  blue_to_green_all:(req,res)=>{
    TamboModel.TamboData.find({'properties.color':'dodgerblue'})
    .exec()
    .then(features=>{
      // promise.allの中で更新・保存一緒にするとダメみたい
      features.map(feature=>{feature.properties.color='green'});
      Promise.all(features.map(feature=>feature.save()))  
      .then((r)=>{
        res.send('success');
      });
    });  
  },
  report:(req,res,next)=>{  // モーダル・バージョン
    let myId=req.cookies.myId;
    let mizuban=req.cookies.mizuban;
    const html='<main class="modal__content" id="modal-1-content"><span>先に名前を選択してください</span></main><footer class="modal__footer"><button class="modal__btn" data-micromodal-close aria-label="Close this dialog window"> 閉じる</button></footer>'
    if (typeof myId === 'undefined'){
      res.set('Content-Type', 'text/html');
      res.send(html);
    };
    // } else {
    console.log(`/report2 myId=${myId}, mizuban=${mizuban}`);
    TamboModel.getZone_Color(myId, mizuban, function (err, data) {
      if(err) next(err);
      // console.log(data);
      data.forEach(zone=>{  // データ置換作業
        zone.color_group.forEach(color_group=>{
          if (color_group.color=='dodgerblue') {color_group.color='配水済み'};
          if (color_group.color=='yellow') {color_group.color='黄色'};
          if (color_group.color=='green') {color_group.color='緑色'};
          if (color_group.color=='brown') {color_group.color='転作'};
        });
      });
      res.locals.data=data;
      res.locals.mizuban=mizuban;
      res.locals.pug='./views/_report.pug';
      next();  
    });
  },
  history:(req,res,next)=>{ // 履歴ボタンから呼ばれる
    TamboModel.LogData.find({}).populate('farmer').exec()
    .then(data=>{
      let newData=[];
      let newLog, newRecord, zone, count;
      data.forEach(log=>{ //データ変換
        // Herokuでは、以下のようにJSTが使えた。
        // newLog = new Log(log.created.toLocaleDateString("ja-JP", {timeZone:"JST"}),log.created.toLocaleTimeString("ja-JP", {timeZone:"JST"}),log.farmer.name);
        newLog = new Log(tz.formatInTimeZone(log.created, 'Asia/Tokyo', 'yyyy-MM-dd'),tz.formatInTimeZone(log.created, 'Asia/Tokyo', 'HH:mm'),log.farmer.name);
        // renderではJSTが使えなかったので、上記のようにdate-fns-tzをインポートして利用
        count=0;
        log.record.forEach(record=>{
          zone=record._id;
          record.color_group.forEach(color_group=>{
            if (color_group.color=='dodgerblue'){ //配水したころだけ登録
              newRecord = new Record(zone, color_group.count);
              newLog.record.push(newRecord);
              count += color_group.count;
            };
          });
        });
        if (count != 0){  // 配水0のときは登録しない
          newLog.total=count;
          newData.push(newLog);
        };
      });
      res.locals.data=newData;
      res.locals.pug='./views/_history.pug'
      next();
    })
    .catch(err=>next(err))
  },
  ta:(req,res,next)=>{
    let id = req.params.ta;
    console.log(`tas ta ${id}`);
    TamboModel.TamboData.findOne({_id:`${id}`}).exec()
    .then(data=>{
      res.locals.data=data;
      res.locals.pug='./views/_ta.pug'
      next();
    })
    .catch(err=>res.send(err));
  },
  sendHtml:(req,res)=>{
    const mizuban=req.cookies.mizuban;
    const fn = pug.compileFile(res.locals.pug);
    let html = fn({data:res.locals.data, mizuban:mizuban});
    res.set('Content-Type', 'text/html');
    res.send(html);
  },
  changeColor:(req,res,next)=>{
    const id = req.params.id;
    const newColor = req.params.color;
    console.log(id, newColor);
    TamboModel.TamboData.findByIdAndUpdate(id, { 'properties.color': newColor }, {new:true})
    .then(r=>next())
    .catch(err=>next(err));
  },
  getColorCount:(req,res)=>{
    commands=[
      TamboModel.TamboData.find({'properties.color':'yellow'}).count(),
      TamboModel.TamboData.find({'properties.color':'dodgerblue'}).count()
    ];
    Promise.all(commands)
    .then(count=>{
      console.log(`promiseAll=${count}`);
      res.send({yellow:count[0],blue:count[1]})
    })
    .catch(err=>res.send(err));
  },
};

router.get('/:id/:color', tools.changeColor, tools.getColorCount);
router.get('/history', tools.history, tools.sendHtml);
router.get('/report2', tools.report, tools.sendHtml);
router.get('/tas/:ta', tools.ta, tools.sendHtml);
router.get('/finish', tools.writeLog, tools.blue_to_green_all);
router.get('/tas', (req,res)=>{
  let myId=req.cookies.myId;
  let mizuban=req.cookies.mizuban;
  console.log(`tas myId= ${myId}`);
  TamboModel.TamboData.find({})
  .populate({
    path: 'properties.farmer',
    model: 'UserModel'
  })
  .sort({'properties.zone': -1})
  .exec()
  .then(data=>res.render('tas',{tambos: data, myId:myId, mizuban:mizuban, currentURL: req.url}))
  .catch(err=>res.send(err));
});
router.put('/tamboUpdate', (req,res)=>{
  const ta_id=req.body.ta_id;
  console.log(`router tamboUpdate ${ta_id}`);
  const ta_suito=req.body.ta_suito;
  const color = (ta_suito =='on')? 'green':'brown';
  const tamboParams={
    properties:{
      fid:req.body.ta_fid,
      zone:req.body.ta_zone,
      address:req.body.ta_address,
      area:req.body.ta_area,
      farmer:req.body.ta_farmer,
      color:color
    }
  };
  TamboModel.TamboData.findByIdAndUpdate(ta_id, {$set:tamboParams}, {new:true})
  .then(data=>{
    console.log(`router updateTambo ${data}`);
    res.send((JSON.stringify(data)));
  })
  .catch(err=>res.send(err));
});
router.get('/',(req, res)=>{
  let myId=req.cookies.myId;
  let mizuban=req.cookies.mizuban;
  // let yellow=res.locals.yellow;
  // let blue=res.locals.blue;
  res.render('index', {myId:myId, mizuban: mizuban, currentURL: req.url, title: 'mizuban'});
  // res.render('index', {myId:myId, mizuban: mizuban, title: 'mizuban', yellow: res.locals.yellow, blue: res.locals.blue });
});
// ヘッダーの水番・ユーザー選択submitをキャンセルしてFetchから呼ばれる
router.post('/refresh', (req,res)=>{
  const mizuban = req.body.mizuban;
  const myId = req.body.myId;
  console.log(`refresh myId= ${myId}, mizuban= ${mizuban}`);
  res.cookie('myId', myId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  if (mizuban == 'on'){
    console.log("mizuban");
    res.cookie('mizuban', mizuban, { maxAge: 20 * 60 * 60 * 1000, httpOnly: false });
    // res.render('mizuban',{'myId':myId, mizuban: mizuban});
  } else {
    console.log("not mizuban")
    res.clearCookie("mizuban");
    // res.render('map',{'myId':myId, mizuban: mizuban});
  };
  res.send('OK');
  // TamboData.getTamboData((function (err, data) {
  //   if(err){
  //     res.send(err);
  //   }
  //   res.json(data);
  // }),{});  // {}はcriteria
});
// router.get('/history', function(req, res){
//   TamboModel.LogData.find({}).populate('farmer').exec()
//   .then(data=>{
//     let newData=[];
//     let newLog, newRecord, zone, count;
//     function Log(date, time, name, total){  // 一日分のデータ
//       this.date=date,
//       this.time=time,
//       this.name=name,
//       this.total=total,  // その日の合計
//       this.record=[] // ゾーンごとの配水数
//     };
//     function Record(zone, count){ // ゾーンごとの配水数
//       this.zone=zone,
//       this.count=count
//     };
//     data.forEach(log=>{ //データ変換
//       newLog = new Log(log.created.toLocaleDateString("ja-JP", {timeZone:"JST"}),log.created.toLocaleTimeString("ja-JP", {timeZone:"JST"}),log.farmer.name);
//       count=0;
//       log.record.forEach(record=>{
//         zone=record._id;
//         record.color_group.forEach(color_group=>{
//           if (color_group.color=='dodgerblue'){ //配水したところだけ登録
//             newRecord = new Record(zone, color_group.count);
//             newLog.record.push(newRecord);
//             count += color_group.count;
//           };
//         });
//       });
//       if (count != 0){  // 配水0のときは登録しない
//         newLog.total=count;
//         newData.push(newLog);
//       };
//     });
//     const fn = pug.compileFile('./views/_history.pug');
//     let html = fn({data:newData});
//     res.set('Content-Type', 'text/html');
//     res.send(html);
//   })
//   .catch(err=>console.log(err));
// });

    // logs.forEach(log=>{
    //   console.log(log.farmer.name);
    //   log.record.forEach(record=>{
    //     console.log(record._id);
    //     record.color_group.forEach(color_group=>{
    //       console.log(color_group.color, color_group.count);
    //     });
    //   });
    // });
// router.get('/history', function(req, res){
//   TamboData.getHistory(function(err,data){
//     if(err) {
//       res.send(err);
//     } else {
//       let newData=[];
//       let newLog, newRecord, zone, count;
//       function Log(date, time, name, total){
//         this.date=date,
//         this.time=time,
//         this.name=name,
//         this.total=total,  // その日の合計
//         this.record=[] // ゾーンごとの配水数
//       };
//       function Record(zone, count){
//         this.zone=zone,
//         this.count=count
//       };
//       data.forEach(log=>{ //データ変換
//         newLog = new Log(log.created.toLocaleDateString("ja-JP", {timeZone:"JST"}),log.created.toLocaleTimeString("ja-JP", {timeZone:"JST"}),log.farmer.name);
//         count=0;
//         log.record.forEach(record=>{
//           zone=record._id;
//           record.color_group.forEach(color_group=>{
//             if (color_group.color=='dodgerblue'){ //配水したところだけ登録
//               newRecord = new Record(zone, color_group.count);
//               newLog.record.push(newRecord);
//               count += color_group.count;
//             };
//           });
//         });
//         if (count != 0){  // 配水0のときは登録しない
//           newLog.total=count;
//           newData.push(newLog);
//         };
//       });
//       const fn = pug.compileFile('./views/_history.pug');
//       let html = fn({data:newData});
//       res.set('Content-Type', 'text/html');
//       res.send(html);
//     };
//     // logs.forEach(log=>{
//     //   console.log(log.farmer.name);
//     //   log.record.forEach(record=>{
//     //     console.log(record._id);
//     //     record.color_group.forEach(color_group=>{
//     //       console.log(color_group.color, color_group.count);
//     //     });
//     //   });
//     // });
//   });
// });

// 田んぼ一覧画面から個別の田んぼ情報に遷移しupdate可能にする
// router.get('/tas/:ta', (req,res)=>{
//   let id = req.params.ta;
//   console.log(`tas ta ${id}`);
//     TamboData.getTamboData((function(err, data){
//       if (err) return handleError(err);
//       res.render('ta',{tambo: data[0]});  // find()なので結果は配列
//     }),{_id:`${id}`});
// });
// 田んぼ一覧画面から個別の田んぼ情報をモーダル表示update可能にする
// DOMバージョンができたので未使用
// router.get('/tas/:ta', (req,res)=>{
//   let id = req.params.ta;
//   console.log(`tas ta ${id}`);
//   TamboModel.TamboData.findOne({_id:`${id}`}).exec()
//   .then(data=>{
//     const fn = pug.compileFile('./views/_ta.pug');
//     let html = fn({data: data});
//     res.set('Content-Type', 'text/html');
//     res.send(html);
//   })
//   .catch(err=>res.send(err));
// });

// buckup
// router.get('/tas/:ta', (req,res)=>{
//   let id = req.params.ta;
//   console.log(`tas ta ${id}`);
//     TamboData.getTamboData((function(err, data){
//       if (err) return handleError(err);
//       const fn = pug.compileFile('./views/_ta.pug');
//       let html = fn({tambo: data[0]});  // find()なので結果は配列
//       res.set('Content-Type', 'text/html');
//       res.send(html);
//     }),{_id:`${id}`});
// });

// buckup
// router.get('/tas', (req,res)=>{
//   let myId=req.cookies.myId;
//   console.log(`tas myId= ${myId}`);
//   TamboData.getTambos(function(err, data){
//       if (err) return handleError(err);
//       // data.forEach(item=>console.log(item.properties));
//       res.render('tas',{tambos: data, myId:myId, currentURL: req.url});
//     });
// });


// router.get('/finish', function (req, res) {
//   let myId=req.cookies.myId;
//   console.log(`/finish ${myId}`);
//   TamboData.writeLog(myId, function (err, message) {
//     if(err){
//       res.send(err);
//     }
//     // res.locals.yellow=0;
//     // res.locals.blue=0;
//     res.send(message);
//   });
// });

  // UserModel.findById(myId).then(user=>res.json(user));
    // console.log(user);
    // console.log(userItem);
    // res.json(userItem);
    // const recordItem = new LogData({
    //   farmer:"62cb692f1bbe0d64de1fdeab",
    //   record:[]
    // });
    // recordItem.save().then(data=>console.log(data));

  // TamboData.getLog(function (err, data) {
  //   if(err){
  //     res.send(err);
  //   };
  //   let logItem, userItem;
  //   console.log(`/finish ${myId}`);
  //   UserModel.findById(myId).then(user=>userItem=user);
  //   console.log(userItem);
  //   TamboData.LogData.create({
  //     farmer:userItem
  //     // record:[]
  //   }).then(data=>logItem=data);
  //   // data.forEach(record=>{
  //   //   logItem.record.push(record);
  //   // });
  //   // logItem.save();
  // })
// });

// router.get('/:id', function (req, res) {
//   let id = req.params.id;
//   TamboData.changeColor(id, function (err, OK) {
//     if(err){
//       res.send(err);
//     };
//     // if (OK=='OK'){
//     TamboData.getColorGroup(function (err, data) {
//       if(err){
//         res.send(err);
//       };
//       res.json(data);
//     });
//     // };
//   });
// });
// // 色の更新処理 buckup
// router.get('/:id', function (req, res) {
//   let id = req.params.id;
//   let target;
//   console.log(`更新：${id}`);
//   TamboData.findById(id).exec()
//   .then(feature=>{
//     target=feature;
//     let newColor = (target.properties.color == "green")? "yellow": "dodgerblue";
//     target.properties.color=newColor;
//   })
//   .then(()=>target.save())
//   // .then(result=>console.log(result))
//   // .catch(error=>console.log(error.message));
//   .then(()=>{
//     getColorGroup()
//     .then(data=>res.json(data))
//     .catch(err=>console.log(err));
//   });
// });



function getColorGroup(){
  return new Promise((resolve, reject)=>{
    TamboData.getColorGroup(function (err, data) {
      if(err){
        reject(err);
      };
      resolve(data);
    });
  });
};
// const bodyParser = require('body-parser');
// const urlencodedParser = bodyParser.urlencoded({ extended: false });







// // 前処理ミドルウェア TamboData読み込み時に黄色、青色数えるので不要になった。
// router.use(function (req, res, next){
//   console.log("middle");
//   getColorGroup() // promise version
//   .then(data=>{ // res.localsのセットと next()を同じthenに入れたらできた。
//     // let yellow, blue;
//     console.log(`re.locals ${data}`);
//     // [yellow, blue]=data;
//     res.locals.yellow=data.yellow;
//     res.locals.blue=data.blue;
//     next();
//   })
//   .catch(err=>console.log(err));
// });


// router.get('/', function(req, res, next) {
//   res.render('signin', { title: 'Express' });
// });
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// ヘッダーの水番・ユーザー選択submitから呼ばれる。今は未使用
// router.post('/', (req,res)=>{
//   let myId = req.body.farmer1;
//   let mizuban = req.body.mizuban;
//   // let yellow=res.locals.yellow;
//   // let blue=res.locals.blue;
//   console.log(`render post yellow=${res.locals.yellow}, blue=${res.locals.blue}`);
//   console.log(`signIn myId= ${myId}, mizuban= ${mizuban}`);
//   res.cookie('myId', myId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
//   if (mizuban == 'on'){
//     console.log("mizuban");
//     res.cookie('mizuban', mizuban, { maxAge: 20 * 60 * 60 * 1000, httpOnly: false });
//     // res.render('mizuban',{'myId':myId, mizuban: mizuban});
//   } else {
//     console.log("not mizuban")
//     res.clearCookie("mizuban");
//     mizuban='off'
//     // res.render('map',{'myId':myId, mizuban: mizuban});
//   };
//   res.render('index',{myId:myId, mizuban: mizuban});
//   // res.render('index',{myId:myId, mizuban: mizuban, yellow: res.locals.yellow, blue: res.locals.blue});
// });



// router.get('/:id', function (req, res) {
//   let id = req.params.id;
//   let target;
//   console.log(`更新：${id}`);
//   TamboData.findById(id).exec()
//   .then(feature=>{
//     target=feature;
//     let newColor = (target.properties.color == "green")? "yellow": "dodgerblue";
//     target.properties.color=newColor;
//   })
//   .then(()=>target.save())
//   .then(result=>console.log(result))
//   // .catch(error=>console.log(error.message));
//   .then(()=>TamboData.aggregate( [
//     {$group: { _id: '$properties.color', total: { $sum:'$properties.area'}, count: {$sum:1}}}
//     ] ))
//   .then(result=>res.json(result))
//   .catch(error=>console.log(error.message));
// });


// router.get('/:id', function (req, res) {
//   let myId=req.cookies.myId;
//   let id = req.params.id;
//   console.log(`/:id = ${id}, myId= ${myId}`);
//   if (id == 'tas'){
//     TamboData.find({})
//     .populate({
//       path: 'properties.farmer',
//       model: 'UserModel'
//     })
//     .exec(function(err, data){
//       if (err) return handleError(err);
//       // data.features.forEach(item=>console.log(item.properties.farmer.name));
//       res.render('tas',{tambos: data, myId:myId});
//     });
//   } else {
//     TamboData.findOne({"_id":id})
//     .then(result=>{
//     res.render('ta',{tambo: result, myId:myId});
//     })
//     .catch(error=>console.log(error.message));
//   };
// });
/* GET NS Stations json data. */
// router.get('/maplayers', function (req, res) {
//     StationData.getStationData(function (err, data) {
//       if(err){
//         res.send(err);
//       }
//       res.json(data);
//     });
// });

module.exports = router;

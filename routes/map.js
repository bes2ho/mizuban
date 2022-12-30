var express = require('express');
var router = express.Router();

TamboData = require('../models/tambodata.js');
/* GET home page. */
router.get('/', function(req, res, next) {
  let myId=req.cookies.myId;
  res.render('map', {'myId': myId});
});

/* GET tambo json data. */
router.post('/tambolayers', function (req, res) {
  console.log('/tambolayers:post');
  let myId=req.body.myId;
  let mizuban=req.body.mizuban;
  TamboData.getTamboData(myId, mizuban, function (err, data) {
    if(err){
      res.send(err);
    }
    res.json(data); // 入力:JSON, javascriptオブジェクトを返す
  });
});
router.get('/tambolayers', function (req, res) {
    console.log('/tambolayers');
    let myId=req.cookies.myId;
    let mizuban=req.cookies.mizuban;
    TamboData.getTamboData(myId, mizuban, function (err, data) {
      if(err){
        res.send(err);
      }
      res.json(data); // 入力:JSON, javascriptオブジェクトを返す
    });
});
router.get('/tambolayers2', function (req, res) {
  let myId=req.cookies.myId;
  TamboData.getTamboData2(myId, function (err, data) {
    if(err){
      res.send(err);
    }
    res.json(data); // 入力:JSON, javascriptオブジェクトを返す
  });
});
router.get('/tambolayers3', function (req, res) {
  console.log('/tambolayers3');
  TamboData.getTamboData3(function (err, data) {
    if(err){
      res.send(err);
    }
    res.json(data); // 入力:JSON, javascriptオブジェクトを返す
  });
});
router.put('/:id', function (req, res) {
  let id = req.params.id;
  TamboData.findById(id).exec()
  .then(feature=>{
    let newColor = (feature.properties.color == "green")? "yellow": "dodgerblue";
    feature.properties.color=newColor;
    feature.save();
  })
  .then(console.log('Success!'))
  .catch(error=>console.log(error.message));
});
// router.put('/:id', function (req, res) {
//   let id = req.params.id;
//   let tambos;
//   TamboData.findOne({})
//   .then(result=>{
//     tambos=result;
//     console.log(tambos.name);
//     let newColor = (tambos.features.id(id).properties.color == "green")? "yellow": "dodgerblue";
//     tambos.features.id(id).properties.color=newColor;
//     tambos.save((function (err) {
//       if (err) console.log(err.message);
//       console.log('Success!');
//     }));
//   })
//   .catch(error=>console.log(error.message));
// });

// router.get('/ta', (req,res)=>{
//   TamboData.findOne({})
//     .then(tambos=>{
//       res.render('ta',{tambos: tambos});
//     })
//     .catch(error =>{
//       console.log(`Error fetching users: ${error.message}`)
//       res.redirect("/");
//     })
// });
router.get('/tas', (req,res)=>{
  TamboData.find({})
    .populate({
      path: 'properties.farmer',
      model: 'UserModel'
    })
    .exec(function(err, data){
      if (err) return handleError(err);
      // data.features.forEach(item=>console.log(item.properties.farmer.name));
      res.render('tas',{tambos: data});
    });
});
router.get('/:id', function (req, res) {
  console.log("route ta");
  let id = req.params.id;
  TamboData.findOne({"_id":id})
  .then(result=>{
  res.render('ta',{tambo: result});
  })
  .catch(error=>console.log(error.message));
});
// geojson バージョン
// router.get('/:id', function (req, res) {
//   console.log("route ta");
//   let id = req.params.id;
//   let tambo;
//   TamboData.findOne({})
//   .then(result=>{
//     tambo=result.features.id(id)
//   res.render('ta',{tambo: tambo});
//   })
//   .catch(error=>console.log(error.message));
// });
// router.put('/:id', function (req, res) {
//   let id = req.params.id;
//   let tambos;
//   console.log("map.js");
//   TamboData.findOne({})
//   .then(result=>{
//     tambos=result;
//     console.log(tambos.name);
//     return tambos.features.id(id).properties.color='#2200ff';
//   })
//   .then(result=>{
//     console.log(tambos.features.id(id).properties.color)
//     tambos.save((function (err) {
//       if (err) console.log(err.message);
//       console.log('Success!');
//     }));
//   })
//   .catch(error=>console.log(error.message));
// });

// router.post('/update', function (req, res) {
//   TamboData.changeColor(function (err, data) {
//     if(err){
//       res.send(err);
//     }
//     res.json(data);
//   });
// });
module.exports = router;

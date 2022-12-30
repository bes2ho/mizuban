const express = require('express');
const router = express.Router();
UserModel = require('../models/userdata.js');

/* GET users listing. */
// router.get('/', UserModel.getAllUserModel, (req,res,next) =>{
//   console.log(req.data);
//   res.render('users',{users: req.data});
// });
router.get('/', (req,res)=>{
  let myId=req.cookies.myId;
  console.log(`users myId= ${myId}`)
  UserModel.find({})
    .then(users=>{
      let data = JSON.stringify(users);
      console.log(JSON.parse(data));
      res.render('users',{users: users, myId:myId});
    })
    .catch(error =>{
      console.log(`Error fetching users: ${error.message}`)
      res.redirect("/");
    })
});
// router.get('/', (req,res)=>{
//   UserModel.find({}).lean().exec()
//     .then(users => res.json(users))
//     .then(data => res.render('users',{users: data}));
// });

router.get('/menu', (req,res)=>{
  UserModel.find({})
    .then(users=>{
      console.log("menu");
      res.json(users);
    })
    .catch(error =>{
      console.log(`Error fetching users: ${error.message}`)
      res.send(error);
    })
});
router.get('/:id', (req,res)=>{
  let userId = req.params.id;
  UserModel.findById(userId)
    .then(user=>{
      res.render('user',{user: user});
    })
    .catch(error =>{
      console.log('Error fetching users: ${error.message}')
      res.redirect("/");
    })
});
module.exports = router;


// // StationData = require('../models/stationdata.js');
// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('map', { title: 'Express' });
// });

// /* GET NS Stations json data. */
// router.get('/tambolayers', function (req, res) {
//     TamboData.getTamboData(function (err, data) {
//     // StationData.getStationData(function (err, data) {
//       if(err){
//         res.send(err);
//       }
//       res.json(data);
//     });
// });
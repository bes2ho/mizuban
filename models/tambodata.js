const mongoose = require('mongoose');

const propertiesSchema = new mongoose.Schema({
  fid: Number,
  color: String,
  area: mongoose.Decimal128,
  address: String,
  suito: Boolean,
  zone:String,
  farmer: {type: mongoose.Schema.ObjectId, ref: "UserData"},
  owner: {type: mongoose.Schema.ObjectId, ref: "UserData"}
});
const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MultiPolygon','Polygon'],
    required: true
  },
  coordinates: {
    type: [[[[Number]]]], // Array of arrays of arrays of numbers
    required: true
  }
});
const featuresSchema = new mongoose.Schema({
  type: {
    type: String,
    enum:['Feature'],
    required: true
  },
  properties: propertiesSchema,
  geometry: polygonSchema
});
const logSchema = new mongoose.Schema({
  farmer: {type: mongoose.Schema.ObjectId, ref: "UserModel"},
  created: {type: Date, default: Date.now},
  record:[{_id:String,
            color_group:[{color:String,
                          count:Number}]}]
});

const TamboData = mongoose.model('TamboData', featuresSchema,'featuresmodels');
module.exports.TamboData=TamboData;
const LogData = mongoose.model('LogData', logSchema);
module.exports.LogData=LogData;

module.exports.getZone_Color = (myId, mizuban, callback)=>{
  if (typeof mizuban === 'undefined'){  // 個人の管理田のゾーン別集計
    console.log(`properties.farmer:${myId}`);
    TamboData.aggregate( [
      {$match: {'properties.farmer':new mongoose.Types.ObjectId(myId)}},
      {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
      {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
    ], callback);
  } else {
    TamboData.aggregate( [  // 水番結果のゾーン別集計
      {$match: {$or:[{'properties.color':'yellow'},{'properties.color':'dodgerblue'}]}},
      {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
      {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
    ], callback);
  };
};
module.exports.getSuiroData = function(callback){
  mongoose.connection.collection("suiro").findOne({}, callback);
};
// const returnColorGroup = function(){
//   TamboData.aggregate([
//     {$group: { _id: '$properties.color', total: { $sum:'$properties.area'}, count: {$sum:1}}}
//     ])
//     .then(data=>{
//       let yellowObj = data.find((e)=>{
//         return e._id =='yellow'; 
//       });
//       let blueObj = data.find((e)=>{
//         return e._id =='dodgerblue';
//       });
//       let yellow, blue;
//       yellow= yellowObj ? yellowObj.count: 0;
//       blue= blueObj ? blueObj.count: 0;
//       console.log(`model ${yellow} ${blue}`);
//       return {yellow:yellow, blue:blue};
//     });
// };
// const TamboData = module.exports = mongoose.model('TamboData', featuresSchema,'featuresmodels');

// Footerに表示するための、黄色、青色を数える。未使用になる予定
// module.exports.getColorGroup = (callback)=>{
//   TamboData.aggregate([
//     {$group: { _id: '$properties.color', total: { $sum:'$properties.area'}, count: {$sum:1}}}
//     ], (err, data)=>{
//       if (err) 
//         return callback(err);
//       let yellowObj = data.find((e)=>{
//         return e._id =='yellow'; 
//       });
//       let blueObj = data.find((e)=>{
//         return e._id =='dodgerblue';
//       });
//       let yellow, blue;
//       yellow= yellowObj ? yellowObj.count: 0;
//       blue= blueObj ? blueObj.count: 0;
//       console.log(`model ${yellow} ${blue}`);
//       callback(null, {yellow:yellow, blue:blue});
//     })
// };
// // 未使用
// module.exports.getColorGroup = (callback)=>{
//   console.log('called getColorGroup');
//   TamboData.aggregate([
//     {$group: { _id: '$properties.color', total: { $sum:'$properties.area'}, count: {$sum:1}}}
//     ], (err, data)=>{
//       if (err) 
//         return callback(err);
//       let yellowObj = data.find((e)=>{
//         return e._id =='yellow'; 
//       });
//       let blueObj = data.find((e)=>{
//         return e._id =='dodgerblue';
//       });
//       let yellow, blue;
//       yellow= yellowObj ? yellowObj.count: 0;
//       blue= blueObj ? blueObj.count: 0;
//       console.log(`model ${yellow} ${blue}`);
//       callback(null, {yellow:yellow, blue:blue});
//     })
// };
// buckup

// module.exports.getHistory = (callback)=>{
//   LogData.find({}).populate('farmer').
//   exec(callback);
// };

// module.exports.fn= {
//   writeLog:(req,res,next)=>{
//     const myId=req.cookies.myId;
//     console.log("called writelog");
//     const recordItem = new LogData({
//       farmer:myId,
//       record:[]
//     });
//     TamboData.aggregate( [
//       {$match: {$or:[{'properties.color':'yellow'},{'properties.color':'dodgerblue'}]}},
//       {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
//       {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
//     ])
//     .then(r=>{
//       r.forEach(e=>{
//         console.log(`e ${e}`);
//         recordItem.record.push(e);
//       })
//       recordItem.save();
//     })
//     .then(()=>next())
//     .catch(err=>{
//       console.log(err.message);
//       next(err);
//     })
//   },
//   blue_to_green_all:(req,res)=>{
//     TamboData.find({'properties.color':'dodgerblue'})
//     .exec()
//     .then(features=>{
//       // promise.allの中で更新・保存一緒にするとダメみたい
//       features.map(feature=>{feature.properties.color='green'});
//       Promise.all(features.map(feature=>feature.save()))  
//       .then((r)=>{
//         // console.log(`promiseAll return ${r}`);
//         res.send('success');
//       });
//     })  
//   }
// };

// saveを１回にしたバージョン
// module.exports.writeLog = (myId, callback)=>{
//   console.log("called writelog");
//   const recordItem = new LogData({
//     farmer:myId,
//     record:[]
//   });
//   TamboData.aggregate( [
//     {$match: {$or:[{'properties.color':'yellow'},{'properties.color':'dodgerblue'}]}},
//     {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
//     // [{ _id: { zone: 'ヤナバ', color: 'yellow' }, count: 2 },
//     //  { _id: { zone: 'ヤナバ', color: 'dodgerblue' }, count: 1 }]
//     {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
//     // [ { _id: 'ヤナバ', color_group: [ [Object], [Object] ] } ]
//   ])
//   .then(r=>{
//     r.forEach(e=>{
//       console.log(`e ${e}`);
//       recordItem.record.push(e);
//     })
//     recordItem.save().then(()=>blue_to_green_all(callback));
//   });
// };
// buckup
// module.exports.writeLog = (myId, callback)=>{
//   console.log("called writelog");
//   const recordItem = new LogData({
//     farmer:myId,
//     record:[]
//   });
//   recordItem.save()
//   .then(()=>{
//     console.log("save success");
//     TamboData.aggregate( [
//       {$match: {$or:[{'properties.color':'yellow'},{'properties.color':'dodgerblue'}]}},
//       {$group: { _id: {zone:'$properties.zone', color:'$properties.color'},count: {$sum:1}}},
//       {$group:{_id:'$_id.zone', color_group:{$push:{color:'$_id.color', count:'$count'}}}}
//     ])
//     .then(r=>{
//       r.forEach(e=>{
//         console.log(`e ${e}`);
//         recordItem.record.push(e);
//       })
//       recordItem.save().then(()=>blue_to_green_all(callback));
//       // recordItem.save().then(()=>blue_to_green()).then(()=>callback(null,"success"))
//     });
//   })
//   // TamboData.find({}, callback);
// };
// 上のwriteLogから呼ばれる
// let blue_to_green_all = function(callback){
//   TamboData.find({'properties.color':'dodgerblue'})
//   .exec()
//   .then(features=>{
//     // promise.allの中で更新・保存一緒にするとダメみたい
//     features.map(feature=>{feature.properties.color='green'});
//     Promise.all(features.map(feature=>feature.save()))  
//     .then((r)=>{
//       // console.log(`promiseAll return ${r}`);
//       callback(null,'success');
//     });
//   })
// };
// module.exports.getColorGroup = function(callback){
//   let data;
//   TamboData.aggregate( [
//     {$group: { _id: '$properties.color', total: { $sum:'$properties.area'}, count: {$sum:1}}}
//     ], callback);
// };

// callback=find結果をresposeに入れて返してくれ、という関数
// module.exports.getTamboData = function(callback, criteria){
//   console.log(`criteria=${criteria}`)
//   TamboData.find(criteria).exec(callback);
// };

// findByIdAndUpdate()に変更すべき？
// module.exports.changeColor = function(id, color, callback){
//   console.log('tambodata chengeColor', id);
//   TamboData.findByIdAndUpdate(id, { 'properties.color': color }, {new:true})
//   .then(r=>{
//     console.log(`save ${r}`);
//     callback(null);
//   });
// };

// module.exports.changeColor = function(id, callback){
//   let target;
//   console.log(id);
//   TamboData.findById(id).exec()
//   .then(feature=>{
//     target=feature;
//     // console.log(target);
//     let newColor = (target.properties.color == "green")? "yellow": "dodgerblue";
//     target.properties.color=newColor;
    
//   })
//   .then(()=>target.save())
//   .then(r=>{
//     // console.log(`save ${r}`);
//     callback(null);
//   });
// };

// module.exports.getTambos = function(callback){
//   TamboData.find({})
//   .populate({
//     path: 'properties.farmer',
//     model: 'UserModel'
//   })
//   .sort({'properties.zone': -1})
//   .exec(callback);
// }
// module.exports.updateTambo = function(id,params,callback){
//   // console.log(id, params);
//   TamboData.findByIdAndUpdate(id, {$set:params}, {new:true}, callback)
// };


// module.exports.updateTambo2 = function(id,params,callback){
//   console.log(id, params);
//   TamboData.findByIdAndUpdate(id, {$set:params})
//   .then(tambo=>{
//     console.log(`model tambo id=${tambo}`);
//     callback(null,tambo);
//   })
//   .catch(err=>callback(err));
// }
// geoJsonSchemaから探索する場合(未使用)
// module.exports.changeColor = function(id){
//   console.log(id);
//   let tambos;
//   TamboData.findOne({})
//   .then(result=>{
//     tambos=result;
//     tambos.features.id(id).properties.color='yellow';
//   })
//   .then(tambos.save().then(result=>console.log("saved")))
//   .catch(error=>console.log(error.message));
// };

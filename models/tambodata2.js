const mongoose = require('mongoose');
const TamboDataSchema = mongoose.Schema({
  name: String,
  location: {
    type: {
      type: String,
      enum:['MultiPolygon'],
      required: true
    },
    coordinates: {
      'type': [[[Number]]],
      'index': '2dsphere', // set the mongo index : 2d / 2dsphere
      'required': true
    }
  }
});
const TamboData = module.exports = mongoose.model('TamboData', TamboDataSchema,'tambo');
module.exports.getTamboData = function(callback, limit){
	TamboData.find(callback).limit(limit).sort([['name', 'ascending']]);
};

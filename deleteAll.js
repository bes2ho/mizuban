const mongoose=require("mongoose");
mongoose.connect(
  "mongodb://localhost:27017/mizuban",
  {useNewUrlParser:true}
);

const propertiesSchema = new mongoose.Schema({
  fid: Number,
  color: String
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
const geoJsonSchema = new mongoose.Schema({
  type: String,
  name: String,
  // crs: Object,
  // crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
  features: [featuresSchema]
});
const PolygonModel=mongoose.model("PolygonModel", polygonSchema);
const PropertiesModel=mongoose.model("PropertiesModel", propertiesSchema);
const FeaturesModel=mongoose.model("FeaturesModel", featuresSchema);
const GeoJsonModel=mongoose.model("GeoJsonModel", geoJsonSchema,'geojsonmodels');
GeoJsonModel.deleteMany()
.exec()
.then(()=>{
  console.log("empty");
});
FeaturesModel.deleteMany()
.exec()
.then(()=>{
  console.log("empty");
});
PolygonModel.deleteMany()
.exec()
.then(()=>{
  console.log("empty");
});
PropertiesModel.deleteMany()
.exec()
.then(()=>{
  console.log("empty");
});
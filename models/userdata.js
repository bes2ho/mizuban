const mongoose=require("mongoose");
      userSchema=mongoose.Schema({
        name:String,
        turn:Number
      });
const UserModel = module.exports=mongoose.model("UserModel", userSchema,"usermodels");
module.exports.getAllUserData = (req, res, next) => {
	UserModel.find({}, (error, users) => {
    if (error) next(error);
    req.data=users;
    next();
  });
};
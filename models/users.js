var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId
var usermodel = mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:false,
        // default:null
    },
    role_id:{
        type:ObjectId,
        required:true,
        ref:'user_roles'
    },
    is_active:{
        type:Number,
        required:false,
        default: 0
    }
});
usermodel.virtual("user_role", {
    ref: "user_roles",
    localField: "role_id",
    foreignField: "_id"
});
usermodel.set("toJSON", { virtuals: true })
module.exports = mongoose.model("users",usermodel)
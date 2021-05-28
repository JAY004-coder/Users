var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId
var userRolemodel = mongoose.Schema({
    role_name:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model("user_roles",userRolemodel)
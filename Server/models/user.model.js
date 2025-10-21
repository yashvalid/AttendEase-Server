const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    fullName : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        unique : true,
        lowercase : true,
    },
    password : {
        type : String,
        required : true,
        select : false,
    },
    socketId : {
        type : String
    }
});

userSchema.methods.generateToken = function(){
    const token = jwt.sign({_id : this._id},process.env.JWT_SECRET);
    console.log("Token generated");
    return token;
}

userSchema.methods.comparePass = async function (password) {
    return await bcrypt.compare(password, this.password);
}   

userSchema.statics.hashPass = async function(password){
    return await bcrypt.hash(password, 10);
}

const user = mongoose.model('user', userSchema);

module.exports = user;
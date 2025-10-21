const mongoose = require("mongoose");


const attendenceSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },
    stuName : {
        type : String,
        required : true,
    },
    subject : {
        type : String,
        required : true,
    },
    class : {
        type : String,
        required : true,
    }
});

const attendence = mongoose.model('attendence', attendenceSchema);

module.exports = attendence;


// Require Mongoose Dependencies
const mongoose = require("mongoose");

// Get Schema Constructor
const Schema = mongoose.Schema;

// Create the actual Schema(new user schema object)
const CommentSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    comments: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Creates the model for the database using mongoose model method
const Comment = mongoose.model("Comments", CommentSchema);

// Export Model 
module.exports = Comment
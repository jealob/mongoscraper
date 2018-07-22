// Require Mongoose Dependencies
const mongoose = require("mongoose");

// Get Schema Constructor
const Schema = mongoose.Schema;

// Create the actual Schema(new user schema object)
const CommentSchema = new Schema({
    _headlineId: {
        type: String,
    },
    commentText: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Creates the model for the database using mongoose model method
const Comment = mongoose.model("Comment", CommentSchema);

// Export Model 
module.exports = Comment
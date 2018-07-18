// Require Mongoose Dependencies
const mongoose = require("mongoose");

// Get Schema Constructor
const Schema = mongoose.Schema;

// Create the actual Schema(new user schema object)
const NewsSchema = new Schema({
    briefs: {
        type: String,
        required: true
    },
    // link to new article
    link: {
        type: String,
        required: true
    },
    saved: {
        type: Boolean,
        require: true,
        default: false
    }
});

// Creates the model for the database using mongoose model method
const News = mongoose.model("News", NewsSchema);

// Export Model
module.exports = News;
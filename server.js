// Require server dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

// Require Scraping tool dependencies
// require axios
const axios = require("axios");
const cheerio = require("cheerio");

// Require the models and controller
var database = require("./models");
// Server connection port
const PORT = process.env.PORT || 8080;

// Initialize Express server
const app = express();

// Middleware -- logger, body-parser
// Use morgan for logging requests
app.use(logger("dev"));
// For body-parser
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));
// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("hbs", exphbs({ defaultLayout: "main.hbs" }));

app.set("view engine", "hbs");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongoNaijaNews";

// Set mongoose to leverage built-in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// ----------------------------------------------------------------

// Renders home page
app.get("/", function (req, res) {
    res.render("index");
});

// Renders saved page
app.get("/saved", function (req, res) {
    res.render("saved");
});

// Request all news articles API endpoint 
app.get("/api/headlines", function (req, res) {
    database.News.find({ saved: req.query.saved })
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error)
        })
});

// Request to fetch and save news articles
app.get("/api/fetch", function (req, res) {
    axios.get("https://www.naija.ng/").then(response => {
        // Load Cheerio
        let $ = cheerio.load(response.data);
        let results = {};
        let num = 0;
        // Select each element in the HTML body to scrape data
        $("li.news-list__item").each(function (i, element) {
            results.headline = $(element).children("a").text();
            results.url = $(element).children("a").attr("href");
            // Check if scraped news article have been saved in database, if not insert it
            database.News.update({ headline: results.headline }, results, { upsert: true, new: true, setDefaultsOnInsert: true })
                .then((dbNews) => {
                    res.json(dbNews);
                }).catch(function (error) {
                    return res.json(error);
                });
        });
    });
});

// Route for grabbing a specific Article by id, and updating the save field to true
app.put("/api/headlines/:id", function (req, res) {
    database.News.update({ _id: req.params.id }, { saved: req.body.saved })
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })
});

// Route for grabbing a specific Article by id, populate it with it's comment(s)
app.get("/api/comments/:id", function (req, res) {
    database.News.findOne({ _id: req.params.id })
        .populate("comment")
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for saving/updating an news articles associated Comment
app.post("/api/comments", function (req, res) {
    // Create a new comment and pass the req.body to the entry
    database.Comment.create(req.body)
        .then(function (dbComment) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return database.News.findOneAndUpdate({ _id: req.body._headlineId }, { $push: { comment: dbComment._id } }, { new: true });
        })
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, and updatindg the save field to true
app.delete("/api/comments/:id", function (req, res) {
    database.Comment.remove({ _id: req.params.id })
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })
});

// Route for deleting all the articles from the database
app.get("/api/clear", function (req, res) {
    database.News.remove({})
        .then(function (dbNews) {

            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })

    database.Comment.remove({})
        .then(function (dbNews) {

            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })
});
// ------------------------------------------------------------
// Open the port for server to listen to requests
app.listen(PORT, "0.0.0.0", function () {
    // console.log("App running on port " + PORT);
});


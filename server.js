// Require server dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

// Require Scraping tool dependencies
// require axios
const request = require("request")
const axios = require("axios");
const cheerio = require("cheerio");

// Require the models
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

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/saved", function (req, res) {
    res.render("saved");
});

app.get("/api/headlines", function (req, res) {
    database.News.find({ saved: req.query.saved })
        .then(function (dbNews) {
            res.json(dbNews);
            // res.json(dbNews)
        })
        .catch(function (error) {
            res.json(error)
        })
});

app.get("/api/fetch", function (req, res) {
    let results = [];
    request("https://www.naija.ng/", function (error, response, html) {
        // Load Cheerio
        let $ = cheerio.load(html);

        // Select each element in the HTML body to scrape data
        $("li.news-list__item").each(function (i, element) {

            results.push({
                headline: $(element).children("a").text(),
                url: $(element).children("a").attr("href")
            });
        });

        results.map((news) => {
            database.News.create({
                "headline": news.headline,
                "url": news.url,
            },
                {
                    upsert: true, new: true, setDefaultsOnInsert: true
                }).then(function (dbNews) {
                }).catch(function (error) {
                    return res.json(error);
                });
        });
        res.json(results.length);
    });

});

// Route for grabbing a specific Article by id, and updatindg the save field to true
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
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    database.News.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("comment")
        .then(function (dbNews) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbNews);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/api/comments", function (req, res) {
    // Create a new note and pass the req.body to the entry
    database.Comment.create(req.body)
        .then(function (dbComment) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return database.News.findOneAndUpdate({ _id: req.body._headlineId }, { $push: { comment: dbComment._id } }, { new: true });
        })
        .then(function (dbNews) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbNews);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
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

// Route for deleting all the data from the database
app.get("/api/clear", function (req, res) {
    database.News.remove({})
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
    console.log("App running on port " + PORT);
});


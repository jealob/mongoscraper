// Require server dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

// Require Scraping tool dependencies
// require axios
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
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"))

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongoNaijaNews";

// Set mongoose to leverage built-in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/scrape", function (req, res) {
    axios.get("https://www.naija.ng/").then(response => {
        // Load Cheerio
        let $ = cheerio.load(response.data);
        // Select each element in the HTML body to scrape data
        $("li.news-list__item").each(function (i, element) {
            let title = $(element).children("a").text();
            let link = $(element).children("a").attr("href");

            // console.log(title)
            database.News.create({
                "briefs": title,
                "link": link
            }).then(function (dbNews) {
                // console.log(dbNews);
            }).catch(function (error) {
                return res.json(error);
            });
        });
        res.send("Data Scraped");
    });
});

app.get("/", function (req, res) {
    database.News.find({})
        .then(function (dbNews) {
            res.json(dbNews)
        })
        .catch(function (error) {
            res.json(error)
        })
    // res.send("home");
});

app.get("/saved", function (req, res) {
    database.News.find({ saved: true })
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })
    // res.send("home")
});

// Route for grabbing a specific Article by id, populate it with it's note
app.post("/saved/comments/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.News.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("comment")
        .then(function (dbNews) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbNews);
        })
        .catch(function (error) {
            // If an error occurred, send it to the client
            res.json(error);
        });
});

app.post("/saved/comments/:id", function (req, res) {
    db.Comment.create(req.body)
        .then(function (dbComment) {
            return db.News.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
        })
        .then(function (dbNews) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbNews);
        })
        .catch(function (error) {
            // If an error occurred, send it to the client
            res.json(error);
        });
});

app.post("/saved/:id", function (req, res) {
    database.News.update({ _id: req.body.id })
});


app.post("/:id", function (req, res) {
    database.News.update({ _id: req.body.id })
});

app.post("/clear", function (req, res) {
    database.News.remove({})
        .then(function (dbNews) {
            res.json(dbNews);
        })
        .catch(function (error) {
            res.json(error);
        })
    // res.send("home")
});

// Open the port for server listen to request
app.listen(PORT, "0.0.0.0", function () {
    console.log("App running on port " + PORT);
})
// app.get("/", function (req, res) {
//     res.send("home");
// });


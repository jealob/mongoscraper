# mongoscraper
## About

MongoScraper is a full-stack web scraper and article bookmarking tool built using Node.JS, Express.JS and Handlebars.JS and using Cheerio.JS for the scraping. Articles are scraped and displayed on the index page- if the user chooses to save an article, the article data is POST-ed to the server and fed into a MongoDB database. Previously saved articles can be retrieved from the database, and rendered on the page using Handlebars.JS templating.
## How it works
* The app can scrape a website. 
* MVC design pattern.
* Handlebars for rendering User Interface.
* The app is deployed to Heroku with MongoDB functionality.
App is hosted on github pages on [here](https://jealobmongoscraper.herokuapp.com/).

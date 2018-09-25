// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var express = require("express");
// var exphbs = require("express-handlebars");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// // Set Handlebars as the default templating engine.
//  app.engine("handlebars", exphbs({ defaultLayout: "main" }));
//  app.set("view engine", "handlebars");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Mongojs configuration
var databaseUrl = "miamiherald";

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/miamiherald");

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.miamiherald.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h4 within an article tag, and do the following:
    $("article h4").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete", dbArticle);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
   db.Article.find({})
     .then(function(dbArticle) {
       res.json(dbArticle);
     })
     .catch(function(err) {
       res.json(err);
     });
  res.render("article", { article: Article });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
   db.Article.findOne({ _id: req.params.id })
     .populate("note")
     .then(function(dbArticle) {
       res.json(dbArticle);
     })
     .catch(function(err) {
       res.json(err);
     });

});

app.post("/articles/:id", function(req, res) {

  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err)
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

/* global bootbox */
$(document).ready(function () {
  // Getting a reference to the article container div we will be rendering all articles inside of
  var articleContainer = $(".article-container");
  // Adding event listeners for dynamically generated buttons for deleting articles,
  // pulling up article notes, saving article notes, and deleting article notes
  $(document).on("click", ".btn.delete", handleNewsArticleDelete);
  $(document).on("click", ".btn.notes", handleNewsComments);
  $(document).on("click", ".btn.save", handleCommentSave);
  $(document).on("click", ".btn.note-delete", handleCommentDelete);
  $(".clear").on("click", handleArticleClear);
  initPage()
  function initPage() {
    // Empty the article container, run an AJAX request for any saved headlines

    $.get("/api/headlines?saved=true").then(function (data) {
      articleContainer.empty();
      // If we have headlines, render them to the page
      if (data && data.length) {
        renderArticles(data);
      } else {
        // Otherwise render a message explaining we have no articles
        renderEmpty();
      }
    });
  }

  function renderArticles(articles) {
    // This function handles appending HTML containing our article data to the page
    // We are passed an array of JSON containing all available articles in our database
    var articleCards = [];
    // We pass each article JSON object to the createCard function which returns a bootstrap
    // card with our article data inside
    for (var i = 0; i < articles.length; i++) {
      articleCards.push(createCard(articles[i]));
    }
    // Once we have all of the HTML for the articles stored in our articleCards array,
    // append them to the articleCards container
    articleContainer.append(articleCards);
  }

  function createCard(article) {
    // This function takes in a single JSON object for an article/headline
    // It constructs a jQuery element containing all of the formatted HTML for the
    // article card
    // console.log(article)
    var card = $("<div class='card'>");
    var cardHeader = $("<div class='card-header'>").append(
      $("<h3>").append(
        $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
          .attr("href", article.url)
          .text(article.headline),
        $("<a class='btn btn-danger delete'>Delete From Saved</a>"),
        $("<a class='btn btn-info notes'>Article Notes</a>")
      )
    );

    var cardBody = $("<div class='card-body'>").text(article.summary);

    card.append(cardHeader, cardBody);

    // We attach the article's id to the jQuery element
    // We will use this when trying to figure out which article the user wants to remove or open notes for
    card.data("_id", article._id);
    // We return the constructed card jQuery element
    // debugger;
    // console.log(card)
    return card;
  }

  function renderEmpty() {
    // This function renders some HTML to the page explaining we don't have any articles to view
    // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
    var emptyAlert = $(
      [
        "<div class='alert alert-warning text-center'>",
        "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
        "</div>",
        "<div class='card'>",
        "<div class='card-header text-center'>",
        "<h3>Would You Like to Browse Available Articles?</h3>",
        "</div>",
        "<div class='card-body text-center'>",
        "<h4><a href='/'>Browse Articles</a></h4>",
        "</div>",
        "</div>"
      ].join("")
    );
    // Appending this data to the page
    articleContainer.append(emptyAlert);
  }

  function handleNewsArticleDelete() {
    // This function handles deleting articles/headlines
    // We grab the id of the article to delete from the card element the delete button sits inside
    var articleToDelete = $(this)
      .parents(".card")
      .data();

    // Remove card from page
    $(this)
      .parents(".card")
      .remove();
    articleToDelete.saved = false;
    console.log("yes", articleToDelete)
    // Using a delete method here just to be semantic since we are deleting an article/headline
    $.ajax({
      method: "PUT",
      url: "/api/headlines/" + articleToDelete._id,
      data: articleToDelete
    }).then(function (data) {
      console.log(data)
      // If this works out, run initPage again which will re-render our list of saved articles
      if (data.ok) {
        initPage();
      }
    });
  }


  function handleNewsComments(event) {
    // This function handles opening the notes modal and displaying our notes
    // We grab the id of the article to get notes for from the card element the delete button sits inside
    var currentNewsArticle = $(this)
      .parents(".card")
      .data();

    // Grab any notes with this headline/article id
    $.get("/api/comments/" + currentNewsArticle._id).then(function (data) {
      // Constructing our initial HTML to add to the notes modal
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentNewsArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );
      // Adding the formatted HTML to the note modal

      bootbox.dialog({
        message: modalText,
        closeButton: true
      });

      var commentData = {
        _id: currentNewsArticle._id,
        comments: data.comment || []
      };
      console.log("data returned: ", commentData)
      // Adding some information about the article and article comments to the save button for easy access
      // When trying to add a new comment
      $(".btn.save").data("article", commentData);
      // renderCommentList will populate the actual note HTML inside of the modal we just created/opened
      renderCommentList(commentData);
    });
  }
  function renderCommentList(data) {
    // This function handles rendering note list items to our notes modal
    // Setting up an array of notes to render after finished
    // Also setting up a currentComment variable to temporarily store each note
    var commentsToRender = [];
    var currentComment;
    if (!data.comments.length) {
      // If we have no notes, just display a message explaining this
      currentComment = $("<li class='list-group-item'>No notes for this article yet.</li>");
      commentsToRender.push(currentComment);
    } else {
      // If we do have notes, go through each one
      for (var i = 0; i < data.comments.length; i++) {
        console.log(data.comments[i])
        // Constructs an li element to contain our noteText and a delete button
        currentComment = $("<li class='list-group-item note'>")
          .text(data.comments[i].commentText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        // Store the note id on the delete button for easy access when trying to delete
        currentComment.children("button").data("_id", data.comments[i]._id);
        // Adding our currentComment to the commentsToRender array
        commentsToRender.push(currentComment);
      }
    }
    // console.log(commentsToRender)
    // Now append the commentsToRender to the note-container inside the note modal
    $(".note-container").append(commentsToRender);
  }

  function handleCommentSave() {
    // This function handles what happens when a user tries to save a new note for an article
    // Setting a variable to hold some formatted data about our note,
    // grabbing the note typed into the input box
    var commentData;
    var newComment = $(".bootbox-body textarea")
      .val()
      .trim();

    // If we actually have data typed into the note input field, format it
    // and post it to the "/api/notes" route and send the formatted commentData as well
    if (newComment) {
      commentData = { _headlineId: $(this).data("article")._id, commentText: newComment };
      console.log(commentData)
      $.post("/api/comments", commentData).then(function (data) {
        // When complete, close the modal
        console.log(data)
        bootbox.hideAll();
      });
    }
  }

  function handleCommentDelete() {
    // This function handles the deletion of notes
    // First we grab the id of the note we want to delete
    // We stored this data on the delete button when we created it
    // console.log($(this));
    var commentToDelete = $(this).data("_id");

    // Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
    $.ajax({
      url: "/api/comments/" + commentToDelete._id,
      method: "DELETE"
    }).then(function () {
      // When done, hide the modal
      bootbox.hideAll();
    });
  }

  function handleArticleClear() {
    $.get("api/clear")
      .then(function () {
        articleContainer.empty();
        initPage();
      });
  }
});
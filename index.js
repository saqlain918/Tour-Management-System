const express = require("express");
const path = require("path");

const app = express();
const port = 8000;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set path to your public directory
const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));

// Define route for "/"
app.get("/", (req, res) => {
  // Render the index.ejs file
  res.render("index");
});

// Define route for "/signin"
app.get("/signin", (req, res) => {
  // Render the signin.ejs file
  res.render("signin");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

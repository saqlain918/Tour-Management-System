const express = require("express");
const path = require("path");

const app = express();
const port = 8000;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set path to your public directory
const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));

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
// Define route to handle form submission
app.post("/signin", (req, res) => {
  // Extract form data from request
  const email = req.body.email;
  const password = req.body.password;

  // Log the form data
  console.log("Form data received:");
  console.log("Email:", email);
  console.log("Password:", password);

  // Send response
  res.send("Form data received successfully!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

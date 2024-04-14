const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 3000; // Change the port number to 3000

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set path to your public directory
const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

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

// Define route for "/signup"
app.get("/signup", (req, res) => {
  // Render the signin.ejs file
  res.render("signup");
});

app.post("/signup", (req, res) => {
  // Extract form data from request
  const { first_name, last_name, email, password, gender } = req.body;

  // Here you can add validation, database operations, etc.

  // Log the form data
  console.log("Form data received:");
  console.log("First name:", first_name);
  console.log("Last name:", last_name);
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Gender:", gender);

  // Send response
  res.send("Form data received successfully!");
});

// Define route for "/forget"
app.get("/forget", (req, res) => {
  // Render the forgotPassword.ejs file
  res.render("forget");
});

app.post("/forget", (req, res) => {
  // Extract form data from request
  const email = req.body.email;

  // Log the form data
  console.log("Form data received:");
  console.log("Email:", email);

  // Send response
  res.send("forget data received successfully!");
});
// Start the server !

// Start the server

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

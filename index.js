const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Change the port number to 3000

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set path to your public directory
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
app.use(bodyParser.urlencoded({ extended: true }));

// Define route for "/"
app.get('/', (req, res) => {
  // Render the index.ejs file
  res.render('index');
});

// Define route for "/signin"
app.get('/signin', (req, res) => {
  // Render the signin.ejs file
  res.render('signin');
});

// Define route for "/forget"
app.get('/forget', (req, res) => {
  // Render the forgotPassword.ejs file
  res.render('forget');
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

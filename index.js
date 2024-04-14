const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000; // Change the port number to 3000

// Set EJS as the view engine
app.set("view engine", "ejs");
const tokenStore = new Map();

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

app.get("/email", (req, res) => {
  // Render the signin.ejs file
  res.render("email");
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

// POST endpoint for handling email verification
app.post("/verify-email", (req, res) => {
  const { email } = req.body;

  // Generate a verification token
  const token = crypto.randomBytes(20).toString("hex");
  tokenStore.set(token, email);

  // Send email for verification
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "f219255@cfd.nu.edu.pk", // Replace with your email address
      pass: "918261rai", // Replace with your email password
    },
  });

  const mailOptions = {
    from: "f219255@cfd.nu.edu.pk", // Replace with your email address
    to: email,
    subject: "Email Verification",
    text: `Please verify your email address by clicking the link below: http://localhost:3000/verify?token=${token}`,
    html: `<p>Please verify your email address by clicking the link below:</p><a href="http://localhost:3000/verify?token=${token}">Verify Email</a>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }
    console.log("Email sent:", info.response);
    res.status(200).json({ message: "Email sent for verification" });
  });
});

// GET endpoint for handling verification link
app.get("/verify", (req, res) => {
  const token = req.query.token;
  const email = tokenStore.get(token);

  if (!email) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  // Mark email as verified in your database (replace this with your database logic)
  console.log(`Email ${email} verified successfully`);

  // Remove token from token store
  tokenStore.delete(token);

  // Redirect user to a success page or send a success response
  res.status(200).send("Email verified successfully");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

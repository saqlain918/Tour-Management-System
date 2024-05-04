const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
const staticPath = path.join(__dirname, "public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB using Mongoose
mongoose.connect("mongodb://localhost:27017/your-database-name", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define user schema
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  password: String,
  gender: String,
});

// Create User model
const User = mongoose.model("User", userSchema);

// Define route for "/"
app.get("/", (req, res) => {
  res.render("index");
});

// Define route for "/signin"
app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/email", (req, res) => {
  res.render("email");
});

// Define route to handle form submission for sign-in
app.post("/signin", (req, res) => {
  const { email, password } = req.body;

  console.log("Form data received:");
  console.log("Email:", email);
  console.log("Password:", password);

  res.send("Form data received successfully!");
});

// Define route for "/signup"
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Define route for "/forget"
app.get("/forget", (req, res) => {
  res.render("forget");
});

app.post("/forget", (req, res) => {
  const { email } = req.body;

  console.log("Form data received:");
  console.log("Email:", email);

  res.send("Forget data received successfully!");
});

// POST endpoint for handling email verification
app.post("/verify-email", (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(20).toString("hex");
  tokenStore.set(token, email);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "your-email@gmail.com", // Replace with your email address
      pass: "your-email-password", // Replace with your email password
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com", // Replace with your email address
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

  console.log(`Email ${email} verified successfully`);
  tokenStore.delete(token);
  res.status(200).send("Email verified successfully");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

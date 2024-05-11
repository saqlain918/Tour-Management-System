const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original file name as the file name
  },
});
let toke;
const upload = multer({ storage: storage }); // Specify the directory where uploaded files will be saved

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
  pic: String,
  bookedTours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }], // Array to store IDs of booked tours
});

// Create User model
const User = mongoose.model("User", userSchema);

// Configure Passport
app.use(
  require("express-session")({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    done
  ) {
    try {
      const user = await User.findOne({ email });

      if (!user || user.password !== password) {
        return done(null, false, { message: "Incorrect email or password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Define route for "/"
app.get("/", (req, res) => {
  res.render("index");
});

// Define route for "/signin"
app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/touradd", (req, res) => {
  res.render("tours-add");
});

// Define route to handle form submission for sign-in
app.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/index1",
    failureRedirect: "/signin",
    failureFlash: true,
  })
);

// Define route for "/index1"
app.get("/index1", (req, res) => {
  res.render("index1");
});

// Define route for "/signup"
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/email", (req, res) => {
  res.render("email");
});

const nodemailer = require("nodemailer");

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "F219255@cfd.nu.edu.pk",
    pass: "918261rai",
  },
});

// Define route to handle form submission for sign-up
app.post("/signup", upload.single("avatar"), async (req, res) => {
  const { first_name, last_name, email, password, gender } = req.body;
  const pic = req.file.filename; // Get the uploaded file name

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // Create a new user instance
    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
      gender,
      pic, // Assign the file name to the pic attribute
    });

    // Save the user to the database
    await newUser.save();

    console.log("User saved to database:", newUser);
    const token = Math.floor(1000 + Math.random() * 9000); // Generates a random four-digit number

    toke = token;
    // Send verification email
    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Email Verification",
      html: `<p>your code is ${token}</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Error sending email");
      } else {
        console.log("Email sent:", info.response);
      }
    });
    res.render("email");
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).send("Error storing user data");
  }
});
app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;

  console.log(otp, toke);
  // Compare the OTP provided by the user with the global token
  if (otp !== toke.toString()) {
    return res.status(400).send("Invalid OTP");
  }

  // If OTP matches, find the user by the token in the database

  res.redirect("/index1"); // Redirect to index1 upon successful verification
});

// Define route for "/forget"
app.get("/forget", (req, res) => {
  res.render("forget");
});

// POST endpoint for handling email verification
app.post("/verify-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send("User with this email does not exist");
  }

  const token = crypto.randomBytes(20).toString("hex");

  // Save the verification token to the user's document in the database
  user.verificationToken = token;
  await user.save();
});

// GET endpoint for handling verification link
app.get("/verify", async (req, res) => {
  const token = req.query.token;

  // Find the user by the verification token
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).send("Invalid verification token");
  }

  // Mark the user's email as verified
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.send("Email verified successfully");
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/signin");
};

// Define route to render user profile page
app.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const userProfile = await User.findById(req.user.id);
    console.log(userProfile);
    res.render("profile-view", { user: userProfile });
  } catch (error) {
    console.error("Error viewing user profile:", error);
    res.status(500).send("Error viewing user profile");
  }
});
app.use("/uploads", express.static("uploads"));
// Route to render profile edit form (protected)
app.get("/profile/edit", isAuthenticated, async (req, res) => {
  try {
    // Retrieve user profile information from the database
    const userProfile = await User.findById(req.user.id);
    res.render("profile-edit", { user: userProfile });
  } catch (error) {
    console.error("Error rendering profile edit form:", error);
    res.status(500).send("Error rendering profile edit form");
  }
});

// Route to handle profile edit form submission (protected)
app.post("/profile/edit", isAuthenticated, async (req, res) => {
  const { first_name, last_name, email, gender } = req.body;

  try {
    // Update user profile information in the database
    await User.findByIdAndUpdate(req.user.id, {
      first_name,
      last_name,
      email,
      gender,
    });
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).send("Error updating user profile");
  }
});

// Define tour schema
const tourSchema = new mongoose.Schema({
  tour_name: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  price: {
    type: Number,
  },
  image: {
    type: String,
  },
});

// Create Tour model
const Tour = mongoose.model("Tour", tourSchema);

// Define route to handle form submission for adding tour
app.post(
  "/addtour",
  upload.fields([{ name: "image1", maxCount: 1 }]),
  async (req, res) => {
    const { tour_name, city, country, price } = req.body;
    console.log(req.body);
    const images = req.files; // Get the uploaded images

    // Check if tour_name is empty or null
    if (!tour_name) {
      return res.status(400).send("Tour name is required.");
    }

    try {
      // Check if a tour with the same name already exists
      const existingTour = await Tour.findOne({ tour_name });
      if (existingTour) {
        return res
          .status(400)
          .send("A tour with the same name already exists.");
      }

      // Create a new tour instance
      const newTour = new Tour({
        tour_name,
        city,
        country,
        price,
        image: images["image1"][0].filename, // Assign the image filename directly to 'image'
      });

      // Save the tour to the database
      await newTour.save();

      console.log("Tour saved to database:", newTour);
      res.redirect("/index1"); // Redirect to index1 upon successful tour addition
    } catch (error) {
      console.error("Error saving tour data:", error);
      res.status(500).send("Error storing tour data");
    }
  }
);

// Define route to fetch all tours
app.get("/tourshow", async (req, res) => {
  try {
    const page = 1;
    const limit = 10; // Change this to adjust the number of items per page
    const skip = (page - 1) * limit;

    // Construct the query to search by tour name and filter by maximum price

    // Find tours based on the constructed query with pagination
    const tours = await Tour.find().skip(skip).limit(limit);

    res.render("tours", { tours, query: "", maxPrice: "", page: 1 }); // Provide default value for page
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});

// Define route to handle booking a tour
app.post("/booktour", isAuthenticated, async (req, res) => {
  const { tourId } = req.body;
  console.log("Tour ID:", tourId);
  try {
    // Find the authenticated user by ID
    const user = await User.findById(req.user.id);
    // Add the tour ID to the user's bookedTours array
    user.bookedTours.push(tourId);
    // Save the updated user data
    await user.save();

    // Retrieve the booked tour details
    const bookedTour = await Tour.findById(tourId);
    if (!bookedTour) {
      return res.status(404).send("Tour not found");
    }

    // Send an email notification to the user
    const mailOptions = {
      from: "F219255@cfd.nu.edu.pk",
      to: user.email,
      subject: "Tour Booking Confirmation",
      html: `
        <p>Dear ${user.first_name} ${user.last_name},</p>
        <p>You have successfully booked the tour "${bookedTour.tour_name}".</p>
        <p>Location: ${bookedTour.city}, ${bookedTour.country}</p>
        <p>Price: $${bookedTour.price}</p>
        <p>Thank you for booking with us!</p>
      `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Error sending email");
      } else {
        console.log("Email sent:", info.response);
        // Send a success response
        res.status(200).send("Tour booked successfully. Email sent.");
      }
    });
  } catch (error) {
    console.error("Error booking tour:", error);
    res.status(500).send("Error booking tour");
  }
});

// Define route to handle search query with pagination
// Define route to handle search query with pagination
// Define route to handle search query with pagination
app.get("/search", async (req, res) => {
  try {
    const query = req.query.query;
    const maxPrice = req.query.maxPrice;

    // Pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Change this to adjust the number of items per page
    const skip = (page - 1) * limit;

    // Construct the query to search by tour name and filter by maximum price
    const searchQuery = {
      $or: [{ tour_name: { $regex: query, $options: "i" } }],
    };

    // Add max price filter if provided
    if (maxPrice) {
      searchQuery.price = { $lte: maxPrice };
    }

    // Find tours based on the constructed query with pagination
    const tours = await Tour.find(searchQuery).skip(skip).limit(limit);

    // Render the tours page with the filtered tours, query, maxPrice, and pagination variables
    res.render("tours", { tours, query, maxPrice, page });
  } catch (error) {
    console.error("Error searching tours:", error);
    res.status(500).send("Error searching tours");
  }
});

// Define route to render the chart
app.get("/chart", async (req, res) => {
  try {
    // Aggregate tour data by country
    const tourData = await Tour.aggregate([
      {
        $group: {
          _id: "$country", // Group tours by country
          tourCount: { $sum: 1 }, // Count tours in each group
        },
      },
    ]);

    // Render the chart.ejs template and pass tourData to it
    res.render("chart", { tourData });
  } catch (error) {
    console.error("Error rendering chart:", error);
    res.status(500).send("Error rendering chart");
  }
});

// Define route to fetch all tours
app.get("/deleteTour", async (req, res) => {
  try {
    // Construct the query to search by tour name and filter by maximum price

    // Find tours based on the constructed query with pagination
    const tours = await Tour.find();

    res.render("deleteTour", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});

// Define route to fetch all tours
app.get("/updateTour", async (req, res) => {
  try {
    // Construct the query to search by tour name and filter by maximum price

    // Find tours based on the constructed query with pagination
    const tours = await Tour.find();

    res.render("updateTour", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});

// Define route to fetch all tours
app.get("/UpdateUser", async (req, res) => {
  try {
    const tours = await User.find();

    res.render("UpdateUser", { tours });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});

// Define route to handle updating a tour
// Define route to handle updating a tour
app.post("/UpdateUser1", async (req, res) => {
  const { tourId, newName, newLastName } = req.body; // Corrected variable name

  try {
    // Find the user by ID and update its first and last names
    await User.findByIdAndUpdate(tourId, {
      first_name: newName,
      last_name: newLastName, // Corrected variable name
    });

    const tours = await User.find();

    res.render("UpdateUser", { tours });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Error updating user");
  }
});

// Define route to handle updating a tour
app.post("/updateTour1", async (req, res) => {
  const { tourId, newName, newPrice } = req.body;

  try {
    // Find the tour by ID and update its name and price
    await Tour.findByIdAndUpdate(tourId, {
      tour_name: newName,
      price: newPrice,
    });

    // Send a success response
    const tours = await Tour.find();

    res.render("updateTour", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).send("Error updating tour");
  }
});

// Define route to handle updating a tour
app.post("/updateTour1", async (req, res) => {
  const { tourId, newName, newPrice } = req.body;

  try {
    // Find the tour by ID and update its name and price
    await Tour.findByIdAndUpdate(tourId, {
      tour_name: newName,
      price: newPrice,
    });

    // Send a success response
    const tours = await Tour.find();

    res.render("updateTour", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error updating tour:", error);
    res.status(500).send("Error updating tour");
  }
});

app.get("/viewUser", async (req, res) => {
  try {
    // Construct the query to search by tour name and filter by maximum price

    // Find tours based on the constructed query with pagination
    const tours = await User.find();

    res.render("viewUser", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});
// Define route to handle deleting a tour
app.post("/deleteTours", async (req, res) => {
  const { tourId } = req.body;

  try {
    // Delete the tour from the Tour collection
    await Tour.findByIdAndDelete(tourId);

    // Remove the tour ID from the bookedTours array of all users
    await User.updateMany({}, { $pull: { bookedTours: tourId } });

    // Redirect to the deleteTour page after deletion
    res.redirect("/deleteTour");
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).send("Error deleting tour");
  }
});

// Define route to handle deleting a tour
app.post("/deleteUser1", async (req, res) => {
  const { tourId } = req.body;

  try {
    // Delete the tour from the Tour collection
    await User.findByIdAndDelete(tourId);

    // Remove the tour ID from the bookedTours array of all users

    // Redirect to the deleteTour page after deletion
    res.redirect("/deleteUser");
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).send("Error deleting tour");
  }
});

app.get("/deleteUser", async (req, res) => {
  try {
    // Construct the query to search by tour name and filter by maximum price

    // Find tours based on the constructed query with pagination
    const tours = await User.find();

    res.render("deleteUser", { tours }); // Provide default value for page
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).send("Error fetching tours");
  }
});

// POST endpoint to handle feedback submission
app.post("/api/feedback", isAuthenticated, (req, res) => {
  // Get feedback data from request body
  const feedbackData = req.body;

  // Get the email of the signed-in user
  const userEmail = req.user.email;

  // Send feedback email to the signed-in user
  sendFeedbackEmail(feedbackData, userEmail);

  // Send response
  res.redirect("/index1");
});

// Function to send feedback email to the signed-in user
function sendFeedbackEmail(feedbackData, userEmail) {
  const mailOptions = {
    from: userEmail, // Sender's email address
    to: "f219255@cfd.nu.edu.pk", // Send feedback email to the signed-in user
    subject: "Feedback Received",
    text: `your feedback:${feedbackData}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Feedback email sent:", info.response);
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

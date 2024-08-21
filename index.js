const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const passport = require('passport');
require('./passport'); // Ensure passport configuration is set up correctly
const { check, validationResult } = require('express-validator');
const auth = require('./auth'); // Import auth for JWT login
require('dotenv').config(); // Load environment variables

// Initialize the app
const app = express();

// Connect to the database using the URI from .env
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("common"));

// CORS configuration
let allowedOrigins = ['http://localhost:1234', 'https://your-render-url.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

// Initialize passport
app.use(passport.initialize());

// Import models
const Models = require("./models");
const Movie = Models.Movie;
const Users = Models.User;

// Authentication routes
auth(app);

// User Routes with Validation
app.post('/users', 
  [
    check('Username', 'Username is required and should be at least 5 characters long').isLength({ min: 5 }),
    check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], 
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
});

// Update User with Validation
app.put('/users/:Username', 
  passport.authenticate('jwt', { session: false }), 
  [
    check('Username', 'Username is required and should be at least 5 characters long').optional().isLength({ min: 5 }),
    check('Username', 'Username contains non-alphanumeric characters - not allowed.').optional().isAlphanumeric(),
    check('Password', 'Password is required').optional().not().isEmpty(),
    check('Email', 'Email does not appear to be valid').optional().isEmail()
  ], 
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }

    try {
      const updatedUser = await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
          $set: {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          },
        },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      res.json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
});

// Movies Route
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Example route to check if the server is running
app.get("/", (req, res) => {
  res.send("Welcome to MyFlix!");
});

// Static file serving for documentation
app.use("/documentation", express.static("public"));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error");
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Your app is listening on port ' + port);
});

module.exports = app;

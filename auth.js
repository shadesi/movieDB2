require('dotenv').config(); // Load environment variables
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret'; // Fallback to ensure this matches the secret used in passport.js

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport'); // Import your passport strategies

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you're encoding in the token
    expiresIn: '7d', // Token will expire in 7 days
    algorithm: 'HS256' // Algorithm used to sign the token
  });
};

/* POST login */
module.exports = (app) => {
  app.post('/auth/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error) {
        return res.status(500).json({ message: 'Server error', error });
      }
      if (!user) {
        return res.status(400).json({
          message: info ? info.message : 'Invalid username or password',
          user: user
        });
      }
      
      req.login(user, { session: false }, (error) => {
        if (error) {
          return res.status(500).send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};

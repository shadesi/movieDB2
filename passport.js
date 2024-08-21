const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Models = require('./models.js');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

// Local strategy for user authentication
passport.use(new LocalStrategy({
  usernameField: 'Username',
  passwordField: 'Password'
}, async (username, password, done) => {
  try {
    const user = await Users.findOne({ Username: username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (!user.validatePassword(password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// JWT strategy for token verification
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret' 
}, async (jwtPayload, done) => {
  try {
    const user = await Users.findOne({ Username: jwtPayload.Username });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error);
  }
}));

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define movie schema
let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: { type: String, required: true },
    Description: { type: String, required: true }
  },
  Director: {
    Name: { type: String, required: true },
    Bio: { type: String, required: true }
  },
  Actors: [String],
  ImagePath: String,
  Featured: Boolean
});

// Define user schema
let userSchema = mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ }, // Email validation
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

// Hash the user's password
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Validate the user's password
userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.Password);
};

// Pre-save middleware to hash password (optional)
userSchema.pre('save', function (next) {
  if (this.isModified('Password')) {
    this.Password = bcrypt.hashSync(this.Password, 10);
  }
  next();
});

// Define models for Movie and User
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;

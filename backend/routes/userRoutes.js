const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Create a new user
router.post('/', async (req, res) => {
  const { email, employeeNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeNumber }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email or employee number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Debugging logs for signup
    console.log('Signup attempt with email:', email);
    console.log('Plain text password before hashing:', password);
    console.log('Hashed password:', hashedPassword);

    // Remove manual password hashing
    const user = new User({ ...req.body }); // Pass plain text password directly
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error('Error during user creation:', error);
    res.status(500).json({ error: 'An error occurred while creating the account.' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Debugging logs for login
    console.log('Login attempt with email:', email);
    console.log('Plain text password provided:', password);
    if (user) {
      console.log('User found in database:', user);
      console.log('Hashed password from database:', user.password);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isPasswordValid);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid email or password.' }); // Generic error
      }
    } else {
      console.log('No user found with the provided email.');
      return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// Protected route
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the profile.' });
  }
});

module.exports = router;

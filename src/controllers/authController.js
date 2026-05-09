import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/User.js';
import { getJwtSecret } from '../config/jwt.js';

// ===================================
// REGISTER USER
// ===================================
export const register = async (req, res, next) => {
  try {
    // Get user data from request body
    const { name, email, password, phone, address, barangay } = req.body;

    // Check if email already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate simple unique user ID
    const userId = `USER-${Date.now()}`;

    // Create new user in database
    const user = await createUser({
      userId,
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      barangay,
      role: 'customer',
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: '7d',
      }
    );

    // Send success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ===================================
// LOGIN USER
// ===================================
export const login = async (req, res, next) => {
  try {
    // Get email and password from request
    const { email, password } = req.body;

    // Find user using email
    const user = await findUserByEmail(email);

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    // Invalid password
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate login token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: '7d',
      }
    );

    // Login success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ===================================
// LOGOUT USER
// ===================================
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};
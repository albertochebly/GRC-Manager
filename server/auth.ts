import { Router } from "express";
import passport from "passport";
import session from "express-session";
import express, { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { z } from "zod";

// Define User type that matches what we actually use
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  claims?: any;
}

// Extend Express types
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      claims?: any;
    }
  }
}

// Extend session types
declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
    user?: Express.User;
  }
}

// Register schema to validate registration requests
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

// Session configuration
export function getSession() {
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,              // Don't save session if unmodified
    saveUninitialized: false,   // Don't create session until something stored
    name: 'connect.sid',        // Default session cookie name
    rolling: true,              // Reset maxAge on every response
    cookie: {
      secure: false,            // Set to true in production with HTTPS
      httpOnly: true,           // Prevent client-side access to the cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',               // Cookie path
      sameSite: 'lax' as const, // Allow cross-site requests with top-level navigation
      domain: undefined         // Don't restrict domain in development
    }
  };
  
  console.log('Session config:', sessionConfig);
  return session(sessionConfig);
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('Auth check:', {
    sessionExists: !!req.session,
    isAuthenticated: req.session?.isAuthenticated,
    hasUser: !!req.user,
    sessionID: req.sessionID
  });
  
  if (!req.session?.isAuthenticated || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function setupAuth(app: Express) {
  // Set up session handling
  app.use(getSession());

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create username from email if not provided
      let username = data.email.split("@")[0];
      let counter = 1;
      while (await storage.getUserByUsername(username)) {
        username = `${data.email.split("@")[0]}${counter}`;
        counter++;
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const newUser = await storage.createUser({
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        username
      });

      if (newUser) {
        // Create session user with proper structure
        const sessionUser: Express.User = {
          id: newUser.id,
          email: newUser.email || '',
          firstName: newUser.firstName || '',
          lastName: newUser.lastName || '',
          username: newUser.username || '',
          claims: {
            sub: newUser.id,
            email: newUser.email || '',
            name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
            first_name: newUser.firstName || '',
            last_name: newUser.lastName || '',
          }
        };

        // Log the user in
        req.logIn(sessionUser, (err: any) => {
          if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: "Login failed" });
          }

          // Set session flags
          req.session.isAuthenticated = true;
          req.session.user = sessionUser;

          // Save session
          req.session.save((err: any) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ message: "Session save failed" });
            }

            res.json({
              id: newUser.id,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              username: newUser.username
            });
          });
        });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.errors) {
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session user with proper structure
      const sessionUser: Express.User = {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        claims: {
          sub: user.id,
          email: user.email || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          first_name: user.firstName || '',
          last_name: user.lastName || '',
        }
      };

      // Log the user in
      req.logIn(sessionUser, (err: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: "Login failed" });
        }

        // Set session flags
        req.session.isAuthenticated = true;
        req.session.user = sessionUser;

        // Save session
        req.session.save((err: any) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Session save failed" });
          }

          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
          });
        });
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.user) {
      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

import { Router } from "express";
import passport from "passport";
import session from "express-session";
import express, { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { z } from "zod";

// Register schema to validate registration requests
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

interface AuthenticatedRequest extends Request {
  session: session.Session & {
    isAuthenticated?: boolean;
    user?: Express.User;
    passport?: {
      user: Express.User;
    };
  };
  user?: Express.User;
  logIn: {
    (user: Express.User, done: (err: any) => void): void;
    (user: Express.User, options: any, done: (err: any) => void): void;
  };
  logout: {
    (options: any, done: (err: any) => void): void;
    (done: (err: any) => void): void;
  };
}

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
  const authReq = req as AuthenticatedRequest;
  console.log('Auth check:', {
    sessionExists: !!authReq.session,
    isAuthenticated: authReq.session?.isAuthenticated,
    hasUser: !!authReq.user,
    sessionID: authReq.sessionID
  });
  
  if (!authReq.session?.isAuthenticated || !authReq.user) {
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
  
  passport.serializeUser((user: Express.User, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  // Registration endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate registration data
      const data = registerSchema.parse(req.body);

      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Generate username from email
      let username = data.email.split("@")[0];
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        // If username exists, append random numbers
        username = `${username}${Math.floor(Math.random() * 1000)}`;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create the user
      const newUser = await storage.createUser({
        username,
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
      });

      // Create a session user object
      const sessionUser: Express.User = {
        claims: {
          sub: newUser.id,
          email: newUser.email || '',
          name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim(),
          first_name: newUser.firstName || '',
          last_name: newUser.lastName || ''
        }
      };

      // Log the user in
      const authReq = req as AuthenticatedRequest;
      await new Promise<void>((resolve, reject) => {
        authReq.logIn(sessionUser, (err) => {
          if (err) {
            console.error("Login error after registration:", err);
            reject(err);
            return;
          }
          resolve();
        });
      });

      // Set session data
      authReq.session.isAuthenticated = true;
      authReq.session.user = sessionUser;

      // Save session
      authReq.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session save failed' });
        }

        res.status(201).json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Login attempt:', req.body);
      
      const { email, password } = req.body;
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      // Check if user has a password hash
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create user session object
      const sessionUser: Express.User = {
        claims: {
          sub: user.id,
          email: user.email || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          first_name: user.firstName || '',
          last_name: user.lastName || ''
        }
      };

      await new Promise<void>((resolve, reject) => {
        req.logIn(sessionUser, (err) => {
          if (err) {
            console.error("Login error:", err);
            reject(err);
            return;
          }
          resolve();
        });
      });

      // Set session data after successful login
      req.session.isAuthenticated = true;
      req.session.user = sessionUser;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session save failed' });
        }

        console.log('Session after login:', {
          id: req.sessionID,
          user: req.user,
          isAuthenticated: req.session.isAuthenticated,
          passport: req.session.passport
        });

        res.json({
          message: "Login successful",
          user: sessionUser,
          sessionId: req.sessionID
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req: AuthenticatedRequest, res: Response) => {
    console.log('User request:', {
      sessionID: req.sessionID,
      isAuthenticated: req.session?.isAuthenticated,
      sessionUser: req.session?.user,
      passportUser: req.session?.passport?.user,
      user: req.user
    });

    // Check both session authentication and passport user
    if (!req.session?.isAuthenticated && !req.session?.passport?.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // In development, use any available user data
    const userData = req.user || req.session.passport?.user || req.session.user;
    res.json(userData);
  });

  // Logout endpoint
  app.post("/api/logout", (req: AuthenticatedRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}

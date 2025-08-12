import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { telegramService } from "./telegram";
import { User } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      phone: string;
      password: string;
      fullName: string;
      gender: string;
      dateOfBirth: Date;
      island: string;
      atoll: string;

      job?: string | null;
      education?: string | null;
      shortBio?: string | null;
      partnerPreferences?: any;
      profilePhotoPath?: string;
      telegramChatId?: string;
      telegramNotifications?: boolean;
      status: string;
      role: string;
      coins?: number;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "change-this-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username', // can be username or email
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          // Try to find user by username first, then by phone
          let user = await storage.getUserByUsername(username);
          if (!user && /^[0-9]+$/.test(username)) {
            user = await storage.getUserByPhone(username);
          }
          
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid credentials' });
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (req.body.phone) {
        const existingPhone = await storage.getUserByPhone(req.body.phone);
        if (existingPhone) {
          return res.status(400).json({ message: "Phone number already exists" });
        }
      }

      // Remove confirmPassword from data before saving
      const { confirmPassword, ...userData } = req.body;
      
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Send Telegram notification to admin about new user registration
      await telegramService.notifyAdminNewUser(
        user.username,
        user.fullName,
        user.island,
        user.atoll
      );

      // Remove password from response
      const { password, ...safeUser } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Remove password from response
        const { password, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...safeUser } = req.user!;
    res.json(safeUser);
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.sendStatus(401);
}

export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN')) {
    return next();
  }
  res.sendStatus(403);
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runMigrations } from "./db";
import { 
  insertUserSchema, insertAccountSchema, insertTransactionSchema, 
  User, Account, Transaction
} from "@shared/schema";
import { ZodError } from "zod";
import { v4 as uuidv4 } from "uuid";

// Middleware to handle API errors
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("API Error:", err);
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors
    });
  }
  
  return res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
}

// Ensure user is authenticated (basic implementation)
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"];
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  next();
}

// Simple session interface
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Run database migrations on startup
  try {
    await runMigrations();
  } catch (error) {
    console.error("Failed to run migrations:", error);
  }
  
  // Auth routes
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // In a real app, we'd hash the password and compare with stored hash
      // For demo purposes, we'll just check the username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });
  
  app.get("/api/auth/me", async (req, res, next) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // User routes
  app.get("/api/users", async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/users", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }
      
      // We'll generate a unique ID in the storage layer
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/users/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Prevent email change to avoid duplicates
      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await storage.getUserByEmail(req.body.email);
        if (existingUser) {
          return res.status(409).json({ error: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/users/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const deleted = await storage.deleteUser(userId);
      res.json({ success: deleted });
    } catch (error) {
      next(error);
    }
  });
  
  // Account routes
  app.get("/api/accounts", requireAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId as string;
      
      if (userId) {
        const accounts = await storage.getAccountsByUserId(userId);
        return res.json(accounts);
      }
      
      // Return error if no user ID provided
      res.status(400).json({ error: "User ID required" });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/accounts/:id", requireAuth, async (req, res, next) => {
    try {
      const account = await storage.getAccount(req.params.id);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/accounts", requireAuth, async (req, res, next) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      
      // Ensure user exists
      const user = await storage.getUser(accountData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // We'll generate a unique ID in the storage layer
      
      // Generate account number if not provided
      if (!accountData.accountNumber) {
        accountData.accountNumber = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      
      const newAccount = await storage.createAccount(accountData);
      res.status(201).json(newAccount);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/accounts/:id", requireAuth, async (req, res, next) => {
    try {
      const accountId = req.params.id;
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      // Prevent changing user ID or account number
      if (req.body.userId || req.body.accountNumber) {
        return res.status(400).json({ error: "Cannot change user ID or account number" });
      }
      
      const updatedAccount = await storage.updateAccount(accountId, req.body);
      res.json(updatedAccount);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/accounts/:id", requireAuth, async (req, res, next) => {
    try {
      const accountId = req.params.id;
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const deleted = await storage.deleteAccount(accountId);
      res.json({ success: deleted });
    } catch (error) {
      next(error);
    }
  });
  
  // Transaction routes
  app.get("/api/transactions", requireAuth, async (req, res, next) => {
    try {
      const accountId = req.query.accountId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (accountId) {
        const transactions = await storage.getTransactionsByAccountId(accountId);
        return res.json(transactions);
      }
      
      // Default to getting all transactions with optional limit
      const transactions = await storage.getAllTransactions(limit);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/transactions/details", requireAuth, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactionsWithDetails(limit);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/transactions/:id", requireAuth, async (req, res, next) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/transactions", requireAuth, async (req, res, next) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // We'll generate a unique ID in the storage layer
      
      // Validate that source account exists
      const sourceAccount = await storage.getAccount(transactionData.accountId);
      if (!sourceAccount) {
        return res.status(404).json({ error: "Source account not found" });
      }
      
      // For transfers, validate destination account
      if (transactionData.type === "transfer" && transactionData.destinationAccountId) {
        const destAccount = await storage.getAccount(transactionData.destinationAccountId);
        if (!destAccount) {
          return res.status(404).json({ error: "Destination account not found" });
        }
        
        // Prevent transfers to the same account
        if (transactionData.accountId === transactionData.destinationAccountId) {
          return res.status(400).json({ error: "Cannot transfer to the same account" });
        }
      }
      
      const newTransaction = await storage.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      next(error);
    }
  });
  
  // Dashboard stats
  app.get("/api/dashboard", requireAuth, async (req, res, next) => {
    try {
      const userId = req.query.userId as string | undefined;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });
  
  // Register error handler
  app.use(errorHandler);
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

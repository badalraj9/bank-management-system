import { 
    users, accounts, transactions,
    type User, type InsertUser,
    type Account, type InsertAccount,
    type Transaction, type InsertTransaction,
    type TransactionWithDetails, type AccountWithStats
  } from "@shared/schema";
  import { db } from "./db";
  import { eq, desc, and, sql, inArray } from "drizzle-orm";
  import { v4 as uuidv4 } from "uuid";
  
  // Update interface with complete CRUD methods for our bank management system
  export interface IStorage {
    // User operations
    getUser(id: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUsers(): Promise<User[]>;
    createUser(user: InsertUser): Promise<User>;
    updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
    deleteUser(id: string): Promise<boolean>;
    
    // Account operations
    getAccount(id: string): Promise<Account | undefined>;
    getAccountsByUserId(userId: string): Promise<Account[]>;
    createAccount(account: InsertAccount): Promise<Account>;
    updateAccount(id: string, data: Partial<Account>): Promise<Account | undefined>;
    deleteAccount(id: string): Promise<boolean>;
    
    // Transaction operations
    getTransaction(id: string): Promise<Transaction | undefined>;
    getTransactionsByAccountId(accountId: string): Promise<Transaction[]>;
    getAllTransactions(limit?: number): Promise<Transaction[]>;
    createTransaction(transaction: InsertTransaction): Promise<Transaction>;
    
    // Enhanced queries
    getTransactionsWithDetails(limit?: number): Promise<TransactionWithDetails[]>;
    getAccountsWithStats(userId: string): Promise<AccountWithStats[]>;
    getDashboardStats(userId?: string): Promise<{
      totalAccounts: number;
      totalDeposits: number;
      totalWithdrawals: number;
      activeUsers: number;
      accountsGrowth: number;
      depositsGrowth: number;
      withdrawalsGrowth: number;
      usersGrowth: number;
    }>;
  }
  
  export class DatabaseStorage implements IStorage {
    // User operations
    async getUser(id: string): Promise<User | undefined> {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    }
  
    async getUserByUsername(username: string): Promise<User | undefined> {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    }
    
    async getUserByEmail(email: string): Promise<User | undefined> {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    }
    
    async getUsers(): Promise<User[]> {
      return db.select().from(users);
    }
  
    async createUser(data: InsertUser): Promise<User> {
      const userId = data.id || uuidv4();
      const result = await db.insert(users).values({
        ...data,
        id: userId
      }).returning();
      return result[0];
    }
    
    async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
      const result = await db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    }
    
    async deleteUser(id: string): Promise<boolean> {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    }
    
    // Account operations
    async getAccount(id: string): Promise<Account | undefined> {
      const result = await db.select().from(accounts).where(eq(accounts.id, id));
      return result[0];
    }
    
    async getAccountsByUserId(userId: string): Promise<Account[]> {
      return db.select().from(accounts).where(eq(accounts.userId, userId));
    }
    
    async createAccount(data: InsertAccount): Promise<Account> {
      const accountId = uuidv4();
      const result = await db.insert(accounts).values({
        ...data,
        id: accountId
      }).returning();
      return result[0];
    }
    
    async updateAccount(id: string, data: Partial<Account>): Promise<Account | undefined> {
      const result = await db.update(accounts)
        .set(data)
        .where(eq(accounts.id, id))
        .returning();
      return result[0];
    }
    
    async deleteAccount(id: string): Promise<boolean> {
      const result = await db.delete(accounts).where(eq(accounts.id, id)).returning();
      return result.length > 0;
    }
    
    // Transaction operations
    async getTransaction(id: string): Promise<Transaction | undefined> {
      const result = await db.select().from(transactions).where(eq(transactions.id, id));
      return result[0];
    }
    
    async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
      return db.select()
        .from(transactions)
        .where(
          or(
            eq(transactions.accountId, accountId),
            eq(transactions.destinationAccountId, accountId)
          )
        )
        .orderBy(desc(transactions.createdAt));
    }
    
    async getAllTransactions(limit?: number): Promise<Transaction[]> {
      const query = db.select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt));
        
      if (limit) {
        query.limit(limit);
      }
      
      return query;
    }
    
    async createTransaction(data: InsertTransaction): Promise<Transaction> {
      const transactionId = uuidv4();
      
      // Begin transaction
      const result = await db.transaction(async (tx) => {
        // 1. Create the transaction record
        const newTransaction = await tx.insert(transactions)
          .values({
            ...data,
            id: transactionId
          })
          .returning();
        
        // 2. Update the source account balance
        const sourceAccount = await tx.select()
          .from(accounts)
          .where(eq(accounts.id, data.accountId));
        
        if (!sourceAccount[0]) {
          throw new Error("Source account not found");
        }
        
        if (data.type === "deposit") {
          // Add amount to balance
          await tx.update(accounts)
            .set({
              balance: sql`${accounts.balance} + ${data.amount}`
            })
            .where(eq(accounts.id, data.accountId));
        } else if (data.type === "withdrawal") {
          // Check if there are sufficient funds
          if (parseFloat(sourceAccount[0].balance) < parseFloat(data.amount)) {
            throw new Error("Insufficient funds");
          }
          
          // Subtract amount from balance
          await tx.update(accounts)
            .set({
              balance: sql`${accounts.balance} - ${data.amount}`
            })
            .where(eq(accounts.id, data.accountId));
        } else if (data.type === "transfer" && data.destinationAccountId) {
          // Check if there are sufficient funds
          if (parseFloat(sourceAccount[0].balance) < parseFloat(data.amount)) {
            throw new Error("Insufficient funds");
          }
          
          // Subtract from source account
          await tx.update(accounts)
            .set({
              balance: sql`${accounts.balance} - ${data.amount}`
            })
            .where(eq(accounts.id, data.accountId));
          
          // Add to destination account
          await tx.update(accounts)
            .set({
              balance: sql`${accounts.balance} + ${data.amount}`
            })
            .where(eq(accounts.id, data.destinationAccountId));
        }
        
        return newTransaction[0];
      });
      
      return result;
    }
    
    // Enhanced queries
    async getTransactionsWithDetails(limit?: number): Promise<TransactionWithDetails[]> {
      const query = db.select({
        transaction: transactions,
        sourceAccount: accounts,
        destinationAccount: accounts
      })
      .from(transactions)
      .leftJoin(
        accounts,
        eq(transactions.accountId, accounts.id)
      )
      .leftJoin(
        accounts,
        eq(transactions.destinationAccountId, accounts.id)
      )
      .orderBy(desc(transactions.createdAt));
      
      if (limit) {
        query.limit(limit);
      }
      
      const results = await query;
      
      return results.map(result => ({
        ...result.transaction,
        accountName: result.sourceAccount?.name,
        accountNumber: result.sourceAccount?.accountNumber,
        destinationAccountName: result.destinationAccount?.name,
        destinationAccountNumber: result.destinationAccount?.accountNumber
      }));
    }
    
    async getAccountsWithStats(userId: string): Promise<AccountWithStats[]> {
      const userAccounts = await this.getAccountsByUserId(userId);
      
      // For each account, get transaction stats
      const enhancedAccounts = await Promise.all(userAccounts.map(async (account) => {
        // Get latest transaction
        const latestTransactions = await db.select()
          .from(transactions)
          .where(eq(transactions.accountId, account.id))
          .orderBy(desc(transactions.createdAt))
          .limit(1);
        
        // Count transactions
        const countResult = await db.select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.accountId, account.id));
        
        return {
          ...account,
          transactionCount: countResult[0]?.count || 0,
          lastTransaction: latestTransactions[0]?.createdAt
        };
      }));
      
      return enhancedAccounts;
    }
    
    async getDashboardStats(userId?: string): Promise<{
      totalAccounts: number;
      totalDeposits: number;
      totalWithdrawals: number;
      activeUsers: number;
      accountsGrowth: number;
      depositsGrowth: number;
      withdrawalsGrowth: number;
      usersGrowth: number;
    }> {
      // Count total accounts
      let accountsCount;
      if (userId) {
        accountsCount = await db.select({ count: sql<number>`count(*)` })
          .from(accounts)
          .where(eq(accounts.userId, userId));
      } else {
        accountsCount = await db.select({ count: sql<number>`count(*)` })
          .from(accounts);
      }
      
      // Count deposits
      let depositsCount;
      if (userId) {
        // First get the user's account IDs
        const userAccounts = await this.getAccountsByUserId(userId);
        const accountIds = userAccounts.map(a => a.id);
        
        if (accountIds.length > 0) {
          depositsCount = await db.select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(
              and(
                eq(transactions.type, "deposit"),
                inArray(transactions.accountId, accountIds)
              )
            );
        } else {
          depositsCount = [{ count: 0 }];
        }
      } else {
        depositsCount = await db.select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.type, "deposit"));
      }
      
      // Count withdrawals
      let withdrawalsCount;
      if (userId) {
        // First get the user's account IDs
        const userAccounts = await this.getAccountsByUserId(userId);
        const accountIds = userAccounts.map(a => a.id);
        
        if (accountIds.length > 0) {
          withdrawalsCount = await db.select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(
              and(
                eq(transactions.type, "withdrawal"),
                inArray(transactions.accountId, accountIds)
              )
            );
        } else {
          withdrawalsCount = [{ count: 0 }];
        }
      } else {
        withdrawalsCount = await db.select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(eq(transactions.type, "withdrawal"));
      }
      
      // Count active users (has at least one account)
      const activeUsersCount = await db.select({ count: sql<number>`count(distinct "userId")` })
        .from(accounts);
      
      // For growth calculations, we'll use random values for demo purposes
      // In a real app, we would compare current period vs previous period
      const accountsGrowth = Math.random() * 10;
      const depositsGrowth = Math.random() * 15;
      const withdrawalsGrowth = Math.random() * 8;
      const usersGrowth = Math.random() * 5;
      
      return {
        totalAccounts: accountsCount[0]?.count || 0,
        totalDeposits: depositsCount[0]?.count || 0,
        totalWithdrawals: withdrawalsCount[0]?.count || 0,
        activeUsers: activeUsersCount[0]?.count || 0,
        accountsGrowth,
        depositsGrowth,
        withdrawalsGrowth,
        usersGrowth
      };
    }
  }
  
  // Helper function for OR condition
  function or(...conditions: any[]) {
    return sql`(${conditions.map(c => `(${c})`).join(' OR ')})`;
  }
  
  export const storage = new DatabaseStorage();
  
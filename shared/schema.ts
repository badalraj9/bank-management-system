import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums as database enums
export const accountTypeEnum = pgEnum('account_type', ['Savings Account', 'Checking Account', 'Business Account', 'Fixed Deposit']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'transfer']);
export const transactionStatusEnum = pgEnum('transaction_status', ['completed', 'pending', 'failed']);

// User schema
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("displayName"),
  photoURL: text("photoURL"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Account schema
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountNumber: text("accountNumber").notNull().unique(),
  accountType: accountTypeEnum("accountType").notNull(), 
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  destinationAccountId: text("destinationAccountId").references(() => accounts.id, { onDelete: 'set null' }),
  description: text("description"),
  status: transactionStatusEnum("status").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Define relations (after all tables are defined)
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  sourceTransactions: many(transactions, { relationName: "sourceAccount" }),
  destinationTransactions: many(transactions, { relationName: "destinationAccount" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  sourceAccount: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: "sourceAccount",
  }),
  destinationAccount: one(accounts, {
    fields: [transactions.destinationAccountId],
    references: [accounts.id],
    relationName: "destinationAccount",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Extended Types for UI
export type TransactionWithDetails = Transaction & {
  accountName?: string;
  accountNumber?: string;
  destinationAccountName?: string;
  destinationAccountNumber?: string;
};

export type AccountWithStats = Account & {
  transactionCount?: number;
  lastTransaction?: Date;
};

// Enums
export enum AccountType {
  SAVINGS = "Savings Account",
  CHECKING = "Checking Account",
  BUSINESS = "Business Account",
  FIXED_DEPOSIT = "Fixed Deposit"
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer"
}

export enum TransactionStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  FAILED = "failed"
}

import { apiRequest } from './queryClient';
import type { User, Account, Transaction, TransactionWithDetails } from '@/../../shared/schema';

// Auth API functions
export async function loginUser(username: string, password: string): Promise<User> {
  return await apiRequest<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function registerUser(userData: {
  username: string;
  email: string;
  password?: string;
  displayName?: string;
}): Promise<User> {
  return await apiRequest<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function logoutUser(): Promise<void> {
  return await apiRequest<void>('/api/auth/logout', {
    method: 'POST'
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiRequest<User>('/api/auth/me');
  } catch (error) {
    return null;
  }
}

// User API functions
export async function getUsers(): Promise<User[]> {
  return await apiRequest<User[]>('/api/users');
}

export async function getUser(id: string): Promise<User> {
  return await apiRequest<User>(`/api/users/${id}`);
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  return await apiRequest<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(userData)
  });
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return await apiRequest<{ success: boolean }>(`/api/users/${id}`, {
    method: 'DELETE'
  });
}

// Account API functions
export async function getAccounts(userId: string): Promise<Account[]> {
  return await apiRequest<Account[]>(`/api/accounts?userId=${userId}`);
}

export async function getAccount(id: string): Promise<Account> {
  return await apiRequest<Account>(`/api/accounts/${id}`);
}

export async function createAccount(accountData: {
  userId: string;
  name: string;
  accountType: string;
  accountNumber?: string;
  balance?: string;
}): Promise<Account> {
  return await apiRequest<Account>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });
}

export async function updateAccount(id: string, accountData: Partial<Account>): Promise<Account> {
  return await apiRequest<Account>(`/api/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(accountData)
  });
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  return await apiRequest<{ success: boolean }>(`/api/accounts/${id}`, {
    method: 'DELETE'
  });
}

// Transaction API functions
export async function getTransactions(accountId?: string, limit?: number): Promise<Transaction[]> {
  let url = '/api/transactions';
  if (accountId) {
    url += `?accountId=${accountId}`;
  }
  if (limit) {
    url += accountId ? `&limit=${limit}` : `?limit=${limit}`;
  }
  
  return await apiRequest<Transaction[]>(url);
}

export async function getTransactionsWithDetails(limit?: number): Promise<TransactionWithDetails[]> {
  let url = '/api/transactions/details';
  if (limit) {
    url += `?limit=${limit}`;
  }
  
  return await apiRequest<TransactionWithDetails[]>(url);
}

export async function getTransaction(id: string): Promise<Transaction> {
  return await apiRequest<Transaction>(`/api/transactions/${id}`);
}

export async function createTransaction(transactionData: {
  accountId: string;
  type: string;
  amount: string;
  status: string;
  destinationAccountId?: string;
  description?: string;
}): Promise<Transaction> {
  return await apiRequest<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData)
  });
}

// Dashboard API functions
export async function getDashboardStats(userId?: string): Promise<{
  totalAccounts: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeUsers: number;
  accountsGrowth: number;
  depositsGrowth: number;
  withdrawalsGrowth: number;
  usersGrowth: number;
}> {
  let url = '/api/dashboard';
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  return await apiRequest<{
    totalAccounts: number;
    totalDeposits: number;
    totalWithdrawals: number;
    activeUsers: number;
    accountsGrowth: number;
    depositsGrowth: number;
    withdrawalsGrowth: number;
    usersGrowth: number;
  }>(url);
}
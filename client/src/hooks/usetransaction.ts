import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  getAllTransactions, 
  getTransactionsByAccountId, 
  createTransaction 
} from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { queryClient } from "@/lib/queryClient";
import { Transaction, TransactionWithDetails, InsertTransaction } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export function useTransactions() {
  const { user } = useAuth();
  
  // Get all transactions (with optional limit)
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions, 
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      return getAllTransactions(100); // Adjust limit as needed
    },
    enabled: !!user
  });
  
  // Get transactions for a specific account
  const getAccountTransactions = (accountId: string) => {
    return useQuery({
      queryKey: ['/api/transactions', accountId],
      queryFn: async () => {
        if (!accountId) return [];
        return getTransactionsByAccountId(accountId);
      },
      enabled: !!accountId && !!user
    });
  };
  
  // Get recent transactions (limited)
  const { 
    data: recentTransactions, 
    isLoading: isLoadingRecentTransactions 
  } = useQuery({
    queryKey: ['/api/transactions/recent'],
    queryFn: async () => {
      return getAllTransactions(5); // Limited to 5 most recent
    },
    enabled: !!user
  });
  
  // Create a transaction (deposit, withdrawal, or transfer)
  const createTransactionMutation = useMutation({
    mutationFn: async (newTransaction: InsertTransaction) => {
      // Generate ID if not provided
      const transactionId = newTransaction.id || uuidv4();
      
      // Create the transaction
      return createTransaction({
        ...newTransaction,
        id: transactionId
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', variables.accountId] });
      if (variables.destinationAccountId) {
        queryClient.invalidateQueries({ queryKey: ['/api/transactions', variables.destinationAccountId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });
  
  // Enhance transactions with additional data
  const enhanceTransactions = async (transactions: Transaction[]): Promise<TransactionWithDetails[]> => {
    // This would ideally fetch account information to enhance transactions
    // For the sake of this example, we'll just return the transactions as is
    return transactions as TransactionWithDetails[];
  };
  
  return {
    transactions,
    isLoadingTransactions,
    transactionsError,
    refetchTransactions,
    recentTransactions,
    isLoadingRecentTransactions,
    getAccountTransactions,
    createTransaction: createTransactionMutation.mutate,
    isCreatingTransaction: createTransactionMutation.isPending,
    enhanceTransactions
  };
}

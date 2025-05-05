import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  getAccountsByUserId, 
  getAccountById, 
  createAccount, 
  updateAccount, 
  deleteAccount 
} from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { queryClient } from "@/lib/queryClient";
import { Account, InsertAccount } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export function useAccounts() {
  const { user } = useAuth();
  
  // Get all accounts for the current user
  const { 
    data: accounts, 
    isLoading: isLoadingAccounts, 
    error: accountsError,
    refetch: refetchAccounts
  } = useQuery({
    queryKey: ['/api/accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getAccountsByUserId(user.id);
    },
    enabled: !!user
  });
  
  // Get a single account by ID
  const getAccount = (accountId: string) => {
    return useQuery({
      queryKey: ['/api/accounts', accountId],
      queryFn: async () => {
        if (!accountId) return null;
        return getAccountById(accountId);
      },
      enabled: !!accountId
    });
  };
  
  // Create a new account
  const createAccountMutation = useMutation({
    mutationFn: async (newAccount: InsertAccount) => {
      if (!user) throw new Error("User not authenticated");
      
      const accountId = uuidv4();
      
      // Create the account with the provided data
      return createAccount({
        ...newAccount,
        id: accountId,
        userId: user.id
      });
    },
    onSuccess: () => {
      // Invalidate accounts queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });
  
  // Update an existing account
  const updateAccountMutation = useMutation({
    mutationFn: async ({ accountId, data }: { accountId: string; data: Partial<Account> }) => {
      return updateAccount(accountId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific account query and the accounts list
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });
  
  // Delete an account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return deleteAccount(accountId);
    },
    onSuccess: () => {
      // Invalidate all account queries
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });
  
  return {
    accounts,
    isLoadingAccounts,
    accountsError,
    refetchAccounts,
    getAccount,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isCreatingAccount: createAccountMutation.isPending,
    isUpdatingAccount: updateAccountMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending
  };
}

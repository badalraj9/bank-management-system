import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import DashboardStats from "@/components/DashboardStats";
import RecentTransactionsTable from "@/components/RecentTransactionsTable";
import QuickActions from "@/components/QuickActions";
import RecentAccounts from "@/components/RecentAccounts";
import AIFinancialInsights from "@/components/AIFinancialInsights";
import { getDashboardStats, getTransactionsWithDetails, getAccounts, getTransactions } from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch dashboard stats
  const { 
    data: dashboardStats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['/api/dashboard', user?.id],
    queryFn: async () => {
      return getDashboardStats(user?.id);
    },
    enabled: !!user
  });
  
  // Fetch recent transactions
  const { 
    data: recentTransactions, 
    isLoading: transactionsLoading 
  } = useQuery({
    queryKey: ['/api/transactions/recent'],
    queryFn: async () => {
      const transactions = await getTransactionsWithDetails(5); // Fetch only 5 for recent transactions
      return transactions;
    },
    enabled: !!user
  });
  
  // Fetch recent accounts
  const { 
    data: recentAccounts, 
    isLoading: accountsLoading 
  } = useQuery({
    queryKey: ['/api/accounts/recent', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const accounts = await getAccounts(user.id);
      return accounts.slice(0, 4); // Get only the first 4 accounts
    },
    enabled: !!user
  });
  
  // Fetch all transactions for AI insights
  const { 
    data: allTransactions, 
    isLoading: allTransactionsLoading 
  } = useQuery({
    queryKey: ['/api/transactions/all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get all transactions (up to a reasonable limit) for analysis
      return getTransactions();
    },
    enabled: !!user
  });
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Dashboard Summary Cards */}
      <DashboardStats data={dashboardStats} loading={statsLoading} />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <RecentTransactionsTable 
            transactions={recentTransactions} 
            loading={transactionsLoading}
            totalCount={24} // This would come from an API in a real app
          />
        </div>
        
        {/* Quick Actions and Recent Accounts */}
        <div className="space-y-6">
          <QuickActions />
          <RecentAccounts accounts={recentAccounts} loading={accountsLoading} />
        </div>
      </div>
      
      {/* AI Financial Insights */}
      <div className="mb-6">
        <AIFinancialInsights 
          transactions={allTransactions} 
          loading={allTransactionsLoading} 
        />
      </div>
    </div>
  );
}


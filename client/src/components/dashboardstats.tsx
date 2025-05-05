import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard, ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/decimal";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  data: {
    totalAccounts: number;
    totalDeposits: number;
    totalWithdrawals: number;
    activeUsers: number;
    accountsGrowth: number;
    depositsGrowth: number;
    withdrawalsGrowth: number;
    usersGrowth: number;
  } | undefined;
  loading: boolean;
}

export default function DashboardStats({ data, loading }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Accounts */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 font-medium">Total Accounts</h3>
            <div className="p-2 bg-blue-100 rounded-full">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {data?.totalAccounts || 0}
            </p>
          )}
          
          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{data?.accountsGrowth || 0}%</span> since last month
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Total Deposits */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 font-medium">Total Deposits</h3>
            <div className="p-2 bg-green-100 rounded-full">
              <ArrowDownRight className="h-5 w-5 text-green-500" />
            </div>
          </div>
          
          {loading ? (
            <Skeleton className="h-8 w-36 mt-2" />
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {formatCurrency(data?.totalDeposits || 0)}
            </p>
          )}
          
          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{data?.depositsGrowth || 0}%</span> since last month
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Total Withdrawals */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 font-medium">Total Withdrawals</h3>
            <div className="p-2 bg-red-100 rounded-full">
              <ArrowUpRight className="h-5 w-5 text-red-500" />
            </div>
          </div>
          
          {loading ? (
            <Skeleton className="h-8 w-36 mt-2" />
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {formatCurrency(data?.totalWithdrawals || 0)}
            </p>
          )}
          
          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-xs text-red-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{data?.withdrawalsGrowth || 0}%</span> since last month
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Active Users */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-700 font-medium">Active Users</h3>
            <div className="p-2 bg-cyan-100 rounded-full">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {data?.activeUsers || 0}
            </p>
          )}
          
          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{data?.usersGrowth || 0}%</span> since last month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

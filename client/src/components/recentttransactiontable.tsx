import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, User, Building, ArrowDown, ArrowUp, RefreshCw, Home } from "lucide-react";
import { formatCurrency } from "@/lib/decimal";
import { TransactionWithDetails, TransactionType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useState } from "react";

interface RecentTransactionsTableProps {
  transactions: TransactionWithDetails[] | undefined;
  loading: boolean;
  totalCount?: number;
}

export default function RecentTransactionsTable({ 
  transactions, 
  loading,
  totalCount = 0
}: RecentTransactionsTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  const getIconByAccountName = (accountName: string) => {
    if (accountName.includes("Corp") || accountName.includes("Inc")) {
      return <Building className="h-4 w-4" />;
    } else if (accountName.includes("Properties") || accountName.includes("Estate")) {
      return <Home className="h-4 w-4" />;
    } else {
      return <User className="h-4 w-4" />;
    }
  };
  
  const getAvatarColorByAccountName = (accountName: string) => {
    if (accountName.includes("Corp") || accountName.includes("Inc")) {
      return "bg-purple-100 text-purple-600";
    } else if (accountName.includes("Properties") || accountName.includes("Estate")) {
      return "bg-green-100 text-green-600";
    } else {
      return "bg-blue-100 text-blue-600";
    }
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDown className="h-4 w-4 mr-2 text-emerald-600" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUp className="h-4 w-4 mr-2 text-red-600" />;
      case TransactionType.TRANSFER:
        return <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />;
      default:
        return <RefreshCw className="h-4 w-4 mr-2" />;
    }
  };
  
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "text-emerald-600";
      case TransactionType.WITHDRAWAL:
        return "text-red-600";
      case TransactionType.TRANSFER:
        return "text-blue-600";
      default:
        return "";
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600";
      case "pending":
        return "bg-amber-100 text-amber-600";
      case "failed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  const formatDate = (date: Date | string | object) => {
    if (!date) return "N/A";
    
    // Handle Firebase Timestamp objects
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
      date = (date as any).toDate();
    }
    
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Check if date is yesterday
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Otherwise return month day, time
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };
  
  // For loading state
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-200 py-4">
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="link" className="text-primary p-0">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="py-3 px-4 text-left font-medium">Account</th>
                  <th className="py-3 px-4 text-left font-medium">Type</th>
                  <th className="py-3 px-4 text-left font-medium">Amount</th>
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="link" className="text-primary p-0">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="py-3 px-4 text-left font-medium">Account</th>
                <th className="py-3 px-4 text-left font-medium">Type</th>
                <th className="py-3 px-4 text-left font-medium">Amount</th>
                <th className="py-3 px-4 text-left font-medium">Date</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Avatar className={`h-8 w-8 mr-3 ${getAvatarColorByAccountName(transaction.accountName || "User")}`}>
                          <AvatarFallback>
                            {getIconByAccountName(transaction.accountName || "User")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{transaction.accountName || "User"}</p>
                          <p className="text-xs text-gray-500">
                            **** {transaction.accountNumber?.slice(-4) || "0000"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${getTransactionTypeColor(transaction.type)}`}>
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      {totalCount > pageSize && (
        <CardFooter className="border-t border-gray-200 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{Math.min(pageSize, transactions?.length || 0)}</span> of <span className="font-medium">{totalCount}</span> transactions
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant={page === 1 ? "default" : "outline"}
              className="w-8 h-8 p-0"
              onClick={() => setPage(1)}
            >
              1
            </Button>
            
            {totalCount > pageSize * 2 && (
              <Button
                variant={page === 2 ? "default" : "outline"}
                className="w-8 h-8 p-0"
                onClick={() => setPage(2)}
              >
                2
              </Button>
            )}
            
            {totalCount > pageSize * 3 && (
              <Button
                variant={page === 3 ? "default" : "outline"}
                className="w-8 h-8 p-0"
                onClick={() => setPage(3)}
              >
                3
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.min(Math.ceil(totalCount / pageSize), page + 1))}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

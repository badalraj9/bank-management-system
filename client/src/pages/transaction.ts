import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTransactionsWithDetails, getAccounts } from "@/lib/api";
import { 
  ArrowDown, 
  ArrowUp, 
  RefreshCw, 
  Search, 
  User, 
  Building, 
  Home, 
  Filter,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionWithDetails, TransactionType, TransactionStatus } from "@shared/schema";
import { formatCurrency } from "@/lib/decimal";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export default function Transactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch all transactions
  const { 
    data: transactions, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    queryFn: async () => {
      return await getTransactionsWithDetails();
    },
    enabled: !!user
  });
  
  // Fetch accounts for the filter
  const { 
    data: accounts 
  } = useQuery({
    queryKey: ['/api/accounts/list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getAccounts(user.id);
    },
    enabled: !!user
  });
  
  // Filter transactions
  const filteredTransactions = transactions?.filter(transaction => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (transaction.accountName?.toLowerCase().includes(searchLower)) ||
      (transaction.accountNumber?.includes(searchTerm)) ||
      (transaction.description?.toLowerCase().includes(searchLower));
    
    // Transaction type filter
    const matchesType = !transactionType || transaction.type === transactionType;
    
    // Status filter
    const matchesStatus = !status || transaction.status === status;
    
    // Account filter
    const matchesAccount = !accountId || transaction.accountId === accountId;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      
      let createdAtDate: Date;
      if (typeof transaction.createdAt === 'object' && transaction.createdAt !== null && 'toDate' in transaction.createdAt) {
        createdAtDate = (transaction.createdAt as any).toDate();
      } else {
        createdAtDate = new Date(transaction.createdAt);
      }
      
      if (createdAtDate < from) {
        matchesDateRange = false;
      }
    }
    
    if (dateRange?.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      
      let createdAtDate: Date;
      if (typeof transaction.createdAt === 'object' && transaction.createdAt !== null && 'toDate' in transaction.createdAt) {
        createdAtDate = (transaction.createdAt as any).toDate();
      } else {
        createdAtDate = new Date(transaction.createdAt);
      }
      
      if (createdAtDate > to) {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesAccount && matchesDateRange;
  });
  
  // Paginate transactions
  const paginatedTransactions = filteredTransactions?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, transactionType, status, accountId, dateRange]);
  
  // Icons and helpers
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
  
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    
    const d = new Date(date);
    
    // Format date as MM/DD/YYYY, HH:MM AM/PM
    return d.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setTransactionType(null);
    setStatus(null);
    setAccountId(null);
    setDateRange(undefined);
    setPage(1);
  };
  
  // Calculate totals for tabs
  const totals = {
    all: filteredTransactions?.length || 0,
    deposits: filteredTransactions?.filter(t => t.type === TransactionType.DEPOSIT).length || 0,
    withdrawals: filteredTransactions?.filter(t => t.type === TransactionType.WITHDRAWAL).length || 0,
    transfers: filteredTransactions?.filter(t => t.type === TransactionType.TRANSFER).length || 0
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-500">View and manage all transaction activities</p>
        </div>
      </div>
      
      <Card className="border border-gray-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Transaction Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={accountId || ""} onValueChange={(value) => setAccountId(value || null)}>
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Accounts</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (*{account.accountNumber.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={status || ""} onValueChange={(value) => setStatus(value || null)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {Object.values(TransactionStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DateRangePicker 
              date={dateRange} 
              onChange={setDateRange} 
              placeholder="Filter by date" 
            />
          </div>
          
          <div className="flex justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  Transaction Type
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                  checked={transactionType === null}
                  onCheckedChange={() => setTransactionType(null)}
                >
                  All Types
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={transactionType === TransactionType.DEPOSIT}
                  onCheckedChange={() => setTransactionType(TransactionType.DEPOSIT)}
                >
                  <ArrowDown className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  Deposits
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={transactionType === TransactionType.WITHDRAWAL}
                  onCheckedChange={() => setTransactionType(TransactionType.WITHDRAWAL)}
                >
                  <ArrowUp className="h-3.5 w-3.5 mr-2 text-red-600" />
                  Withdrawals
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={transactionType === TransactionType.TRANSFER}
                  onCheckedChange={() => setTransactionType(TransactionType.TRANSFER)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  Transfers
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">
            All ({totals.all})
          </TabsTrigger>
          <TabsTrigger 
            value="deposits"
            onClick={() => setTransactionType(TransactionType.DEPOSIT)}
          >
            Deposits ({totals.deposits})
          </TabsTrigger>
          <TabsTrigger 
            value="withdrawals"
            onClick={() => setTransactionType(TransactionType.WITHDRAWAL)}
          >
            Withdrawals ({totals.withdrawals})
          </TabsTrigger>
          <TabsTrigger 
            value="transfers"
            onClick={() => setTransactionType(TransactionType.TRANSFER)}
          >
            Transfers ({totals.transfers})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <TransactionsList 
            transactions={paginatedTransactions}
            loading={isLoading}
            error={error}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            totalCount={filteredTransactions?.length || 0}
            formatDate={formatDate}
            getIconByAccountName={getIconByAccountName}
            getAvatarColorByAccountName={getAvatarColorByAccountName}
            getTransactionIcon={getTransactionIcon}
            getTransactionTypeColor={getTransactionTypeColor}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        </TabsContent>
        
        <TabsContent value="deposits" className="mt-0">
          <TransactionsList 
            transactions={paginatedTransactions}
            loading={isLoading}
            error={error}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            totalCount={filteredTransactions?.length || 0}
            formatDate={formatDate}
            getIconByAccountName={getIconByAccountName}
            getAvatarColorByAccountName={getAvatarColorByAccountName}
            getTransactionIcon={getTransactionIcon}
            getTransactionTypeColor={getTransactionTypeColor}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        </TabsContent>
        
        <TabsContent value="withdrawals" className="mt-0">
          <TransactionsList 
            transactions={paginatedTransactions}
            loading={isLoading}
            error={error}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            totalCount={filteredTransactions?.length || 0}
            formatDate={formatDate}
            getIconByAccountName={getIconByAccountName}
            getAvatarColorByAccountName={getAvatarColorByAccountName}
            getTransactionIcon={getTransactionIcon}
            getTransactionTypeColor={getTransactionTypeColor}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        </TabsContent>
        
        <TabsContent value="transfers" className="mt-0">
          <TransactionsList 
            transactions={paginatedTransactions}
            loading={isLoading}
            error={error}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            totalCount={filteredTransactions?.length || 0}
            formatDate={formatDate}
            getIconByAccountName={getIconByAccountName}
            getAvatarColorByAccountName={getAvatarColorByAccountName}
            getTransactionIcon={getTransactionIcon}
            getTransactionTypeColor={getTransactionTypeColor}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransactionsListProps {
  transactions: TransactionWithDetails[] | undefined;
  loading: boolean;
  error: unknown;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  totalCount: number;
  formatDate: (date: any) => string;
  getIconByAccountName: (accountName: string) => JSX.Element;
  getAvatarColorByAccountName: (accountName: string) => string;
  getTransactionIcon: (type: string) => JSX.Element;
  getTransactionTypeColor: (type: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

function TransactionsList({
  transactions,
  loading,
  error,
  page,
  setPage,
  pageSize,
  totalCount,
  formatDate,
  getIconByAccountName,
  getAvatarColorByAccountName,
  getTransactionIcon,
  getTransactionTypeColor,
  getStatusBadgeColor,
}: TransactionsListProps) {
  const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
  
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading transactions. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No transactions found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or create a new transaction
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className={`h-8 w-8 mr-3 ${getAvatarColorByAccountName(transaction.accountName || "User")}`}>
                        <AvatarFallback>
                          {getIconByAccountName(transaction.accountName || "User")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{transaction.accountName || "Unknown"}</p>
                        <p className="text-xs text-gray-500">
                          **** {transaction.accountNumber?.slice(-4) || "0000"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={getTransactionTypeColor(transaction.type)}>
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <span className="capitalize">{transaction.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {transaction.description || "-"}
                    </div>
                    
                    {transaction.type === TransactionType.TRANSFER && transaction.destinationAccountName && (
                      <p className="text-xs text-gray-500">
                        To: {transaction.destinationAccountName} (*{transaction.destinationAccountNumber?.slice(-4) || "0000"})
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex-1 text-sm text-gray-500">
              Showing <span className="font-medium">{Math.min(pageSize, transactions.length)}</span> of{" "}
              <span className="font-medium">{totalCount}</span> transactions
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <span className="sr-only">Previous Page</span>
                &lt;
              </Button>
              
              {[...Array(Math.min(3, maxPage))].map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={i}
                    variant={pageNumber === page ? "default" : "outline"}
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              
              {maxPage > 3 && page <= 3 && (
                <>
                  <span className="flex items-center px-2">...</span>
                  <Button
                    variant="outline"
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(maxPage)}
                  >
                    {maxPage}
                  </Button>
                </>
              )}
              
              {maxPage > 3 && page > 3 && (
                <>
                  <span className="flex items-center px-2">...</span>
                  <Button
                    variant={page === maxPage ? "default" : "outline"}
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(maxPage)}
                  >
                    {maxPage}
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.min(maxPage, page + 1))}
                disabled={page >= maxPage}
              >
                <span className="sr-only">Next Page</span>
                &gt;
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

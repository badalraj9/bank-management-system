import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Building, Home } from "lucide-react";
import { formatCurrency } from "@/lib/decimal";
import { Account } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface RecentAccountsProps {
  accounts: Account[] | undefined;
  loading: boolean;
}

export default function RecentAccounts({ accounts, loading }: RecentAccountsProps) {
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
  
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-200 py-4">
          <div className="flex justify-between items-center">
            <CardTitle>Recent Accounts</CardTitle>
            <Link href="/accounts">
              <Button variant="link" className="text-primary p-0">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex justify-between items-center">
          <CardTitle>Recent Accounts</CardTitle>
          <Link href="/accounts">
            <Button variant="link" className="text-primary p-0">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {accounts && accounts.length > 0 ? (
            accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className={`h-8 w-8 mr-3 ${getAvatarColorByAccountName(account.name)}`}>
                      <AvatarFallback>
                        {getIconByAccountName(account.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.accountType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(account.balance)}</p>
                    <p className="text-xs text-gray-500">
                      **** {account.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No accounts found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

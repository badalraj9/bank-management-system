import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { Account } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/decimal";
import { Plus, Search, MoreHorizontal, Building, User, Home, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import NewAccountModal from "@/components/modals/NewAccountModal";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getAccounts, deleteAccount } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Accounts() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Fetch user accounts
  const { 
    data: accounts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getAccounts(user.id);
    },
    enabled: !!user
  });
  
  const filteredAccounts = accounts?.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm)
  );
  
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: "Account deleted",
        description: `${accountToDelete.name} has been deleted successfully.`,
      });
      
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete the account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getIconByAccountName = (accountName: string) => {
    if (accountName.includes("Corp") || accountName.includes("Inc")) {
      return <Building className="h-6 w-6" />;
    } else if (accountName.includes("Properties") || accountName.includes("Estate")) {
      return <Home className="h-6 w-6" />;
    } else {
      return <User className="h-6 w-6" />;
    }
  };
  
  const getIconColorByAccountName = (accountName: string) => {
    if (accountName.includes("Corp") || accountName.includes("Inc")) {
      return "text-purple-600";
    } else if (accountName.includes("Properties") || accountName.includes("Estate")) {
      return "text-green-600";
    } else {
      return "text-blue-600";
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Accounts</h1>
          <p className="text-gray-500">Manage your bank accounts</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setNewAccountOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Account
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border border-gray-200">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading accounts. Please try again later.</p>
          </CardContent>
        </Card>
      ) : filteredAccounts && filteredAccounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="border border-gray-200 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className={`mr-2 ${getIconColorByAccountName(account.name)}`}>
                      {getIconByAccountName(account.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription>{account.accountType}</CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() => {
                          setAccountToDelete(account);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 mb-4">
                  <p className="text-3xl font-bold text-gray-800">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Account #: {account.accountNumber}</p>
                  <p>Created: {new Date(account.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
                <Button variant="outline" size="sm">View Details</Button>
                <Button variant="outline" size="sm">Transactions</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            {searchTerm ? (
              <>
                <Search className="h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No accounts found</h3>
                <p className="text-gray-500">
                  No accounts match your search for "{searchTerm}"
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <Building className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No accounts yet</h3>
                <p className="text-gray-500">Create your first account to get started</p>
                <Button 
                  className="mt-4"
                  onClick={() => setNewAccountOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      <NewAccountModal
        open={newAccountOpen}
        setOpen={setNewAccountOpen}
        onSuccess={() => {
          toast({
            title: "Account created",
            description: "The new account has been created successfully.",
          });
        }}
      />
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {accountToDelete && (
            <div className="py-4">
              <p className="font-medium text-gray-700">{accountToDelete.name}</p>
              <p className="text-sm text-gray-500">{accountToDelete.accountType}</p>
              <p className="text-sm text-gray-500">Balance: {formatCurrency(accountToDelete.balance)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

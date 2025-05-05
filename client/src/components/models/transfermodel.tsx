import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/providers/AuthProvider";
import { getAccountsByUserId, createTransaction, getAccountById } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, parseCurrency, hasSufficientFunds } from "@/lib/decimal";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

interface TransferModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function TransferModal({ open, setOpen, onSuccess }: TransferModalProps) {
  const { user } = useAuth();
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Fetch user accounts
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getAccountsByUserId(user.id);
    },
    enabled: !!user
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSourceAccountId("");
      setDestinationAccountId("");
      setAmount("");
      setDescription("");
    }
  }, [open]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  const handleAmountBlur = () => {
    try {
      const formatted = formatCurrency(parseCurrency(amount));
      setAmount(formatted.replace(/[^0-9.]/g, ''));
    } catch (error) {
      setAmount('0.00');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceAccountId) {
      toast({
        title: "Error",
        description: "Please select a source account.",
        variant: "destructive",
      });
      return;
    }
    
    if (!destinationAccountId) {
      toast({
        title: "Error",
        description: "Please select a destination account.",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceAccountId === destinationAccountId) {
      toast({
        title: "Error",
        description: "Source and destination accounts cannot be the same.",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount greater than zero.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Check if source account has sufficient funds
      const sourceAccount = await getAccountById(sourceAccountId);
      if (!sourceAccount) {
        throw new Error("Source account not found");
      }
      
      if (!hasSufficientFunds(sourceAccount.balance, amount)) {
        toast({
          title: "Insufficient funds",
          description: `The source account only has ${formatCurrency(sourceAccount.balance)} available.`,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Create transfer transaction
      await createTransaction({
        id: uuidv4(),
        accountId: sourceAccountId,
        type: "transfer",
        amount,
        destinationAccountId,
        description: description || "Transfer",
        status: "completed"
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Close modal and notify success
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error making transfer:", error);
      toast({
        title: "Error",
        description: "Failed to process the transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const sourceAccount = accounts?.find(acc => acc.id === sourceAccountId);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>
            Transfer money between your accounts.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceAccount">From Account</Label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts && accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.accountType} (*{account.accountNumber.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {sourceAccount && (
              <p className="text-sm text-gray-500">
                Available balance: {formatCurrency(sourceAccount.balance)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destinationAccount">To Account</Label>
            <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts && accounts.map((account) => (
                  <SelectItem 
                    key={account.id} 
                    value={account.id}
                    disabled={account.id === sourceAccountId}
                  >
                    {account.name} - {account.accountType} (*{account.accountNumber.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <Input
                id="amount"
                className="pl-7"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this transfer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || isLoading}>
              {submitting ? "Processing..." : "Transfer Funds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from "react";
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
import { getAccountsByUserId, createTransaction } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, parseCurrency } from "@/lib/decimal";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

interface DepositModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function DepositModal({ open, setOpen, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState("");
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
    
    if (!accountId) {
      toast({
        title: "Error",
        description: "Please select an account.",
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
      // Create transaction
      await createTransaction({
        id: uuidv4(),
        accountId,
        type: "deposit",
        amount,
        description: description || "Deposit",
        status: "completed"
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Reset form
      setAccountId("");
      setAmount("");
      setDescription("");
      
      // Close modal and notify success
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error making deposit:", error);
      toast({
        title: "Error",
        description: "Failed to process the deposit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Deposit</DialogTitle>
          <DialogDescription>
            Select an account and enter the amount you want to deposit.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts && accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
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
              placeholder="Add a note about this deposit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || isLoading}>
              {submitting ? "Processing..." : "Make Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

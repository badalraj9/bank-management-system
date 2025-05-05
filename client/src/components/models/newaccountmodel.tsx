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
import { AccountType, insertAccountSchema } from "@shared/schema";
import { createAccount } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { v4 as uuidv4 } from "uuid";
import { parseCurrency, formatCurrency } from "@/lib/decimal";
import { queryClient } from "@/lib/queryClient";

interface NewAccountModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const formSchema = insertAccountSchema.extend({
  initialDeposit: z.string().min(1, "Initial deposit is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 digits")
});

type FormData = z.infer<typeof formSchema>;

export default function NewAccountModal({ open, setOpen, onSuccess }: NewAccountModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id || "",
      name: "",
      accountType: AccountType.SAVINGS,
      initialDeposit: "0.00",
      email: user?.email || "",
      phone: "",
      accountNumber: "",
      balance: "0"
    }
  });
  
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      // Generate account number
      const accountNumber = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Parse initial deposit
      const initialDepositAmount = parseCurrency(data.initialDeposit).toString();
      
      // Create the account
      const newAccount = await createAccount({
        userId: user.id,
        name: data.name,
        accountType: data.accountType,
        accountNumber: accountNumber,
        balance: initialDepositAmount,
      });
      
      // Create initial deposit transaction if amount > 0
      if (parseFloat(initialDepositAmount) > 0) {
        await createAccount({
          id: uuidv4(),
          accountId: newAccount.id,
          type: "deposit",
          amount: initialDepositAmount,
          description: "Initial deposit",
          status: "completed"
        });
      }
      
      // Invalidate account queries
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      
      // Clear form
      form.reset();
      
      // Close modal and notify success
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Fill in the account information below to create a new bank account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AccountType).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initialDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Deposit Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <Input 
                        className="pl-7" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          field.onChange(value);
                        }}
                        onBlur={(e) => {
                          try {
                            const formatted = formatCurrency(parseCurrency(e.target.value));
                            field.onChange(formatted.replace(/[^0-9.]/g, ''));
                          } catch (error) {
                            field.onChange('0.00');
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

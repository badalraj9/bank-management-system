import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowUp, ArrowDown, Lightbulb, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Transaction, TransactionType } from "@shared/schema";
import { formatCurrency } from "@/lib/decimal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIFinancialInsightsProps {
  transactions: Transaction[] | undefined;
  loading: boolean;
}

export default function AIFinancialInsights({ transactions, loading }: AIFinancialInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [spendingTrend, setSpendingTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [savingsTip, setSavingsTip] = useState<string>("");

  // Generate insights based on transaction data
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;
    
    // Helper function to get recent transactions (last 30 days)
    const getRecentTransactions = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return transactions.filter(t => {
        const date = new Date(t.createdAt);
        return date >= thirtyDaysAgo;
      });
    };

    const recentTransactions = getRecentTransactions();
    
    // Get withdrawals and deposits
    const withdrawals = recentTransactions.filter(t => t.type === TransactionType.WITHDRAWAL);
    const deposits = recentTransactions.filter(t => t.type === TransactionType.DEPOSIT);
    
    // Calculate total withdrawal and deposit amounts
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDeposits = deposits.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Group transactions by day
    const transactionsByDay = recentTransactions.reduce((acc, t) => {
      const date = new Date(t.createdAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
    
    // Detect spending patterns
    const newInsights: string[] = [];
    const newAnomalies: string[] = [];
    
    // 1. Check spending vs income
    if (totalWithdrawals > totalDeposits) {
      newInsights.push(`You've spent ${formatCurrency(totalWithdrawals - totalDeposits)} more than you've earned in the last 30 days.`);
      setSpendingTrend('up');
    } else if (totalDeposits > totalWithdrawals) {
      newInsights.push(`You've saved ${formatCurrency(totalDeposits - totalWithdrawals)} in the last 30 days.`);
      setSpendingTrend('down');
    } else {
      newInsights.push("Your income and spending are balanced this month.");
      setSpendingTrend('stable');
    }
    
    // 2. Check for days with unusually high spending
    const avgDailySpending = totalWithdrawals / Object.keys(transactionsByDay).length || 0;
    
    Object.entries(transactionsByDay).forEach(([date, txs]) => {
      const dailyWithdrawals = txs.filter(t => t.type === TransactionType.WITHDRAWAL);
      const dailyTotal = dailyWithdrawals.reduce((sum, t) => sum + Number(t.amount), 0);
      
      if (dailyTotal > avgDailySpending * 2 && dailyTotal > 100) {
        newAnomalies.push(`Unusually high spending of ${formatCurrency(dailyTotal)} on ${date}`);
      }
    });
    
    // 3. Find the largest transaction
    if (withdrawals.length > 0) {
      const largestWithdrawal = withdrawals.reduce((max, t) => 
        Number(t.amount) > Number(max.amount) ? t : max, withdrawals[0]);
      
      newInsights.push(`Your largest expense was ${formatCurrency(largestWithdrawal.amount)} on ${new Date(largestWithdrawal.createdAt).toLocaleDateString()}.`);
    }
    
    // Set random savings tip
    const savingsTips = [
      "Try the 50/30/20 rule: 50% on needs, 30% on wants, and 20% on savings.",
      "Setting up automatic transfers to savings can help build your emergency fund.",
      "Review your subscriptions monthly and cancel those you don't use regularly.",
      "Consider using the 24-hour rule before making large purchases to avoid impulse buying.",
      "Meal planning and cooking at home can significantly reduce food expenses."
    ];
    
    setSavingsTip(savingsTips[Math.floor(Math.random() * savingsTips.length)]);
    setInsights(newInsights);
    setAnomalies(newAnomalies);
    
  }, [transactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription><span><Skeleton className="h-4 w-full" /></span></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Financial Insights
          </CardTitle>
          <CardDescription>Smart analysis of your financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-gray-500">
            <Lightbulb className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>Not enough transaction data to generate insights.</p>
            <p className="text-sm mt-2">Complete some transactions to see AI-powered financial analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          Smart Financial Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of your financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-2 pt-2">
            {spendingTrend === 'up' ? (
              <TrendingUp className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
            ) : spendingTrend === 'down' ? (
              <TrendingDown className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-medium">Spending Trend</h4>
              <ul className="text-sm text-gray-600 mt-1">
                {insights.map((insight, i) => (
                  <li key={i} className="mb-1">{insight}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {anomalies.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unusual Activity Detected</AlertTitle>
              <AlertDescription>
                <ul className="text-sm mt-1">
                  {anomalies.map((anomaly, i) => (
                    <li key={i}>{anomaly}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="bg-primary/10 border border-primary/20">
            <Lightbulb className="h-4 w-4 text-primary" />
            <AlertTitle>Money-Saving Tip</AlertTitle>
            <AlertDescription className="text-sm">{savingsTip}</AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
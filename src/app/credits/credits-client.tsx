'use client';

import { useState, useMemo } from 'react';
import { useRequireAuth } from '@/features/auth/hooks';
import { useCredits } from '@/hooks/use-credits';
import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { createCreditsService } from '@/services';
import { purchaseCredits } from '@/app/actions';
import { CREDIT_PACKAGES, CREDIT_COSTS, CREDIT_ACTION_LABELS } from '@/lib/credits';
import type { CreditTransaction } from '@/lib/credits';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Coins, Zap, ArrowLeft, Check, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CreditsClient() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const { balance, isLoading: isCreditsLoading } = useCredits();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const creditsService = useMemo(() => createCreditsService(firestore), [firestore]);

  const transactionsQuery = useMemoFirebase(
    () => (user ? creditsService.getTransactionsQuery(user.uid) : null),
    [user, creditsService]
  );
  const { data: transactions } = useCollection<CreditTransaction>(transactionsQuery);

  const handlePurchase = async (packageId: string, credits: number) => {
    if (!user) return;
    setPurchasingId(packageId);
    try {
      const idToken = await auth.currentUser?.getIdToken() ?? '';
      const result = await purchaseCredits(idToken, packageId);
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }
      toast({
        title: `${credits} credits added!`,
        description: `Your new balance is ${result.data?.newBalance} credits.`,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        variant: 'destructive',
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Could not complete the purchase. Please try again.',
      });
    } finally {
      setPurchasingId(null);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px] p-4 md:p-8 mt-[60px] max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-muted-foreground mt-1">
          Credits power your AI brand generation. Each action has a cost.
        </p>
      </div>

      {/* Current Balance */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold">
                {isCreditsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin inline" />
                ) : (
                  balance
                )}
                <span className="text-base font-normal text-muted-foreground ml-1">credits</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <h2 className="text-lg font-semibold mb-4">Buy Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative ${pkg.popular ? 'border-primary shadow-md' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">{pkg.label}</CardTitle>
              <CardDescription>{pkg.credits} credits</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <span className="text-3xl font-bold">${pkg.price}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ${(pkg.price / pkg.credits).toFixed(2)}/credit
              </p>
              <Button
                onClick={() => handlePurchase(pkg.id, pkg.credits)}
                disabled={purchasingId !== null}
                className="w-full"
                variant={pkg.popular ? 'default' : 'outline'}
              >
                {purchasingId === pkg.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Buy {pkg.credits} Credits
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost Table */}
      <h2 className="text-lg font-semibold mb-4">Credit Costs</h2>
      <Card className="mb-8">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Action</th>
                <th className="text-right text-sm font-medium text-muted-foreground p-4">Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                <tr key={action} className="border-b last:border-0">
                  <td className="p-4 text-sm">
                    {CREDIT_ACTION_LABELS[action as keyof typeof CREDIT_ACTION_LABELS]}
                  </td>
                  <td className="p-4 text-sm text-right font-mono">
                    {cost} credits
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <Card>
        <CardContent className="p-0">
          {!transactions || transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Buy credits or generate something to get started.
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${tx.amount > 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {tx.amount > 0 ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {tx.balance} credits
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-mono font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

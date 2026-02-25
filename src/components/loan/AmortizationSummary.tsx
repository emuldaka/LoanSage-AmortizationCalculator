'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, calculateMonthlyPayment } from '@/lib/amortization';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import { addMonths, format } from 'date-fns';

type AmortizationSummaryProps = {
  schedule: AmortizationPeriod[];
  loanData: LoanData;
};

export default function AmortizationSummary({
  schedule,
  loanData,
}: AmortizationSummaryProps) {
  if (schedule.length === 0) {
    return <p>No summary to display.</p>;
  }

  const lastPayment = schedule[schedule.length - 1];
  const totalPrincipal = loanData.principal;
  const totalInterest = lastPayment.totalInterest;
  const totalPayments = totalPrincipal + totalInterest;
  const startDate = loanData.startDate ? new Date(loanData.startDate) : new Date();
  const payoffDate = addMonths(startDate, lastPayment.month);
  const totalMonths = lastPayment.month;
  const originalTermMonths = loanData.termInYears * 12;

  // Calculate the original monthly payment based on initial loan terms. This is the correct base payment.
  const originalMonthlyPayment = calculateMonthlyPayment(loanData.principal, loanData.interestRate, loanData.termInYears);

  const summaryItems = [
    // Use the calculated original monthly payment for display for consistency.
    { label: 'Regular Monthly Payment', value: formatCurrency(originalMonthlyPayment) },
    { label: 'Total Principal', value: formatCurrency(totalPrincipal) },
    { label: 'Total Interest', value: formatCurrency(totalInterest) },
    { label: 'Total Payments', value: formatCurrency(totalPayments) },
    { label: 'Payoff Date', value: format(payoffDate, 'MMMM yyyy') },
    { label: 'Loan Term', value: `${totalMonths} months (${(totalMonths/12).toFixed(1)} years)` },
  ];
  
  let savings: { timeSaved: string; interestSaved: string; } | null = null;
  
  if (totalMonths < originalTermMonths) {
    // Calculate total interest that would have been paid over the original term, using the correct original monthly payment.
    const originalTotalInterest = (originalMonthlyPayment * originalTermMonths) - totalPrincipal;

    if (originalTotalInterest > totalInterest) {
        savings = {
          timeSaved: `${originalTermMonths - totalMonths} months`,
          // The saved interest is the difference between original total interest and the actual total interest paid.
          interestSaved: formatCurrency(originalTotalInterest - totalInterest),
      }
    }
  }


  return (
    <div className='space-y-6'>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

       {savings && (
        <Card className='bg-primary/10'>
          <CardHeader>
            <CardTitle>Accelerated Payment Savings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
             <div className="rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-xl font-semibold">{savings.timeSaved}</p>
            </div>
             <div className="rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Interest Saved</p>
                <p className="text-xl font-semibold">{savings.interestSaved}</p>
            </div>
             <div className="rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Original Payoff</p>
                <p className="text-xl font-semibold">{format(addMonths(startDate, originalTermMonths), 'MMMM yyyy')}</p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

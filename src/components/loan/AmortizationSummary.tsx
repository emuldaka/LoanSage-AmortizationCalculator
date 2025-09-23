'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/amortization';
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
  const payoffDate = addMonths(new Date(), lastPayment.month);
  const totalMonths = lastPayment.month;
  const originalTermMonths = loanData.termInYears * 12;

  const summaryItems = [
    { label: 'Monthly Payment', value: formatCurrency(schedule[0].payment) },
    { label: 'Total Principal', value: formatCurrency(totalPrincipal) },
    { label: 'Total Interest', value: formatCurrency(totalInterest) },
    { label: 'Total Payments', value: formatCurrency(totalPayments) },
    { label: 'Payoff Date', value: format(payoffDate, 'MMMM yyyy') },
    { label: 'Loan Term', value: `${totalMonths} months (${(totalMonths/12).toFixed(1)} years)` },
  ];
  
  const savings = totalMonths < originalTermMonths ? {
      timeSaved: `${originalTermMonths - totalMonths} months`,
      originalTotalInterest: (schedule[0].payment * originalTermMonths) - totalPrincipal,
  } : null;

  if (savings) {
    savings.interestSaved = savings.originalTotalInterest > totalInterest ? formatCurrency(savings.originalTotalInterest - totalInterest) : formatCurrency(0);
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
                <p className="text-xl font-semibold">{format(addMonths(new Date(), originalTermMonths), 'MMMM yyyy')}</p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

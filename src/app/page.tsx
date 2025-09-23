'use client';

import { useState } from 'react';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import LoanForm from '@/components/loan/LoanForm';
import AmortizationDisplay from '@/components/loan/AmortizationDisplay';
import Header from '@/components/layout/Header';

export default function Home() {
  const [schedule, setSchedule] = useState<AmortizationPeriod[] | null>(null);
  const [loanData, setLoanData] = useState<LoanData | null>(null);

  const handleCalculate = (
    data: LoanData,
    newSchedule: AmortizationPeriod[]
  ) => {
    setLoanData(data);
    setSchedule(newSchedule);
  };

  const handleReset = () => {
    setLoanData(null);
    setSchedule(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:p-8">
        <div className="w-full max-w-6xl">
          <LoanForm
            onCalculate={handleCalculate}
            onReset={handleReset}
            hasResults={!!schedule}
          />
        </div>
        {schedule && loanData && (
          <div className="w-full max-w-6xl">
            <AmortizationDisplay schedule={schedule} loanData={loanData} />
          </div>
        )}
      </main>
    </div>
  );
}

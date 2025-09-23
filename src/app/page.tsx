'use client';

import { useState, useEffect } from 'react';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import LoanForm from '@/components/loan/LoanForm';
import AmortizationDisplay from '@/components/loan/AmortizationDisplay';
import Header from '@/components/layout/Header';

const LOAN_DATA_KEY = 'loanSageData';
const SCHEDULE_KEY = 'loanSageSchedule';

export default function Home() {
  const [schedule, setSchedule] = useState<AmortizationPeriod[] | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(SCHEDULE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [loanData, setLoanData] = useState<LoanData | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(LOAN_DATA_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Dates need to be reconstructed
    if (parsed.startDate) {
      parsed.startDate = new Date(parsed.startDate);
    }
    if (parsed.modificationPeriods) {
      parsed.modificationPeriods = parsed.modificationPeriods.map((mod: any) => ({
        ...mod,
        paymentDate: new Date(mod.paymentDate),
      }));
    }
    return parsed;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (schedule) {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    } else {
      localStorage.removeItem(SCHEDULE_KEY);
    }
  }, [schedule]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loanData) {
      localStorage.setItem(LOAN_DATA_KEY, JSON.stringify(loanData));
    } else {
      localStorage.removeItem(LOAN_DATA_KEY);
    }
  }, [loanData]);

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
            initialData={loanData}
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

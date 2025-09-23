'use client';

import { useState, useEffect } from 'react';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import LoanForm from '@/components/loan/LoanForm';
import AmortizationDisplay from '@/components/loan/AmortizationDisplay';
import Header from '@/components/layout/Header';

const LOAN_DATA_KEY = 'loanSageData';
const SCHEDULE_KEY = 'loanSageSchedule';

export default function Home() {
  const [schedule, setSchedule] = useState<AmortizationPeriod[] | null>(null);
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const savedSchedule = localStorage.getItem(SCHEDULE_KEY);
        if (savedSchedule) {
          setSchedule(JSON.parse(savedSchedule));
        }

        const savedLoanData = localStorage.getItem(LOAN_DATA_KEY);
        if (savedLoanData) {
          const parsed = JSON.parse(savedLoanData);
          if (parsed.startDate) {
            parsed.startDate = new Date(parsed.startDate);
          }
          if (parsed.modificationPeriods) {
            parsed.modificationPeriods = parsed.modificationPeriods.map((mod: any) => ({
              ...mod,
              paymentDate: new Date(mod.paymentDate),
            }));
          }
          setLoanData(parsed);
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem(SCHEDULE_KEY);
        localStorage.removeItem(LOAN_DATA_KEY);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      if (schedule) {
        localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
      } else {
        localStorage.removeItem(SCHEDULE_KEY);
      }
    }
  }, [schedule, isClient]);

  useEffect(() => {
    if (isClient) {
      if (loanData) {
        localStorage.setItem(LOAN_DATA_KEY, JSON.stringify(loanData));
      } else {
        localStorage.removeItem(LOAN_DATA_KEY);
      }
    }
  }, [loanData, isClient]);

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
            isClient={isClient}
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

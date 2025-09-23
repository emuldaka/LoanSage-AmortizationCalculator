export interface AmortizationPeriod {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterest: number;
  extraPayment: number;
}

export interface ModificationPeriod {
  startMonth: number;
  endMonth: number;
  amount: number;
}

export interface LoanData {
  principal: number;
  interestRate: number; // annual percentage
  termInYears: number;
  startDate?: Date;
  extraPayment?: number;
  modificationPeriods?: ModificationPeriod[];
}

    
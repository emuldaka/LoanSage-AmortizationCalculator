import type { LoanData, AmortizationPeriod, ModificationPeriod } from './types';

export function calculateMonthlyPayment(
  principal: number,
  interestRate: number,
  termInYears: number
): number {
  if (principal <= 0 || termInYears <= 0 || interestRate < 0) {
    return 0;
  }

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = termInYears * 12;

  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return isNaN(payment) ? 0 : payment;
}

export function calculateAmortizationSchedule({
  principal,
  interestRate,
  termInYears,
  extraPayment = 0,
  modificationPeriods = [],
}: LoanData): AmortizationPeriod[] {
  if (principal <= 0 || interestRate < 0 || termInYears <= 0) {
    return [];
  }
  
  const monthlyRate = interestRate / 100 / 12;
  const originalMonthlyPayment = calculateMonthlyPayment(principal, interestRate, termInYears);
  const maxPayments = termInYears * 12 * 2; // Prevent infinite loops

  const schedule: AmortizationPeriod[] = [];
  let remainingBalance = principal;
  let totalInterest = 0;

  // Use a small tolerance for floating point comparisons
  for (let month = 1; month <= maxPayments && remainingBalance > 0.005; month++) {
    const interestForMonth = remainingBalance * monthlyRate;
    const recurringExtra = extraPayment || 0;
    const oneTimeExtra = (modificationPeriods || [])
      .filter(p => p.startMonth === month)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalExtraPaymentForMonth = recurringExtra + oneTimeExtra;

    let principalPaid: number;
    let totalPaymentForMonth: number;
    
    // This is the total amount available to pay down the loan this month
    const availablePayment = originalMonthlyPayment + totalExtraPaymentForMonth;
    // This is how much of the available payment would go to principal
    const principalPortionOfAvailable = availablePayment - interestForMonth;

    // Check if this is the final payment
    if (remainingBalance <= principalPortionOfAvailable) {
        // The remaining balance is less than or equal to what we can pay in principal
        principalPaid = remainingBalance;
        totalPaymentForMonth = principalPaid + interestForMonth;
    } else {
        // It's not the final payment
        principalPaid = principalPortionOfAvailable;
        totalPaymentForMonth = availablePayment;
    }

    remainingBalance -= principalPaid;
    totalInterest += interestForMonth;

    schedule.push({
      month,
      payment: totalPaymentForMonth,
      principal: principalPaid,
      interest: interestForMonth,
      totalInterest,
      remainingBalance,
      extraPayment: totalExtraPaymentForMonth,
    });
  }

  return schedule;
}


export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

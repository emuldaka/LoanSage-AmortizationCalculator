import type { LoanData, AmortizationPeriod, ModificationPeriod } from './types';

export function calculateAmortizationSchedule({
  principal,
  interestRate,
  termInYears,
  extraPayment = 0,
  modificationPeriods = [],
}: LoanData): AmortizationPeriod[] {
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = termInYears * 12;

  if (principal <= 0 || interestRate < 0 || termInYears <= 0) {
    return [];
  }
  
  if (monthlyRate === 0) {
    const monthlyPayment = principal / numberOfPayments;
    let remainingBalance = principal;
    let totalInterest = 0;
    const schedule: AmortizationPeriod[] = [];

    for (let month = 1; month <= numberOfPayments * 2 && remainingBalance > 0; month++) {
      if (remainingBalance <= 0) {
        break;
      }
      const recurringExtra = extraPayment || 0;
      const oneTimePaymentsForMonth = modificationPeriods
        .filter((p) => p.startMonth === month)
        .reduce((sum, p) => sum + p.amount, 0);
      const currentExtraPayment = recurringExtra + oneTimePaymentsForMonth;
      
      const totalPayment = monthlyPayment + currentExtraPayment;
      
      const principalPaid = Math.min(totalPayment, remainingBalance);
      const actualExtraPaid = Math.max(0, principalPaid - monthlyPayment);
      
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: principalPaid,
        principal: principalPaid,
        interest: 0,
        totalInterest,
        remainingBalance,
        extraPayment: actualExtraPaid,
      });
    }
    return schedule;
  }

  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  let remainingBalance = principal;
  let totalInterest = 0;
  const schedule: AmortizationPeriod[] = [];

  for (let month = 1; month <= numberOfPayments * 2; month++) { // Allow for longer term
    if (remainingBalance <= 0) { 
      break;
    }

    const interestPaid = remainingBalance * monthlyRate;
    
    const recurringExtra = extraPayment || 0;
    const oneTimePaymentsForMonth = modificationPeriods
        .filter((p) => p.startMonth === month)
        .reduce((sum, p) => sum + p.amount, 0);
    const currentExtraPayment = recurringExtra + oneTimePaymentsForMonth;

    const principalFromBasePayment = monthlyPayment - interestPaid;
    const principalToPay = principalFromBasePayment + currentExtraPayment;
    
    const principalPaid = Math.min(principalToPay, remainingBalance);
    const totalPayment = principalPaid + interestPaid;
    
    remainingBalance -= principalPaid;
    totalInterest += interestPaid;
    
    const actualExtraPaid = Math.max(0, totalPayment - monthlyPayment);

    schedule.push({
      month,
      payment: totalPayment,
      principal: principalPaid,
      interest: interestPaid,
      totalInterest,
      remainingBalance: remainingBalance,
      extraPayment: actualExtraPaid,
    });
  }
  
  // Final cleanup for the last payment if balance is slightly off
  if (schedule.length > 0) {
      const lastPeriod = schedule[schedule.length - 1];
      if (lastPeriod.remainingBalance < 0) {
          const overpayment = lastPeriod.remainingBalance; // This will be a negative number
          lastPeriod.principal += overpayment; // Add negative number to reduce principal
          lastPeriod.payment += overpayment; // Add negative number to reduce payment
          lastPeriod.extraPayment = Math.max(0, lastPeriod.extraPayment + overpayment);
          lastPeriod.remainingBalance = 0;
      }
  }


  return schedule;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

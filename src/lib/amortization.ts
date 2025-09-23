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

    for (let month = 1; month <= numberOfPayments; month++) {
      let currentExtraPayment = extraPayment;
      const modification = modificationPeriods.find(
        (p) => month >= p.startMonth && month <= p.endMonth
      );
      if (modification) {
        currentExtraPayment += modification.amount;
      }
      const totalPayment = monthlyPayment + currentExtraPayment;
      const principalPaid = Math.min(totalPayment, remainingBalance);
      remainingBalance -= principalPaid;
      
      schedule.push({
        month,
        payment: totalPayment,
        principal: principalPaid,
        interest: 0,
        totalInterest,
        remainingBalance,
        extraPayment: currentExtraPayment
      });

      if (remainingBalance <= 0) {
        break;
      }
    }
    return schedule;
  }

  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  let remainingBalance = principal;
  let totalInterest = 0;
  const schedule: AmortizationPeriod[] = [];

  for (let month = 1; month <= numberOfPayments * 2; month++) { // Allow for longer term if payments are reduced
    if (remainingBalance <= 0) break;

    const interestPaid = remainingBalance * monthlyRate;
    let principalFromBasePayment = monthlyPayment - interestPaid;
    
    if (remainingBalance < monthlyPayment) {
        principalFromBasePayment = remainingBalance;
    }

    let currentExtraPayment = extraPayment;
    const modification = modificationPeriods.find(
      (p) => month >= p.startMonth && month <= p.endMonth
    );
    if (modification) {
        currentExtraPayment += modification.amount;
    }
    
    const principalPaid = principalFromBasePayment + currentExtraPayment;
    const totalPayment = interestPaid + principalPaid;

    if (remainingBalance < totalPayment) {
        schedule.push({
            month,
            payment: remainingBalance + interestPaid,
            principal: remainingBalance,
            interest: interestPaid,
            totalInterest: totalInterest + interestPaid,
            remainingBalance: 0,
            extraPayment: 0,
        });
        break;
    }

    remainingBalance -= principalPaid;
    totalInterest += interestPaid;

    schedule.push({
      month,
      payment: totalPayment,
      principal: principalPaid,
      interest: interestPaid,
      totalInterest,
      remainingBalance,
      extraPayment: currentExtraPayment
    });

    if (remainingBalance <= 0) {
        // Correct last payment if overpaid
        const overpayment = Math.abs(remainingBalance);
        const lastPeriod = schedule[schedule.length - 1];
        lastPeriod.principal -= overpayment;
        lastPeriod.payment -= overpayment;
        lastPeriod.remainingBalance = 0;
        break;
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

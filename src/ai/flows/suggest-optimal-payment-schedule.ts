'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting an optimized payment schedule for a loan, including potential extra payments to minimize total interest paid and shorten the loan term.
 *
 * - suggestOptimalPaymentSchedule - A function that suggests an optimized loan payment schedule.
 * - SuggestOptimalPaymentScheduleInput - The input type for the suggestOptimalPaymentSchedule function.
 * - SuggestOptimalPaymentScheduleOutput - The return type for the suggestOptimalPaymentSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalPaymentScheduleInputSchema = z.object({
  principal: z.number().describe('The initial principal amount of the loan.'),
  interestRate: z.number().describe('The annual interest rate of the loan (as a decimal, e.g., 0.05 for 5%).'),
  loanTermMonths: z.number().describe('The total term of the loan in months.'),
  extraPaymentAmount: z
    .number()
    .optional()
    .describe('Optional. An additional amount to pay each month towards the principal.'),
  paymentModificationPeriods: z
    .array(z.object({
      startMonth: z.number().describe('The month the extra payment starts.'),
      endMonth: z.number().describe('The month the extra payment ends.'),
      amount: z.number().describe('The amount of the extra payment during this period.'),
    }))
    .optional()
    .describe('Optional. A list of extra payments with varying periods.'),
});
export type SuggestOptimalPaymentScheduleInput = z.infer<
  typeof SuggestOptimalPaymentScheduleInputSchema
>;

const SuggestOptimalPaymentScheduleOutputSchema = z.object({
  suggestedPaymentSchedule: z
    .string()
    .describe(
      'A detailed payment schedule that includes the optimized payment plan, total interest paid, and the reduced loan term, incorporating any extra payments.'
    ),
});
export type SuggestOptimalPaymentScheduleOutput = z.infer<
  typeof SuggestOptimalPaymentScheduleOutputSchema
>;

export async function suggestOptimalPaymentSchedule(
  input: SuggestOptimalPaymentScheduleInput
): Promise<SuggestOptimalPaymentScheduleOutput> {
  return suggestOptimalPaymentScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalPaymentSchedulePrompt',
  input: {schema: SuggestOptimalPaymentScheduleInputSchema},
  output: {schema: SuggestOptimalPaymentScheduleOutputSchema},
  prompt: `You are an expert financial advisor specializing in loan amortization and debt optimization.
  Based on the provided loan details, suggest an optimized payment schedule to minimize the total interest paid and shorten the loan term. Consider the impact of extra payments, if any, and how they can be strategically applied.

  Loan Details:
  Principal: {{{principal}}}
  Interest Rate: {{{interestRate}}}
  Loan Term (Months): {{{loanTermMonths}}}
  {{#if extraPaymentAmount}}
  Extra Payment Amount (monthly): {{{extraPaymentAmount}}}
  {{/if}}
  {{#if paymentModificationPeriods}}
  Payment Modification Periods:
    {{#each paymentModificationPeriods}}
  Start Month: {{{startMonth}}}, End Month: {{{endMonth}}}, Amount: {{{amount}}}
    {{/each}}
  {{/if}}

  Provide a detailed payment schedule that includes the optimized payment plan, total interest paid, and the reduced loan term, incorporating any extra payments.
  Assume the user wants to pay the least amount of interest possible and shorten the loan term as much as possible.
  Be as creative as possible in your suggestion, and take into account that users might be willing to make extra payments on certain months but not others.
  Incorporate the paymentModificationPeriods array.
  Ensure that the result is easy to understand.
  Do not include any disclaimers. Only include the optimized payment schedule.
  Make sure the total interest paid is accurate.
  Include the new total interest paid, and the new loan term in months.
  Include a table with the month number, payment amount, principal paid, interest paid, and remaining balance.
  `,
});

const suggestOptimalPaymentScheduleFlow = ai.defineFlow(
  {
    name: 'suggestOptimalPaymentScheduleFlow',
    inputSchema: SuggestOptimalPaymentScheduleInputSchema,
    outputSchema: SuggestOptimalPaymentScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

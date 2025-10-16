import { z } from 'zod';

export const paymentStageStatusSchema = z.enum(['locked', 'requested', 'awaiting', 'paid']);

export const paymentStageSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  amount: z.number().nullable(),
  status: paymentStageStatusSchema,
  updatedAt: z.string().nullable().optional(),
  nextActionLabel: z.string().nullable().optional(),
  disabled: z.boolean().optional()
});

export const paymentStagesResponseSchema = z.object({
  stages: z.array(paymentStageSchema)
});

export type PaymentStage = z.infer<typeof paymentStageSchema>;

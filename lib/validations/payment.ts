import { z } from 'zod';

export const paymentStageStatusSchema = z.enum(['locked', 'requested', 'awaiting', 'paid']);

export const paymentStageSchema = z.object({
  id: z.string(),
  stageTemplateId: z.string(),
  stageOrder: z.number(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: paymentStageStatusSchema,
  defaultAmount: z.number().nullable(),
  requestAmount: z.number().nullable(),
  requestedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  paidAmount: z.number().nullable(),
  paymentKey: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  nextActionLabel: z.string().nullable().optional(),
  disabled: z.boolean().optional()
});

export const paymentStagesResponseSchema = z.object({
  stages: z.array(paymentStageSchema)
});

export type PaymentStage = z.infer<typeof paymentStageSchema>;

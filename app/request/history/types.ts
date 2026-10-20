import type { ConsultationRecord as ConsultationRecordType } from '@/lib/validations/consultation';

export type ConsultationRecord = ConsultationRecordType;
export type ConsultationAttachment = NonNullable<ConsultationRecord['attachments']>[number];

export interface EditFormState {
  name: string;
  phone: string;
  email: string;
  message: string;
  attachments: ConsultationAttachment[];
}

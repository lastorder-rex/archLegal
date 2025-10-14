import type { UserProfile } from '@/types/profile';

export type ConsultationAttachment = {
  name: string;
  storagePath: string;
};

export type ConsultationSummary = {
  id: string;
  created_at: string;
  address: string;
  address_detail: string | null;
  main_purps: string | null;
  tot_area: number | null;
  plat_area: number | null;
  ground_floor_cnt: number | null;
  message: string | null;
  email?: string | null;
  phone?: string | null;
  attachments?: ConsultationAttachment[] | null;
};

export type MyPageContextValue = {
  profile: UserProfile;
  fallbackEmail: string | null;
  consultations: ConsultationSummary[];
};

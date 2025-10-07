export type UserProfile = {
  auth_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  legal_name: string | null;
  contact_phone: string | null;
  profile_completed: boolean;
  profile_completed_at: string | null;
  consent_terms_at: string | null;
  consent_privacy_at: string | null;
  contact_phone_verified_at: string | null;
  birth_date: string | null;
};

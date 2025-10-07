import { z } from 'zod';

export const koreanPhoneRegex = /^010-[0-9]{4}-[0-9]{4}$/;

export const nameSchema = z
  .string()
  .trim()
  .min(2, '이름은 2글자 이상 입력해주세요')
  .max(50, '이름은 50글자 이하로 입력해주세요');

export const phoneSchema = z
  .string()
  .regex(koreanPhoneRegex, '올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)');

export const optionalEmailSchema = z
  .string()
  .trim()
  .email('올바른 이메일 형식을 입력해주세요')
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, '영문, 숫자, 특수문자만 사용 가능합니다')
  .optional()
  .or(z.literal(''));

export const optionalBirthDateSchema = z
  .string()
  .regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'YYYY-MM-DD 형식으로 입력해주세요')
  .optional()
  .or(z.literal(''));

export const contactInfoSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema
});

export const legalContactInfoSchema = z.object({
  legalName: nameSchema,
  contactPhone: phoneSchema,
  email: optionalEmailSchema,
  birthDate: optionalBirthDateSchema
});

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export function validatePhoneInput(phone: string): { formatted: string; valid: boolean } {
  const formatted = formatPhoneNumber(phone);
  const valid = koreanPhoneRegex.test(formatted);
  return { formatted, valid };
}

export function sanitizeLegalContactInfo(values: {
  legalName: string;
  contactPhone: string;
  email: string;
  birthDate?: string;
}) {
  const sanitized = {
    legalName: values.legalName.trim(),
    contactPhone: formatPhoneNumber(values.contactPhone.trim()),
    email: values.email.trim(),
    birthDate: values.birthDate?.trim() ?? ''
  };

  return legalContactInfoSchema.safeParse(sanitized);
}

export function sanitizeContactInfo(values: { name: string; phone: string; email: string }) {
  const sanitized = {
    name: values.name.trim(),
    phone: formatPhoneNumber(values.phone.trim()),
    email: values.email.trim()
  };

  return contactInfoSchema.safeParse(sanitized);
}

export function filterNameInput(value: string) {
  return value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z\s]/g, '');
}

export function filterPhoneInput(value: string) {
  return value.replace(/[^0-9-]/g, '');
}

export function filterEmailInput(value: string) {
  return value.replace(/[^a-zA-Z0-9@._+-]/g, '');
}

export function filterBirthDateInput(value: string) {
  return value.replace(/[^0-9-]/g, '');
}

/**
 * 한국 휴대폰 번호 검증 (010-xxxx-xxxx)
 */
export function isValidKoreanPhone(phone: string): boolean {
  return koreanPhoneRegex.test(phone);
}

/**
 * 이메일 검증 (기본 패턴)
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

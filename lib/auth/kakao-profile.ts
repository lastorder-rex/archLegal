import { formatPhoneNumber } from '@/lib/validations/user';

export type KakaoMetadata = Record<string, unknown>;

export type KakaoApiUserResponse = {
  id?: number | string;
  connected_at?: string;
  properties?: KakaoMetadata;
  kakao_account?: KakaoMetadata & {
    profile?: KakaoMetadata;
  };
};

export const KAKAO_PROPERTY_KEYS = [
  'kakao_account.profile',
  'kakao_account.name',
  'kakao_account.legal_name',
  'kakao_account.email',
  'kakao_account.phone_number',
  'kakao_account.birthday',
  'kakao_account.birthyear'
];

function getNestedObject(source: KakaoMetadata | null | undefined, key: string): KakaoMetadata | null {
  if (!source) return null;
  const value = source[key];
  return typeof value === 'object' && value !== null ? (value as KakaoMetadata) : null;
}

export function parseKakaoIdentityData(raw: unknown): KakaoMetadata | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? (parsed as KakaoMetadata) : null;
    } catch {
      return null;
    }
  }

  if (typeof raw === 'object') {
    return raw as KakaoMetadata;
  }

  return null;
}

export function getKakaoString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeKoreanPhoneFromInternational(digits: string): string | null {
  if (!digits) return null;

  let localDigits = digits;
  if (digits.startsWith('82')) {
    const withoutCountryCode = digits.slice(2);
    if (withoutCountryCode.length === 10 && withoutCountryCode.startsWith('10')) {
      localDigits = `0${withoutCountryCode}`;
    } else if (withoutCountryCode.length === 11 && withoutCountryCode.startsWith('010')) {
      localDigits = withoutCountryCode;
    } else {
      localDigits = withoutCountryCode;
    }
  }

  if (localDigits.length === 10 && localDigits.startsWith('10')) {
    localDigits = `0${localDigits}`;
  }

  if (localDigits.length === 11) {
    return formatPhoneNumber(localDigits);
  }

  return null;
}

export function normalizeKakaoPhone(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  const normalized = normalizeKoreanPhoneFromInternational(digits);
  if (normalized) {
    return normalized;
  }

  if (digits.length === 11) {
    return formatPhoneNumber(digits);
  }

  return trimmed;
}

function isValidIsoDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [year, month, day] = dateString.split('-').map(part => Number.parseInt(part, 10));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }

  // 월과 일 범위 검증
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Date 객체로 실제 유효한 날짜인지 검증 (로컬 타임존 사용)
  const date = new Date(year, month - 1, day);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function normalizeBirthDate(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 8) {
    const candidate = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    return isValidIsoDate(candidate) ? candidate : null;
  }

  return null;
}

export function normalizeBirthDateFromYearDay(year: string | null, day: string | null): string | null {
  if (!year || !day) return null;
  const yearDigits = year.replace(/\D/g, '');
  const dayDigits = day.replace(/\D/g, '');
  if (yearDigits.length !== 4 || dayDigits.length !== 4) {
    return null;
  }

  const candidate = `${yearDigits}-${dayDigits.slice(0, 2)}-${dayDigits.slice(2)}`;
  return isValidIsoDate(candidate) ? candidate : null;
}

function collectSources(...sourcesInput: Array<KakaoMetadata | null | undefined>): KakaoMetadata[] {
  const sources: KakaoMetadata[] = [];

  for (const input of sourcesInput) {
    if (!input) continue;
    sources.push(input);

    const kakaoAccount = getNestedObject(input, 'kakao_account');
    if (kakaoAccount) {
      sources.push(kakaoAccount);
      const kakaoProfile = getNestedObject(kakaoAccount, 'profile');
      if (kakaoProfile) {
        sources.push(kakaoProfile);
      }
    }

    const properties = getNestedObject(input, 'properties');
    if (properties) {
      sources.push(properties);
    }
  }

  return sources;
}

function pickFirstString(sources: KakaoMetadata[], keys: string[]): string | null {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      const result = getKakaoString(value);
      if (result) return result;
    }
  }
  return null;
}

export function extractKakaoProfile(
  ...sourcesInput: Array<KakaoMetadata | null | undefined>
) {
  const sources = collectSources(...sourcesInput);

  const phone = normalizeKakaoPhone(
    pickFirstString(sources, ['phone_number', 'phoneNumber', 'phone', 'contact_phone'])
  );

  const directBirthDate = normalizeBirthDate(
    pickFirstString(sources, ['birth_date', 'birthdate', 'birthday_full'])
  );
  const birthDate =
    directBirthDate ??
    normalizeBirthDateFromYearDay(
      pickFirstString(sources, ['birthyear', 'birth_year', 'birthYear']),
      pickFirstString(sources, ['birthday', 'birth_day', 'birthDay'])
    );

  const legalName =
    pickFirstString(sources, ['legal_name', 'legalName', 'name', 'full_name']) ??
    pickFirstString(sources, ['profile_nickname', 'nickname']);

  return {
    legalName,
    phone,
    birthDate
  };
}

export function extractKakaoNameFallback(
  ...sourcesInput: Array<KakaoMetadata | null | undefined>
) {
  const sources = collectSources(...sourcesInput);
  return (
    pickFirstString(sources, ['legal_name', 'legalName', 'name', 'full_name']) ??
    pickFirstString(sources, ['profile_nickname', 'nickname'])
  );
}

export function combineBirthDate(year: string | null, birthday: string | null) {
  if (!year || !birthday) return null;
  const trimmedYear = year.trim();
  const trimmedBirthday = birthday.trim();
  if (trimmedYear.length !== 4 || trimmedBirthday.length !== 4) {
    return normalizeBirthDateFromYearDay(trimmedYear, trimmedBirthday);
  }
  const candidate = `${trimmedYear}-${trimmedBirthday.slice(0, 2)}-${trimmedBirthday.slice(2)}`;
  return normalizeBirthDate(candidate);
}

export async function fetchKakaoUserProfile(
  accessToken: string
): Promise<KakaoApiUserResponse | null> {
  if (!accessToken) return null;

  try {
    const form = new URLSearchParams();
    form.set('property_keys', JSON.stringify(KAKAO_PROPERTY_KEYS));

    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: form.toString()
    });

    if (!response.ok) {
      const debugText = await response.text().catch(() => 'unknown error');
      console.error('Failed to fetch Kakao user profile', response.status, debugText);
      return null;
    }

    const data = (await response.json()) as KakaoApiUserResponse;
    return data;
  } catch (error) {
    console.error('Failed to fetch Kakao user profile', error);
    return null;
  }
}

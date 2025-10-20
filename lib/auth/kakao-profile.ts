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
] as const;

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

const KAKAO_ACCOUNT_INDICATOR_KEYS = [
  'has_email',
  'email_needs_agreement',
  'is_email_valid',
  'name_needs_agreement',
  'birthyear_needs_agreement',
  'birthday_needs_agreement',
  'legal_name_needs_agreement',
  'profile_needs_agreement',
  'profile_image_needs_agreement',
  'profile_nickname_needs_agreement'
] as const;

function isLikelyKakaoAccount(source: KakaoMetadata): boolean {
  return KAKAO_ACCOUNT_INDICATOR_KEYS.some(key => key in source);
}

type CollectedKakaoSources = {
  accounts: KakaoMetadata[];
  profiles: KakaoMetadata[];
  properties: KakaoMetadata[];
  others: KakaoMetadata[];
  combined: KakaoMetadata[];
};

function collectKakaoSources(...sourcesInput: Array<KakaoMetadata | null | undefined>): CollectedKakaoSources {
  const seen = new Set<KakaoMetadata>();
  const accounts: KakaoMetadata[] = [];
  const profiles: KakaoMetadata[] = [];
  const properties: KakaoMetadata[] = [];
  const others: KakaoMetadata[] = [];

  const addSource = (collection: KakaoMetadata[], source: KakaoMetadata | null) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    collection.push(source);
  };

  for (const input of sourcesInput) {
    if (!input) continue;

    if (isLikelyKakaoAccount(input)) {
      addSource(accounts, input);
    } else {
      addSource(others, input);
    }

    const kakaoAccount = getNestedObject(input, 'kakao_account');
    addSource(accounts, kakaoAccount);

    if (kakaoAccount) {
      addSource(profiles, getNestedObject(kakaoAccount, 'profile'));
    }

    addSource(profiles, getNestedObject(input, 'profile'));
    addSource(properties, getNestedObject(input, 'properties'));
  }

  const combined = [...accounts, ...profiles, ...properties, ...others];

  return { accounts, profiles, properties, others, combined };
}

function pickFirstString(sources: KakaoMetadata[], keys: readonly string[]): string | null {
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
  const { combined, accounts } = collectKakaoSources(...sourcesInput);

  const phone = normalizeKakaoPhone(
    pickFirstString(combined, ['phone_number', 'phoneNumber', 'phone', 'contact_phone'])
  );

  const directBirthDate = normalizeBirthDate(
    pickFirstString(combined, ['birth_date', 'birthdate', 'birthday_full'])
  );
  const birthDate =
    directBirthDate ??
    normalizeBirthDateFromYearDay(
      pickFirstString(combined, ['birthyear', 'birth_year', 'birthYear']),
      pickFirstString(combined, ['birthday', 'birth_day', 'birthDay'])
    );

  // kakao_account.name (실명) 우선, 없으면 nickname
  const legalName =
    pickFirstString(accounts, ['name', 'legal_name', 'legalName', 'full_name']) ??
    pickFirstString(combined, ['profile_nickname', 'nickname']);

  return {
    legalName,
    phone,
    birthDate
  };
}

export function extractKakaoNameFallback(
  ...sourcesInput: Array<KakaoMetadata | null | undefined>
) {
  const { combined, accounts } = collectKakaoSources(...sourcesInput);
  // kakao_account.name (실명) 우선, 없으면 nickname
  return (
    pickFirstString(accounts, ['name', 'legal_name', 'legalName', 'full_name']) ??
    pickFirstString(combined, ['profile_nickname', 'nickname'])
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

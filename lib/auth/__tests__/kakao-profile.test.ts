import {
  extractKakaoProfile,
  extractKakaoNameFallback,
  normalizeKakaoPhone,
  normalizeBirthDate,
  normalizeBirthDateFromYearDay,
  combineBirthDate,
  getKakaoString,
  parseKakaoIdentityData,
  type KakaoMetadata
} from '../kakao-profile';

describe('extractKakaoProfile', () => {
  describe('실명 vs 닉네임 우선순위', () => {
    it('should prioritize name over nickname', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          name: '김상우',
          name_needs_agreement: false,
          profile: { nickname: 'rex' }
        }
      });
      expect(result.legalName).toBe('김상우');
    });

    it('should use nickname when name is not available', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          profile: { nickname: 'rex' }
        }
      });
      expect(result.legalName).toBe('rex');
    });

    it('should use legal_name if available', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          legal_name: '김법정이름',
          profile: { nickname: 'rex' }
        }
      });
      expect(result.legalName).toBe('김법정이름');
    });

    it('should prioritize name over legal_name', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          name: '김상우',
          legal_name: '김법정이름',
          profile: { nickname: 'rex' }
        }
      });
      expect(result.legalName).toBe('김상우');
    });
  });

  describe('전화번호 추출 및 정규화', () => {
    it('should normalize phone number with country code', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          phone_number: '+82 10-1234-5678'
        }
      });
      expect(result.phone).toBe('010-1234-5678');
    });

    it('should normalize phone number without formatting', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          phone_number: '01012345678'
        }
      });
      expect(result.phone).toBe('010-1234-5678');
    });

    it('should handle international format +82', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          phone_number: '+82 1012345678'
        }
      });
      expect(result.phone).toBe('010-1234-5678');
    });
  });

  describe('생년월일 조합', () => {
    it('should combine birthyear and birthday', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          birthyear: '1990',
          birthday: '0315'
        }
      });
      expect(result.birthDate).toBe('1990-03-15');
    });

    it('should handle MMDD format birthday', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          birthyear: '1985',
          birthday: '1225'
        }
      });
      expect(result.birthDate).toBe('1985-12-25');
    });

    it('should return null for invalid date', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          birthyear: '1990',
          birthday: '1332' // 13월 32일은 없음
        }
      });
      expect(result.birthDate).toBeNull();
    });

    it('should handle direct birth_date format', () => {
      const result = extractKakaoProfile({
        kakao_account: {
          birth_date: '1990-03-15'
        }
      });
      expect(result.birthDate).toBe('1990-03-15');
    });
  });

  describe('null/undefined 처리', () => {
    it('should handle null values gracefully', () => {
      const result = extractKakaoProfile(null, undefined);
      expect(result.legalName).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.birthDate).toBeNull();
    });

    it('should handle empty object', () => {
      const result = extractKakaoProfile({});
      expect(result.legalName).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.birthDate).toBeNull();
    });

    it('should handle empty kakao_account', () => {
      const result = extractKakaoProfile({ kakao_account: {} });
      expect(result.legalName).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.birthDate).toBeNull();
    });
  });

  describe('여러 소스에서 데이터 추출', () => {
    it('should extract from multiple sources', () => {
      const metadata = {
        name: 'metadata이름'
      };
      const identityData = {
        kakao_account: {
          phone_number: '010-1111-2222'
        }
      };
      const apiProfile = {
        kakao_account: {
          name: '김상우',
          birthyear: '1990',
          birthday: '0101'
        }
      };

      const result = extractKakaoProfile(metadata, identityData, apiProfile);
      expect(result.legalName).toBe('김상우'); // apiProfile의 name 우선
      expect(result.phone).toBe('010-1111-2222');
      expect(result.birthDate).toBe('1990-01-01');
    });
  });
});

describe('extractKakaoNameFallback', () => {
  it('should prioritize name over nickname', () => {
    const result = extractKakaoNameFallback({
      kakao_account: {
        name: '김상우',
        profile: { nickname: 'rex' }
      }
    });
    expect(result).toBe('김상우');
  });

  it('should fallback to nickname', () => {
    const result = extractKakaoNameFallback({
      kakao_account: {
        profile: { nickname: 'rex' }
      }
    });
    expect(result).toBe('rex');
  });

  it('should return null if no name available', () => {
    const result = extractKakaoNameFallback({});
    expect(result).toBeNull();
  });
});

describe('normalizeKakaoPhone', () => {
  it('should normalize 11-digit phone number', () => {
    expect(normalizeKakaoPhone('01012345678')).toBe('010-1234-5678');
  });

  it('should handle +82 country code', () => {
    expect(normalizeKakaoPhone('+82 10-1234-5678')).toBe('010-1234-5678');
  });

  it('should handle 8210 format', () => {
    expect(normalizeKakaoPhone('821012345678')).toBe('010-1234-5678');
  });

  it('should return null for invalid input', () => {
    expect(normalizeKakaoPhone(null)).toBeNull();
    expect(normalizeKakaoPhone('')).toBeNull();
    expect(normalizeKakaoPhone('   ')).toBeNull();
  });

  it('should preserve already formatted phone', () => {
    expect(normalizeKakaoPhone('010-1234-5678')).toBe('010-1234-5678');
  });
});

describe('normalizeBirthDate', () => {
  it('should validate and normalize YYYY-MM-DD format', () => {
    expect(normalizeBirthDate('1990-03-15')).toBe('1990-03-15');
  });

  it('should convert YYYYMMDD to YYYY-MM-DD', () => {
    expect(normalizeBirthDate('19900315')).toBe('1990-03-15');
  });

  it('should return null for invalid date', () => {
    expect(normalizeBirthDate('1990-13-01')).toBeNull(); // 13월
    expect(normalizeBirthDate('1990-02-30')).toBeNull(); // 2월 30일
    expect(normalizeBirthDate('1990-04-31')).toBeNull(); // 4월 31일
  });

  it('should return null for invalid format', () => {
    expect(normalizeBirthDate('90-03-15')).toBeNull();
    expect(normalizeBirthDate('invalid')).toBeNull();
    expect(normalizeBirthDate('')).toBeNull();
  });

  it('should handle null input', () => {
    expect(normalizeBirthDate(null)).toBeNull();
  });
});

describe('normalizeBirthDateFromYearDay', () => {
  it('should combine year and MMDD', () => {
    expect(normalizeBirthDateFromYearDay('1990', '0315')).toBe('1990-03-15');
  });

  it('should return null for invalid format', () => {
    expect(normalizeBirthDateFromYearDay('90', '0315')).toBeNull(); // 2자리 연도
    expect(normalizeBirthDateFromYearDay('1990', '315')).toBeNull(); // 3자리 MMDD
  });

  it('should return null for invalid date', () => {
    expect(normalizeBirthDateFromYearDay('1990', '1332')).toBeNull();
  });

  it('should handle null inputs', () => {
    expect(normalizeBirthDateFromYearDay(null, '0315')).toBeNull();
    expect(normalizeBirthDateFromYearDay('1990', null)).toBeNull();
    expect(normalizeBirthDateFromYearDay(null, null)).toBeNull();
  });
});

describe('combineBirthDate', () => {
  it('should combine year and birthday', () => {
    expect(combineBirthDate('1990', '0315')).toBe('1990-03-15');
  });

  it('should handle various formats', () => {
    expect(combineBirthDate('1985', '1225')).toBe('1985-12-25');
  });

  it('should return null for null inputs', () => {
    expect(combineBirthDate(null, '0315')).toBeNull();
    expect(combineBirthDate('1990', null)).toBeNull();
  });
});

describe('getKakaoString', () => {
  it('should return trimmed string', () => {
    expect(getKakaoString('  hello  ')).toBe('hello');
  });

  it('should return null for non-string', () => {
    expect(getKakaoString(123)).toBeNull();
    expect(getKakaoString(null)).toBeNull();
    expect(getKakaoString(undefined)).toBeNull();
    expect(getKakaoString({})).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getKakaoString('')).toBeNull();
    expect(getKakaoString('   ')).toBeNull();
  });
});

describe('parseKakaoIdentityData', () => {
  it('should parse JSON string', () => {
    const result = parseKakaoIdentityData('{"name": "김상우"}');
    expect(result).toEqual({ name: '김상우' });
  });

  it('should return object as is', () => {
    const obj = { name: '김상우' };
    const result = parseKakaoIdentityData(obj);
    expect(result).toEqual(obj);
  });

  it('should return null for invalid JSON', () => {
    expect(parseKakaoIdentityData('invalid json')).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(parseKakaoIdentityData(null)).toBeNull();
    expect(parseKakaoIdentityData(undefined)).toBeNull();
  });

  it('should return null for non-object types', () => {
    expect(parseKakaoIdentityData(123)).toBeNull();
    expect(parseKakaoIdentityData(true)).toBeNull();
  });
});

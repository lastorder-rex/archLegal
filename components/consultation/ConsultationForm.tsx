'use client';

import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AddressSearchModal } from './AddressSearchModal';
import { BuildingInfoDisplay } from './BuildingInfoDisplay';
import FileUpload from './FileUpload';
import {
  consultationFormSchema,
  type ConsultationForm,
  type AddressSearchResult,
  type BuildingSearchResult,
  validatePhoneInput,
} from '@/lib/validations/consultation';
import { AttachmentFile } from '@/lib/utils/file-upload';

interface ConsultationFormProps {
  user: User;
}

interface FormErrors {
  [key: string]: string;
}

export default function ConsultationForm({ user }: ConsultationFormProps) {
  const supabase = createClientComponentClient();

  // Form state
  const [formData, setFormData] = useState<Partial<ConsultationForm>>({
    name: '',
    phone: '',
    email: user.email || '',
    address: '',
    addressDetail: '',
    message: '',
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressSearchResult | null>(null);
  const [buildingInfo, setBuildingInfo] = useState<BuildingSearchResult | null>(null);
  const [isBuildingLoading, setIsBuildingLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  // Handle attachments change with useCallback to prevent re-render issues
  const handleAttachmentsChange = useCallback((files: AttachmentFile[]) => {
    console.log('🔄 FileUpload onFilesChange called with:', files);
    console.log('🔄 Number of files:', files.length);
    console.log('🔄 Files details:', files.map(f => ({
      name: f.name,
      status: f.uploadStatus,
      hasPath: !!f.storagePath
    })));
    setAttachments(files);
    console.log('✅ setAttachments called');
  }, []);

  const createFallbackBuildingInfo = useCallback((address: AddressSearchResult) => ({
    mainPurpsCdNm: '확인 필요',
    totArea: null,
    platArea: null,
    groundFloorCnt: null,
    ugrndFloorCnt: null,
    hhldCnt: null,
    fmlyNum: null,
    mainBldCnt: null,
    atchBldCnt: null,
    platPlc: null,
    addressInfo: {
      ...address.addressCode,
    },
    rawData: { status: 'UNAVAILABLE' as const },
  }), []);

  // Get user nickname from auth metadata
  const userNickname = user.user_metadata?.name ||
                      user.user_metadata?.full_name ||
                      user.email?.split('@')[0] ||
                      '사용자';

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof ConsultationForm, value: string) => {
    let processedValue = value;

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Special handling for phone number - only allow numbers and hyphens
    if (field === 'phone') {
      // Remove any characters that are not digits or hyphens
      const cleanValue = value.replace(/[^0-9-]/g, '');
      const { formatted } = validatePhoneInput(cleanValue);
      processedValue = formatted;
    }

    // Email field doesn't need special processing - validation is handled by Zod schema

    setFormData(prev => ({ ...prev, [field]: processedValue }));
  }, [errors]);

  // Handle address selection
  const handleAddressSelect = useCallback(async (address: AddressSearchResult) => {
    setSelectedAddress(address);
    setFormData(prev => ({
      ...prev,
      address: address.roadAddr,
      addressCode: address.addressCode,
      buildingInfo: undefined
    }));
    setIsAddressModalOpen(false);

    // Clear previous errors related to building info and address
    setErrors(prev => ({ ...prev, building: '', submit: '', address: '' }));

    // Clear building info when address changes
    setBuildingInfo(null);

    // Auto-fetch building information
    setIsBuildingLoading(true);
    try {
      const response = await fetch('/api/building/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(address.addressCode),
      });

      if (response.ok) {
        const buildingData: BuildingSearchResult = await response.json();
        setBuildingInfo(buildingData);
        setFormData(prev => ({ ...prev, buildingInfo: buildingData.building }));
      } else {
        const errorData = await response.json();
        setErrors(prev => ({
          ...prev,
          building: errorData.error || '건축물 정보를 가져올 수 없습니다.'
        }));
        setFormData(prev => ({ ...prev, buildingInfo: createFallbackBuildingInfo(address) }));
      }
    } catch (error) {
      console.error('Building info fetch error:', error);
      setErrors(prev => ({
        ...prev,
        building: '건축물 정보 조회 중 오류가 발생했습니다.'
      }));
      setFormData(prev => ({ ...prev, buildingInfo: createFallbackBuildingInfo(address) }));
    } finally {
      setIsBuildingLoading(false);
    }
  }, [createFallbackBuildingInfo]);

  const handleOpenRoadview = useCallback((provider: 'kakao' | 'naver') => {
    if (!selectedAddress) return;

    const encodedAddress = encodeURIComponent(selectedAddress.roadAddr);

    const url = provider === 'kakao'
      ? `https://map.kakao.com/?map_type=TYPE_ROADVIEW&q=${encodedAddress}`
      : `https://map.naver.com/v5/search/${encodedAddress}?searchCoord=0,0,15,0,0,0`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedAddress]);

  // Validate form
  const validateForm = useCallback((data: ConsultationForm): boolean => {
    try {
      consultationFormSchema.parse(data);
      setErrors({});
      return true;
    } catch (error: any) {
      const formErrors: FormErrors = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path.join('.');
          formErrors[field] = err.message;
        });
      }
      console.log('📋 Validation errors:', formErrors);
      console.log('📋 Submitted data:', data);
      setErrors(formErrors);
      return false;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Submit button clicked!'); // 디버깅용 로그
    console.log('🚀 Current attachments state at submit:', attachments);
    console.log('🚀 Attachments length:', attachments.length);

    // 필수값 체크 (유효성 검증 전에 먼저 확인)
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = '실명을 2글자 이상 입력해주세요.';
    }

    if (!formData.phone || !formData.phone.match(/^010-\d{4}-\d{4}$/)) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)';
    }

    if (!formData.address || !formData.addressCode) {
      newErrors.address = '주소를 선택해주세요.';
    }

    // 필수값 오류가 있으면 먼저 처리
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // 첫 번째 오류 필드로 포커스 이동
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    const resolvedBuilding = buildingInfo?.building
      ?? formData.buildingInfo
      ?? createFallbackBuildingInfo({ roadAddr: formData.address, addressCode: formData.addressCode });

    const submissionData: ConsultationForm = {
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      addressDetail: formData.addressDetail || '',
      addressCode: formData.addressCode,
      buildingInfo: resolvedBuilding,
      message: formData.message || '',
    };

    if (!validateForm(submissionData)) {
      console.log('❌ Form validation failed');
      return;
    }
    console.log('✅ Form validation passed');

    setIsSubmitting(true);
    setErrors({});

    // Process attachments for submission
    console.log('📎 All attachments:', attachments);
    console.log('📎 Attachment details:', attachments.map(f => ({
      name: f.name,
      status: f.uploadStatus,
      hasStoragePath: !!f.storagePath,
      storagePath: f.storagePath
    })));

    const attachmentsData = attachments
      .filter(file => file.uploadStatus === 'completed' && file.storagePath)
      .map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: file.storagePath
      }));
    console.log('📎 Filtered attachments for submission:', attachmentsData);

    if (attachments.length > 0 && attachmentsData.length === 0) {
      console.warn('⚠️ WARNING: Files were selected but none are ready for submission!');
      console.warn('⚠️ Make sure all files have uploadStatus="completed" and storagePath');
    }

    const requestData = {
      name: submissionData.name,
      phone: submissionData.phone,
      email: submissionData.email || undefined,
      address: submissionData.address,
      addressDetail: submissionData.addressDetail || undefined,
      addressCode: submissionData.addressCode,
      buildingInfo: submissionData.buildingInfo,
      message: submissionData.message || undefined,
      attachments: attachmentsData,
    };

    console.log('Submitting consultation data:', requestData);

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const responseData = await response.json();
        setConsultationId(responseData.id); // Store consultation ID for file uploads
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phone: '',
          email: user.email || '',
          address: '',
          addressDetail: '',
          message: '',
        });
        setSelectedAddress(null);
        setBuildingInfo(null);
        setAttachments([]);
        setErrors({});
      } else {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);

        let errorMessage = errorData.error || '상담 요청 제출 중 오류가 발생했습니다.';

        // 401 오류 시 더 명확한 메시지
        if (response.status === 401) {
          errorMessage = '로그인이 필요합니다. 페이지를 새로고침하고 다시 로그인해주세요.';
        }

        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(prev => ({
        ...prev,
        submit: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedAddress, buildingInfo, createFallbackBuildingInfo, validateForm, user.email, attachments]);

  // Success message display
  if (submitSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">상담 요청이 저장되었습니다</h2>
          <p className="text-muted-foreground">
            상담 내용을 검토한 후 연락드리겠습니다.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={() => setSubmitSuccess(false)} variant="outline" className="sm:w-auto">
            새 상담 요청 작성
          </Button>
          <Button
            type="button"
            className="sm:w-auto"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/request/history';
              }
            }}
          >
            나의 상담 내역 보기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">사용자 정보</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>카카오 닉네임</Label>
            <Input value={userNickname} disabled />
            <p className="text-xs text-muted-foreground">카카오 로그인 정보에서 자동 입력됩니다</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>실명</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="실명을 입력해주세요"
              error={!!errors.name}
              className={!formData.name?.trim() ? 'border-amber-200 bg-amber-50' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" required>연락처</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              inputMode="numeric"
              maxLength={13}
              error={!!errors.phone}
              className={!formData.phone?.match(/^010-\d{4}-\d{4}$/) ? 'border-amber-200 bg-amber-50' : ''}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">이메일 (선택)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="example@email.com"
            inputMode="email"
            error={!!errors.email}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">주소 정보</h3>

        <div className="space-y-2">
          <Label required>주소</Label>
          <div className="flex gap-2">
            <div className="flex-[8]">
              <Input
                value={formData.address || ''}
                placeholder="주소 검색 버튼을 클릭해주세요"
                readOnly
                error={!!errors.address}
                className={!selectedAddress ? 'border-amber-200 bg-amber-50' : ''}
              />
            </div>
            <div className="flex-[2]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full whitespace-nowrap"
              >
                주소 검색
              </Button>
            </div>
          </div>
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressDetail">상세 주소 (선택)</Label>
          <Input
            id="addressDetail"
            value={formData.addressDetail || ''}
            onChange={(e) => handleInputChange('addressDetail', e.target.value)}
            placeholder="동/호수, 건물명 등 상세 주소를 입력해주세요"
            error={!!errors.addressDetail}
          />
          {errors.addressDetail && <p className="text-sm text-destructive">{errors.addressDetail}</p>}
        </div>

        {selectedAddress && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>도로명:</strong> {selectedAddress.roadAddr}</p>
            <p><strong>지번:</strong> {selectedAddress.jibunAddr}</p>
            <p><strong>우편번호:</strong> {selectedAddress.zipNo}</p>
          </div>
        )}
      </div>

      {/* Building Information Section */}
      {selectedAddress && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">건축물 정보</h3>

          {isBuildingLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">건축물 정보를 조회하고 있습니다...</p>
            </div>
          ) : buildingInfo ? (
            <BuildingInfoDisplay buildingInfo={buildingInfo} />
          ) : errors.building ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errors.building}
            </div>
          ) : null}

          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">로드뷰 확인</h4>
              <p className="text-xs text-muted-foreground">
                카카오 지도에서 로드뷰를 열어 주변 현황을 확인할 수 있습니다.
              </p>
              {!buildingInfo && !isBuildingLoading && (
                <p className="text-xs text-muted-foreground">
                  건축물 정보를 불러오지 못해도 선택한 주소 기준으로 로드뷰가 열립니다.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => handleOpenRoadview('kakao')}
              >
                카카오 로드뷰 열기
              </Button>
              <Button
                type="button"
                variant="outline"
                className="sm:w-auto"
                onClick={() => handleOpenRoadview('naver')}
              >
                네이버 로드뷰 열기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">상담 내용</h3>

        <div className="space-y-2">
          <Label htmlFor="message">상담 요청사항 (선택)</Label>
          <Textarea
            id="message"
            value={formData.message || ''}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="상담 받고 싶은 내용을 자세히 적어주세요 (최대 1000글자)"
            rows={4}
            error={!!errors.message}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{errors.message}</span>
            <span>{(formData.message || '').length}/1000</span>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">첨부파일</h3>
        <div className="rounded-md border border-border bg-muted/10 p-4">
          <FileUpload
            userId={user.id}
            consultationId={consultationId}
            onFilesChange={handleAttachmentsChange}
            disabled={isSubmitting}
          />
          <div className="mt-3 text-xs text-muted-foreground">
            <p>📋 <strong>권장 첨부파일:</strong> 위임장, 인감증명서</p>
            <p>💡 <strong>안내:</strong> 첨부파일은 상담 완료 후에도 안전하게 보관됩니다</p>
          </div>
        </div>
        {/* Debug info */}
        {attachments.length > 0 && (
          <div className="text-xs text-muted-foreground">
            현재 첨부파일: {attachments.length}개
            ({attachments.filter(f => f.uploadStatus === 'completed').length}개 업로드 완료)
          </div>
        )}
      </div>

      {/* Submit Section */}
      <div className="space-y-4">
        {errors.submit && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {errors.submit}
          </div>
        )}

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedAddress ||
            attachments.some(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending')
          }
          className="w-full"
          onClick={() => console.log('🔘 Submit button clicked (before form submission)')}
        >
          {isSubmitting ? '제출 중...' :
           attachments.some(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending') ?
           '파일 업로드 중...' :
           '상담 요청 제출'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          제출 시 개인정보 수집 및 이용에 동의한 것으로 간주됩니다.
        </p>
      </div>

      {/* Address Search Modal */}
      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={handleAddressSelect}
      />
    </form>
  );
}

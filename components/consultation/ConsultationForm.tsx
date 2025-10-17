'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { AddressSearchModal } from './AddressSearchModal';
import {
  consultationFormSchema,
  type ConsultationForm,
  type AddressSearchResult,
  type BuildingSearchResult,
  validatePhoneInput,
  filterAddressDetailInput,
  filterMessageInput,
} from '@/lib/validations/consultation';
import { AttachmentFile } from '@/lib/utils/file-upload';
import type { UserProfile } from '@/types/profile';
import { filterNameInput, filterPhoneInput, filterEmailInput } from '@/lib/validations/user';
import { getUserNickname } from '@/lib/auth/user-utils';
import { createFallbackBuildingInfo } from '@/lib/utils/building-info';
import { UserInfoSection } from './sections/UserInfoSection';
import { AddressSection } from './sections/AddressSection';
import { BuildingInfoSection } from './sections/BuildingInfoSection';
import { MessageSection } from './sections/MessageSection';
import { AttachmentsSection } from './sections/AttachmentsSection';
import { SubmitSection } from './sections/SubmitSection';

interface ConsultationFormProps {
  user: User;
  profile: UserProfile;
  onCancel?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function ConsultationForm({ user, profile, onCancel }: ConsultationFormProps) {
  const supabase = createClientComponentClient();

  // Form state
  const defaultFormState = useMemo<Partial<ConsultationForm>>(
    () => ({
      name: profile.legal_name ?? profile.full_name ?? '',
      phone: profile.contact_phone ?? profile.phone ?? '',
      email: profile.email ?? user.email ?? '',
      address: '',
      addressDetail: '',
      message: '',
    }),
    [
      profile.contact_phone,
      profile.email,
      profile.full_name,
      profile.legal_name,
      profile.phone,
      user.email,
    ]
  );

  const [formData, setFormData] = useState<Partial<ConsultationForm>>(defaultFormState);

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
    setAttachments(files);
  }, []);

  // Get user nickname from auth metadata
  const userNickname = getUserNickname(user);

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof ConsultationForm, value: string) => {
    let processedValue = value;

    if (field === 'name') {
      processedValue = filterNameInput(value);
    }

    if (field === 'phone') {
      const cleanValue = filterPhoneInput(value);
      const { formatted } = validatePhoneInput(cleanValue);
      processedValue = formatted;
    }

    if (field === 'email') {
      processedValue = filterEmailInput(value);
    }

    if (field === 'addressDetail') {
      processedValue = filterAddressDetailInput(value);
    }

    if (field === 'message') {
      processedValue = filterMessageInput(value);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));

    setErrors(prev => {
      const next = { ...prev };

      if (field === 'email') {
        if (processedValue && processedValue.length > 100) {
          next.email = '이메일은 100자 이하로 입력해주세요';
        } else {
          next.email = '';
        }
      } else if (field === 'message') {
        if ((processedValue?.length ?? 0) > 1000) {
          next.message = '상담 내용은 1000글자 이하로 입력해주세요';
        } else {
          next.message = '';
        }
      } else {
        next[field] = '';
      }

      return next;
    });
  }, []);

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
        setFormData(prev => ({ ...prev, buildingInfo: createFallbackBuildingInfo(address.roadAddr, address.addressCode) }));
      }
    } catch (error) {
      console.error('Building info fetch error:', error);
      setErrors(prev => ({
        ...prev,
        building: '건축물 정보 조회 중 오류가 발생했습니다.'
      }));
      setFormData(prev => ({ ...prev, buildingInfo: createFallbackBuildingInfo(address.roadAddr, address.addressCode) }));
    } finally {
      setIsBuildingLoading(false);
    }
  }, []);

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
      setErrors(formErrors);
      return false;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!formData.message || formData.message.trim().length === 0) {
      newErrors.message = '상담 요청사항을 입력해주세요.';
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
      ?? createFallbackBuildingInfo(formData.address || '', formData.addressCode!);

    const submissionData: ConsultationForm = {
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || '',
      addressDetail: formData.addressDetail || '',
      addressCode: formData.addressCode!,
      buildingInfo: resolvedBuilding,
      message: formData.message || '',
    };

    if (!validateForm(submissionData)) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Process attachments for submission
    const attachmentsData = attachments
      .filter(file => file.uploadStatus === 'completed' && file.storagePath)
      .map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: file.storagePath
      }));

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

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const responseData = await response.json();
        setConsultationId(responseData.id);
        setSubmitSuccess(true);
        setFormData(defaultFormState);
        setSelectedAddress(null);
        setBuildingInfo(null);
        setAttachments([]);
        setErrors({});
      } else {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);

        let errorMessage = errorData.error || '상담 요청 제출 중 오류가 발생했습니다.';

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
  }, [
    formData,
    buildingInfo,
    validateForm,
    attachments,
    defaultFormState,
  ]);

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
      <UserInfoSection
        userNickname={userNickname}
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
      />

      <AddressSection
        formData={formData}
        errors={errors}
        selectedAddress={selectedAddress}
        onInputChange={handleInputChange}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
      />

      <BuildingInfoSection
        selectedAddress={selectedAddress}
        buildingInfo={buildingInfo}
        isBuildingLoading={isBuildingLoading}
        errors={errors}
        onOpenRoadview={handleOpenRoadview}
      />

      <MessageSection
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
      />

      <AttachmentsSection
        userId={user.id}
        consultationId={consultationId}
        attachments={attachments}
        isSubmitting={isSubmitting}
        onFilesChange={handleAttachmentsChange}
      />

      <SubmitSection
        errors={errors}
        isSubmitting={isSubmitting}
        selectedAddress={selectedAddress}
        attachments={attachments}
        onClose={() => {
          if (onCancel) {
            onCancel();
          } else if (typeof window !== 'undefined') {
            window.history.back();
          }
        }}
      />

      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={handleAddressSelect}
      />
    </form>
  );
}

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
import {
  consultationFormSchema,
  type ConsultationForm,
  type AddressSearchResult,
  type BuildingSearchResult,
  validatePhoneInput,
} from '@/lib/validations/consultation';

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
      addressCode: address.addressCode
    }));
    setIsAddressModalOpen(false);

    // Clear building info when address changes
    setBuildingInfo(null);

    // Auto-fetch building information
    setIsBuildingLoading(true);
    try {
      const response = await fetch('/api/building/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error('Building info fetch error:', error);
      setErrors(prev => ({
        ...prev,
        building: '건축물 정보 조회 중 오류가 발생했습니다.'
      }));
    } finally {
      setIsBuildingLoading(false);
    }
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    try {
      consultationFormSchema.parse(formData);
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
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedAddress || !buildingInfo) {
      setErrors(prev => ({
        ...prev,
        submit: '주소 선택과 건축물 정보 조회가 필요합니다.'
      }));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          addressCode: selectedAddress.addressCode,
          buildingInfo: buildingInfo.building,
          message: formData.message || undefined,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: user.email || '',
          address: '',
          message: '',
        });
        setSelectedAddress(null);
        setBuildingInfo(null);
      } else {
        const errorData = await response.json();
        setErrors(prev => ({
          ...prev,
          submit: errorData.error || '상담 요청 제출 중 오류가 발생했습니다.'
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
  }, [formData, selectedAddress, buildingInfo, validateForm, user.email]);

  // Success message display
  if (submitSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">상담 요청이 접수되었습니다</h2>
          <p className="text-muted-foreground">
            상담 내용을 검토한 후 연락드리겠습니다.
          </p>
        </div>
        <Button onClick={() => setSubmitSuccess(false)} variant="outline">
          새 상담 요청 작성
        </Button>
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
              pattern="[0-9-]+"
              inputMode="numeric"
              maxLength={13}
              error={!!errors.phone}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            <p className="text-xs text-muted-foreground">숫자와 하이픈(-)만 입력 가능합니다</p>
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
            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
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
            <Input
              value={formData.address || ''}
              placeholder="주소 검색 버튼을 클릭해주세요"
              readOnly
              error={!!errors.address}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressModalOpen(true)}
              className="whitespace-nowrap"
            >
              주소 검색
            </Button>
          </div>
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
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

      {/* Submit Section */}
      <div className="space-y-4">
        {errors.submit && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {errors.submit}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !selectedAddress || !buildingInfo}
          className="w-full"
        >
          {isSubmitting ? '제출 중...' : '상담 요청 제출'}
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
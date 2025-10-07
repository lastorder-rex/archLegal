import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConsultationForm } from '@/lib/validations/consultation';
import { useState } from 'react';
import { Info } from 'lucide-react';

interface UserInfoSectionProps {
  userNickname: string;
  formData: Partial<ConsultationForm>;
  errors: Record<string, string>;
  onInputChange: (field: keyof ConsultationForm, value: string) => void;
}

export function UserInfoSection({
  userNickname,
  formData,
  errors,
  onInputChange
}: UserInfoSectionProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleReadOnlyClick = (fieldName: string) => {
    setNotificationMessage(fieldName);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">사용자 정보</h3>

      {/* 알림 메시지 - 화면 중앙 */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-500 text-white px-8 py-6 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm pointer-events-auto">
              <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{notificationMessage}은(는) 회원정보에서 자동 입력됩니다.</p>
                <p className="text-sm opacity-90">수정이 필요한 경우 마이페이지에서 변경해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>카카오 닉네임</Label>
          <Input value={userNickname} disabled />
          <p className="text-xs text-muted-foreground">
            회원정보에서 자동 입력되며, 수정은 회원정보 페이지에서 가능합니다.
          </p>
        </div>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" required>
            이름
          </Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => onInputChange('name', e.target.value)}
            onClick={() => handleReadOnlyClick('이름')}
            placeholder="실명을 입력해주세요"
            error={!!errors.name}
            className={`cursor-not-allowed bg-secondary text-foreground ${!formData.name?.trim() ? 'border-amber-200' : ''}`}
            readOnly
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" required>
            연락처
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => onInputChange('phone', e.target.value)}
            onClick={() => handleReadOnlyClick('연락처')}
            placeholder="010-1234-5678"
            inputMode="numeric"
            maxLength={13}
            error={!!errors.phone}
            className={`cursor-not-allowed bg-secondary text-foreground ${!formData.phone?.match(/^010-\d{4}-\d{4}$/) ? 'border-amber-200' : ''}`}
            readOnly
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
          onChange={(e) => onInputChange('email', e.target.value)}
          placeholder="example@email.com"
          inputMode="email"
          error={!!errors.email}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>
    </div>
  );
}

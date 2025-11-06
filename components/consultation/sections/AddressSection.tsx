import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ConsultationForm, AddressSearchResult } from '@/lib/validations/consultation';

interface AddressSectionProps {
  formData: Partial<ConsultationForm>;
  errors: Record<string, string>;
  selectedAddress: AddressSearchResult | null;
  onInputChange: (field: keyof ConsultationForm, value: string) => void;
  onOpenAddressModal: () => void;
}

export function AddressSection({
  formData,
  errors,
  selectedAddress,
  onInputChange,
  onOpenAddressModal
}: AddressSectionProps) {
  return (
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
              onClick={onOpenAddressModal}
              className="w-full whitespace-nowrap !border-opacity-100 !bg-white hover:!bg-primary hover:!text-white"
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
          onChange={(e) => onInputChange('addressDetail', e.target.value)}
          placeholder="동/호수, 건물명 등 상세 주소를 입력해주세요 (최대 100글자)"
          error={!!errors.addressDetail}
        />
        <div className="flex justify-between text-xs">
          <span className={errors.addressDetail ? 'text-destructive' : 'text-muted-foreground'}>
            {errors.addressDetail}
          </span>
          <span
            className={
              (formData.addressDetail || '').length > 100
                ? 'text-destructive'
                : 'text-muted-foreground'
            }
          >
            {(formData.addressDetail || '').length}/100
          </span>
        </div>
      </div>

      {selectedAddress && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>도로명:</strong> {selectedAddress.roadAddr}
          </p>
          <p>
            <strong>지번:</strong> {selectedAddress.jibunAddr}
          </p>
          <p>
            <strong>우편번호:</strong> {selectedAddress.zipNo}
          </p>
        </div>
      )}
    </div>
  );
}

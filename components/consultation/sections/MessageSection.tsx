import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ConsultationForm } from '@/lib/validations/consultation';

interface MessageSectionProps {
  formData: Partial<ConsultationForm>;
  errors: Record<string, string>;
  onInputChange: (field: keyof ConsultationForm, value: string) => void;
}

export function MessageSection({ formData, errors, onInputChange }: MessageSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">상담 내용</h3>

      <div className="space-y-2">
        <Label htmlFor="message">상담 요청사항 (선택)</Label>
        <Textarea
          id="message"
          value={formData.message || ''}
          onChange={(e) => onInputChange('message', e.target.value)}
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
  );
}

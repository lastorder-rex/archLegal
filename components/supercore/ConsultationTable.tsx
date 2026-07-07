'use client';

import { Button } from '@/components/ui/button';
import type { Consultation } from '@/types/admin';
import { formatDateTimeShort as formatDateTime } from '@/lib/admin/format';

interface ConsultationTableProps {
  consultations: Consultation[];
  onSelect: (id: string) => void;
  /**
   * Cell alignment variant.
   * - 'center': 목록판(consultations) — 헤더/셀 text-center, 주소 셀만 text-left
   * - 'left': 회원판(users/[userId]) — 헤더 text-left, 셀 정렬 클래스 없음(기본 좌측)
   */
  align: 'center' | 'left';
}

export default function ConsultationTable({ consultations, onSelect, align }: ConsultationTableProps) {
  const thAlign = align === 'center' ? 'text-center' : 'text-left';
  const cellCenter = align === 'center' ? ' text-center' : '';
  const cellAddress = align === 'center' ? ' text-left' : '';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className={`px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              접수일시
            </th>
            <th className={`px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              이름
            </th>
            <th className={`px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              연락처
            </th>
            <th className={`hidden md:table-cell px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              주소
            </th>
            <th className={`hidden lg:table-cell px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              첨부파일
            </th>
            <th className={`px-4 py-3 ${thAlign} text-sm font-semibold text-slate-900`}>
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {consultations.map((consultation) => (
            <tr
              key={consultation.id}
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onSelect(consultation.id)}
            >
              <td className={`px-4 py-3 text-sm text-slate-600${cellCenter}`}>
                {formatDateTime(consultation.created_at)}
              </td>
              <td className={`px-4 py-3 text-sm font-medium text-slate-900${cellCenter}`}>
                {consultation.name}
              </td>
              <td className={`px-4 py-3 text-sm text-slate-600${cellCenter}`}>
                {consultation.phone}
              </td>
              <td className={`hidden md:table-cell px-4 py-3 text-sm text-slate-600${cellAddress}`}>
                <div className="max-w-xs truncate" title={consultation.address}>
                  {consultation.address}
                </div>
                {consultation.address_detail && (
                  <div className="text-xs text-slate-500">
                    {consultation.address_detail}
                  </div>
                )}
              </td>
              <td className={`hidden lg:table-cell px-4 py-3 text-sm text-slate-600${cellCenter}`}>
                {consultation.attachments?.length || 0}개
              </td>
              <td className={`px-4 py-3 text-sm${cellCenter}`}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(consultation.id);
                  }}
                  size="sm"
                  variant="primary"
                  className="w-20"
                >
                  상세보기
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

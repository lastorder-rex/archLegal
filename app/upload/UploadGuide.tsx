'use client';

interface UploadGuideProps {
  remainingTimeText: string;
}

export default function UploadGuide({ remainingTimeText }: UploadGuideProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-3 text-sm text-slate-600">
      <h3 className="text-base font-semibold text-slate-800">업로드 안내</h3>
      <ul className="list-disc pl-4 space-y-1">
        <li>업로드 중 브라우저를 닫지 말고 완료 메시지가 표시될 때까지 기다려주세요.</li>
        <li>동일 파일명을 다시 업로드하면 최신 파일로 교체됩니다.</li>
        <li>남은 시간: {remainingTimeText}</li>
      </ul>
    </section>
  );
}

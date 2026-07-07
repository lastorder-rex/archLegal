import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <Button
              key={pageNum}
              variant="primary"
              size="sm"
              onClick={() => onChange(pageNum)}
              className="w-10"
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </Button>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { AddressSearchResult } from '@/lib/validations/consultation';

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: AddressSearchResult) => void;
}

interface SearchResponse {
  addresses: AddressSearchResult[];
  pagination: {
    currentPage: number;
    totalCount: number;
    countPerPage: number;
  };
}

export function AddressSearchModal({ isOpen, onClose, onSelect }: AddressSearchModalProps) {
  const [query, setQuery] = useState('');
  const [addresses, setAddresses] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search function
  const searchAddresses = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('검색어는 2글자 이상 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setError('');

      try {
        const response = await fetch('/api/juso/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: searchQuery.trim(), page }),
        });

      if (response.ok) {
        const data: SearchResponse = await response.json();
        setAddresses(data.addresses);
        setPagination(data.pagination);
        setCurrentPage(page);

        if (data.addresses.length === 0) {
          setError('검색 결과가 없습니다. 다른 검색어를 시도해보세요.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '주소 검색 중 오류가 발생했습니다.');
        setAddresses([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setAddresses([]);
      setPagination(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    searchAddresses(query, 1);
  }, [query, searchAddresses]);

  // Handle address selection
  const handleAddressSelect = useCallback((address: AddressSearchResult) => {
    onSelect(address);
    // Reset state
    setQuery('');
    setAddresses([]);
    setPagination(null);
    setError('');
    setCurrentPage(1);
  }, [onSelect]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (query.trim()) {
      searchAddresses(query.trim(), page);
    }
  }, [query, searchAddresses]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setAddresses([]);
      setPagination(null);
      setError('');
      setCurrentPage(1);
    }
  }, [isOpen]);

  const totalPages = pagination ? Math.ceil(pagination.totalCount / pagination.countPerPage) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>주소 검색</SheetTitle>
          <SheetDescription>
            건물명, 도로명, 지번으로 검색할 수 있습니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="address-search">주소 검색</Label>
              <Input
                id="address-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 강남구 테헤란로, 역삼동 123"
                error={!!error}
              />
            </div>

            <Button
              type="submit"
              disabled={isSearching || query.trim().length < 2}
              className="w-full"
            >
              {isSearching ? '검색 중...' : '검색'}
            </Button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Search Results */}
          {addresses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  검색 결과 ({pagination?.totalCount || 0}건)
                </h4>
                {pagination && pagination.totalCount > pagination.countPerPage && (
                  <div className="text-xs text-muted-foreground">
                    {currentPage} / {totalPages} 페이지
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleAddressSelect(address)}
                    className="w-full text-left p-3 border border-border rounded-md hover:bg-accent hover:border-accent-foreground transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{address.roadAddr}</p>
                      <p className="text-xs text-muted-foreground">{address.jibunAddr}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          우편번호: {address.zipNo}
                        </span>
                        {address.buildingName && (
                          <span className="text-xs text-primary">
                            {address.buildingName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {pagination && totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1 || isSearching}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    이전
                  </Button>

                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || isSearching}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Search Instructions */}
          {addresses.length === 0 && !error && !isSearching && (
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium">검색 팁:</h4>
              <ul className="space-y-1 text-xs">
                <li>• 도로명: '강남구 테헤란로'</li>
                <li>• 건물명: '역삼빌딩'</li>
                <li>• 동명: '역삼동'</li>
                <li>• 최소 2글자 이상 입력해주세요</li>
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

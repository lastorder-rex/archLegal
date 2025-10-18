'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import flatpickr from 'flatpickr';
import { Korean } from 'flatpickr/dist/l10n/ko';
import type { Instance } from 'flatpickr/dist/types/instance';
import clsx from 'clsx';

export interface DateInputProps {
  id?: string;
  value?: string;
  onChange?: (date: string) => void;
  onBlur?: () => void;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxDate?: string | Date;
  minDate?: string | Date;
  className?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      id,
      value = '',
      onChange,
      onBlur,
      error,
      required,
      disabled,
      placeholder = 'YYYY-MM-DD',
      maxDate,
      minDate,
      className
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const flatpickrRef = useRef<Instance | null>(null);
    const [hasValue, setHasValue] = useState(!!value);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleClear = () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.clear();
        if (onChange) {
          onChange('');
        }
        setHasValue(false);
      }
    };

    useEffect(() => {
      if (!inputRef.current) return;

      const fp = flatpickr(inputRef.current, {
        dateFormat: 'Y-m-d',
        locale: Korean,
        disableMobile: true,
        maxDate: maxDate || undefined,
        minDate: minDate || undefined,
        defaultDate: value || undefined,
        allowInput: true,
        onChange: (selectedDates, dateStr) => {
          setHasValue(!!dateStr);
          if (onChange) {
            onChange(dateStr);
          }
        },
        onClose: () => {
          if (onBlur) {
            onBlur();
          }
        }
      });

      flatpickrRef.current = fp;

      return () => {
        fp.destroy();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update flatpickr when value changes externally
    useEffect(() => {
      if (flatpickrRef.current && value !== flatpickrRef.current.input.value) {
        flatpickrRef.current.setDate(value || '', false);
        setHasValue(!!value);
      }
    }, [value]);

    // Update maxDate/minDate when they change
    useEffect(() => {
      if (flatpickrRef.current) {
        flatpickrRef.current.set('maxDate', maxDate || undefined);
        flatpickrRef.current.set('minDate', minDate || undefined);
      }
    }, [maxDate, minDate]);

    return (
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            'flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            hasValue && 'pr-9',
            className
          )}
        />
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label="날짜 지우기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

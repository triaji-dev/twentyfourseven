import React, { useRef, useState, useEffect } from 'react';
import type { ActivityKey } from '../types';
import { VALID_VALUES } from '../constants';
import { saveActivity } from '../utils/storage';

interface ActivityCellProps {
  year: number;
  month: number;
  day: number;
  hour: number;
  value: ActivityKey;
  onMouseEnter: (e: React.MouseEvent) => void;
  onFocus: () => void;
  onChange: () => void;
}

export const ActivityCell: React.FC<ActivityCellProps> = ({
  year,
  month,
  day,
  hour,
  value,
  onMouseEnter,
  onFocus,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase().trim() as ActivityKey;

    if (VALID_VALUES.includes(newValue as any) || newValue === '') {
      setInputValue(newValue);
      saveActivity(year, month, day, hour, newValue);
      onChange();
    } else {
      setInputValue(value);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.toUpperCase().slice(0, 1);
  };

  const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      maxLength={1}
      onChange={handleChange}
      onInput={handleInput}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className="w-full h-full p-0 text-center bg-transparent"
      style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400 }}
      data-year={year}
      data-month={month + 1}
      data-day={day}
      data-hour={hour}
      data-id={cellId}
    />
  );
};

import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { ActivityKey } from '../types';
import { saveActivity } from '../utils/storage';
import { useStore } from '../store/useStore';
import { useSettings } from '../store/useSettings';

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
  const [shouldReplace, setShouldReplace] = useState(false);
  const categories = useSettings((state) => state.categories);
  
  // Memoize valid keys to prevent infinite loops
  const validKeys = useMemo(() => categories.map(cat => cat.key), [categories]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase().trim() as ActivityKey;

    // Accept valid category keys or empty string
    if (validKeys.includes(newValue) || newValue === '') {
      setInputValue(newValue);
      useStore.getState().pushHistory();
      saveActivity(year, month, day, hour, newValue);
      onChange();
      setShouldReplace(false);
    } else {
      setInputValue(value);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    
    // Jika shouldReplace aktif, replace isi dengan input baru
    if (shouldReplace) {
      target.value = target.value.toUpperCase().slice(-1); // Ambil karakter terakhir saja
      setShouldReplace(false);
    } else {
      target.value = target.value.toUpperCase().slice(0, 1);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Set flag untuk replace saat focus
    setShouldReplace(true);
    // Select all text agar terlihat jelas
    e.target.select();
    // Panggil onFocus prop
    onFocus();
  };

  const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;


  const setSelectedCells = useStore(state => state.setSelectedCells);


const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const maxHour = 23;
  const maxDay = new Date(year, month + 1, 0).getDate();

  let nextDay = day;
  let nextHour = hour;

  if (e.key === 'Enter' || e.key === 'ArrowDown') {
    e.preventDefault();
    nextHour = hour + 1;
    if (nextHour > maxHour) {
      nextHour = 0;
      nextDay = day + 1;
      if (nextDay > maxDay) nextDay = 1;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    nextHour = hour - 1;
    if (nextHour < 0) {
      nextHour = maxHour;
      nextDay = day - 1;
      if (nextDay < 1) nextDay = maxDay;
    }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextDay = day + 1;
    if (nextDay > maxDay) nextDay = 1;
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    nextDay = day - 1;
    if (nextDay < 1) nextDay = maxDay;
  } else {
    return;
  }

  // Fokus ke cell berikutnya
  const nextCellId = `cell-${year}-${month + 1}-${nextDay}-${nextHour}`;
  const nextInput = document.querySelector<HTMLInputElement>(`input[data-id="${nextCellId}"]`);
  if (nextInput) {
    nextInput.focus();
    nextInput.select();
    setSelectedCells(new Set([nextCellId]));
  }
};

  // Prevent drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      maxLength={1}
      onChange={handleChange}
      onInput={handleInput}
      onMouseEnter={onMouseEnter}
      onFocus={handleFocus}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      draggable={false}
      className="w-full h-full p-0 text-center bg-transparent"
      style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 400 }}
      data-year={year}
      data-month={month + 1}
      data-day={day}
      data-hour={hour}
      onKeyDown={handleKeyDown}
      data-id={cellId}
    />
  );
};

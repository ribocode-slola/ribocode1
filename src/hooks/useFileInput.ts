/**
 * Custom React hook for handling file input and parsing file content.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useState, useRef } from 'react';

/**
 * Generic file input hook.
 * @param parseFn Function to parse file content.
 * @param initialValue Initial value for the data state.
 * @returns An object containing data, setData, inputRef, handleButtonClick, and handleFileChange.
 */
export function useFileInput<T>(
  parseFn: (text: string, file: File) => Promise<T>,
  initialValue: T
) {
  const [data, setData] = useState<T>(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result as string;
        const parsed = await parseFn(text, file);
        setData(parsed);
        // Optionally: console.log('data:', parsed);
      };
      reader.readAsText(file);
    }
  };
  return { data, setData, inputRef, handleButtonClick, handleFileChange };
}

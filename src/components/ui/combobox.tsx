"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  items: string[];
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function Combobox({ value, onChange, items, placeholder, className, readOnly }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = value;
  const filtered = readOnly 
    ? items 
    : items.filter((item) =>
        item.toLowerCase().includes(search.toLowerCase())
      );
  const showCreateOption =
    !readOnly && search.trim().length > 0 &&
    !items.some((item) => item.toLowerCase() === search.toLowerCase().trim());

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered.length, showCreateOption]);

  const totalOptions = filtered.length + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          onChange(filtered[highlightedIndex]);
          setOpen(false);
        } else if (showCreateOption && highlightedIndex === filtered.length) {
          onChange(search.trim());
          setOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleSelect = (item: string) => {
    onChange(item);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          if (!readOnly) {
            onChange(e.target.value);
          }
        }}
        onFocus={() => {
          setOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className="flex-1 min-w-0 bg-canvas border border-hairline rounded-none px-sm py-xs text-primary placeholder:text-muted/50 focus:border-primary outline-none text-body-md tracking-[0] w-full"
      />

      {open && (filtered.length > 0 || showCreateOption) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-px bg-surface-card border border-hairline shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((item, index) => (
            <button
              key={item}
              onClick={() => handleSelect(item)}
              className={cn(
                "w-full text-left px-sm py-xs text-body-sm tracking-[0] transition-colors",
                index === highlightedIndex
                  ? "bg-surface-elevated text-primary"
                  : "text-body hover:bg-surface-elevated hover:text-primary"
              )}
            >
              {item}
            </button>
          ))}

          {showCreateOption && (
            <button
              onClick={() => handleSelect(search.trim())}
              className={cn(
                "w-full text-left px-sm py-xs text-body-sm tracking-[0] transition-colors border-t border-hairline",
                highlightedIndex === filtered.length
                  ? "bg-surface-elevated text-primary"
                  : "text-m-blue-light hover:bg-surface-elevated hover:text-primary"
              )}
            >
              {"+ AÑADIR \u201C" + search.trim() + "\u201D"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

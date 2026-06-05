"use client";

import { useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UploadState {
  status: "idle" | "dragging" | "uploading" | "success" | "error";
  message: string | null;
}

export function CardioDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>({ status: "idle", message: null });

  const reset = useCallback(() => {
    setUpload({ status: "idle", message: null });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".fit")) {
        setUpload({ status: "error", message: "Solo se aceptan archivos .fit" });
        return;
      }

      setUpload({ status: "uploading", message: null });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const resp = await fetch("/api/workouts/upload-fit", {
          method: "POST",
          body: formData,
        });

        const data = await resp.json();

        if (!resp.ok) {
          setUpload({ status: "error", message: data.error ?? "Error al procesar archivo" });
          return;
        }

        setUpload({ status: "success", message: null });
        router.refresh();

        setTimeout(reset, 3000);
      } catch {
        setUpload({ status: "error", message: "Error de conexión al servidor" });
      }
    },
    [router, reset]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUpload((prev) =>
      prev.status === "idle" || prev.status === "error"
        ? { status: "dragging", message: null }
        : prev
    );
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUpload((prev) =>
      prev.status === "dragging" ? { status: "idle", message: null } : prev
    );
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const isDragging = upload.status === "dragging";
  const isLoading = upload.status === "uploading";
  const isSuccess = upload.status === "success";
  const isError = upload.status === "error";

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={cn(
        "relative border-2 border-dashed transition-all duration-200 cursor-pointer select-none",
        "flex flex-col items-center justify-center gap-sm p-lg min-h-[120px]",
        isDragging && "border-m-red bg-m-red/5 scale-[1.02]",
        isSuccess && "border-success bg-success/5",
        isError && "border-m-red bg-m-red/5",
        !isDragging && !isSuccess && !isError && "border-hairline hover:border-muted"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".fit"
        className="hidden"
        onChange={handleInputChange}
      />

      {isLoading && (
        <div className="flex flex-col items-center gap-sm">
          <div className="w-6 h-6 border-2 border-m-blue-light border-t-transparent animate-spin rounded-none" />
          <span className="text-caption text-muted tracking-[1.5px]">PROCESANDO...</span>
        </div>
      )}

      {isSuccess && (
        <div className="flex flex-col items-center gap-sm">
          <div className="w-5 h-5 text-success">✓</div>
          <span className="text-caption text-success tracking-[1.5px]">ENTRENO IMPORTADO</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-sm">
          <span className="text-caption text-m-red tracking-[1.5px]">✕</span>
          <span className="text-caption text-m-red tracking-[1.5px]">{upload.message}</span>
          <span className="text-caption text-muted tracking-[1px] mt-xs">TOCA PARA REINTENTAR</span>
        </div>
      )}

      {(upload.status === "idle" || isDragging) && !isLoading && !isSuccess && !isError && (
        <div className="flex flex-col items-center gap-sm">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={cn("transition-colors", isDragging ? "text-m-red" : "text-muted")}
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span
            className={cn(
              "text-caption tracking-[1.5px] transition-colors",
              isDragging ? "text-primary" : "text-muted"
            )}
          >
            {isDragging ? "SOLTAR .fit" : "DROP .fit"}
          </span>
          <span className="text-caption text-muted/50 text-[10px] tracking-[1px]">
            O TOCA PARA SELECCIONAR
          </span>
        </div>
      )}

      {/* Animated border accents on drag */}
      {isDragging && (
        <>
          <div className="absolute top-0 left-0 w-8 h-[2px] bg-m-red animate-pulse" />
          <div className="absolute top-0 right-0 w-[2px] h-8 bg-m-blue-light animate-pulse" />
          <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-m-blue-dark animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[2px] h-8 bg-m-red animate-pulse" />
        </>
      )}
    </div>
  );
}

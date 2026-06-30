"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type DropZoneProps = {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
};

export function DropZone({
  onFilesSelected,
  disabled = false,
}: DropZoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: handleDrop,
      accept: {
        "text/plain": [".txt"],
      },
      disabled,
      multiple: true,
    });

  return (
    <div
      {...getRootProps()}
      className={`rounded-[2rem] border border-dashed px-6 py-10 text-center transition ${
        disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
          : isDragActive
            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
            : "cursor-pointer border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
        Batch Intake
      </p>
      <h2 className="mt-3 text-2xl font-bold text-stone-950 tracking-tight">
        Upload multiple .txt files
      </h2>
      <p className="mt-3 text-xs leading-relaxed text-stone-500 max-w-md mx-auto">
        Drag and drop text files here, or click to select documents for the queue.
      </p>
      <p className="mt-4 text-[11px] text-stone-400 italic">
        Supported format: Plain text (.txt) documents only.
      </p>

      {fileRejections.length > 0 ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some files were skipped because only .txt uploads are supported in
          this MVP.
        </p>
      ) : null}
    </div>
  );
}

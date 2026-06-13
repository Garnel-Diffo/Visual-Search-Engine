"use client";

import { useCallback, useRef, useState } from "react";

import ImageCard from "@/components/ImageCard";
import { searchByImage, type ClothingItemWithSimilarity } from "@/lib/api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export default function SearchUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<ClothingItemWithSimilarity[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez une image JPG, PNG, WEBP ou BMP.");
      return;
    }

    setError(null);
    setResults(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    searchByImage(file, 12)
      .then(({ results }) => setResults(results))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
          dragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
            : "border-slate-300 bg-white/60 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative h-40 w-40 overflow-hidden rounded-xl shadow-md sm:h-48 sm:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Aperçu de l'image envoyée" className="h-full w-full object-cover" />
          </div>
        ) : (
          <span className="text-4xl transition-transform group-hover:scale-110">📷</span>
        )}

        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {preview ? "Cliquez ou déposez une autre image" : "Cliquez ou déposez une image ici"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Formats supportés : JPG, PNG, WEBP, BMP — 8 Mo maximum
        </p>
      </div>

      {error && (
        <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8 text-sm text-slate-500 dark:text-slate-400">
          <span className="animate-spin-slow h-8 w-8 rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-700 dark:border-t-indigo-400" />
          Recherche des articles visuellement similaires...
        </div>
      )}

      {results && !loading && (
        <div className="animate-fade-in-up flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {results.length > 0
              ? `${results.length} résultat${results.length > 1 ? "s" : ""} similaire${results.length > 1 ? "s" : ""}`
              : "Aucun résultat trouvé"}
          </h2>
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {results.map((item, i) => (
                <div
                  key={item.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <ImageCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

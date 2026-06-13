"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { LabelCount } from "@/lib/api";

interface CatalogFiltersProps {
  labels: LabelCount[];
}

export default function CatalogFilters({ labels }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set("page", "1");
    router.push(`/catalog?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <select
          defaultValue={searchParams.get("label") ?? ""}
          onChange={(e) => updateParams({ label: e.target.value })}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Toutes les catégories</option>
          {labels.map(({ label, count }) => (
            <option key={label} value={label}>
              {label} ({count})
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="relative sm:w-48">
        <select
          defaultValue={searchParams.get("kids") ?? ""}
          onChange={(e) => updateParams({ kids: e.target.value })}
          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Adultes et enfants</option>
          <option value="false">Adultes</option>
          <option value="true">Enfants</option>
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

import type { ClothingItemWithSimilarity } from "@/lib/api";

interface ImageCardProps {
  item: ClothingItemWithSimilarity;
}

export default function ImageCard({ item }: ImageCardProps) {
  return (
    <Link
      href={`/catalog/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={item.imageUrl}
          alt={`Article ${item.label}`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {typeof item.similarity === "number" && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow backdrop-blur">
            {Math.round(item.similarity * 100)}%
          </span>
        )}

        {item.kids && (
          <span className="absolute left-2 top-2 rounded-full bg-fuchsia-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow backdrop-blur">
            Enfant
          </span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center p-3">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:group-hover:bg-indigo-900">
          {item.label}
        </span>
      </div>
    </Link>
  );
}

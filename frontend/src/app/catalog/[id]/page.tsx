import Image from "next/image";
import { notFound } from "next/navigation";

import ImageCard from "@/components/ImageCard";
import { getImage, getSimilarImages } from "@/lib/api";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await getSimilarImages(id, 12).catch(() => null);
  const item = data?.item ?? (await getImage(id).catch(() => null));

  if (!item) {
    notFound();
  }

  const similar = data?.similar ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="animate-fade-in-up grid gap-6 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 shadow-md dark:bg-slate-800">
          <Image
            src={item.imageUrl}
            alt={`Article ${item.label}`}
            fill
            sizes="220px"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            {item.label}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {item.label}
            </span>
            {item.kids && (
              <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                Section enfant
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Identifiant : <span className="font-mono">{item.id}</span>
          </p>
        </div>
      </section>

      <section className="animate-fade-in-up delay-100">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Articles visuellement similaires (embeddings CNN)
        </h2>
        {similar.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.map((s, i) => (
              <div
                key={s.id}
                className="animate-scale-in"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <ImageCard item={s} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun article similaire disponible.
          </p>
        )}
      </section>
    </div>
  );
}

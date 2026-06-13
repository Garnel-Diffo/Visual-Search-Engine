import CatalogFilters from "@/components/CatalogFilters";
import ImageCard from "@/components/ImageCard";
import Pagination from "@/components/Pagination";
import { getImages, getLabels } from "@/lib/api";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const label = typeof params.label === "string" ? params.label : "";
  const kidsParam = typeof params.kids === "string" ? params.kids : "";
  const page = Number(params.page) || 1;

  const [{ items, totalPages, totalItems }, { labels }] = await Promise.all([
    getImages({
      label: label || undefined,
      kids: kidsParam === "true" ? true : kidsParam === "false" ? false : undefined,
      page,
      perPage: 24,
    }),
    getLabels(),
  ]);

  function buildHref(targetPage: number) {
    const query = new URLSearchParams();
    if (label) query.set("label", label);
    if (kidsParam) query.set("kids", kidsParam);
    query.set("page", String(targetPage));
    return `/catalog?${query.toString()}`;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Catalogue d&apos;articles
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {totalItems.toLocaleString("fr-FR")} images issues du Clothing Dataset
        </p>
      </div>

      <div className="animate-fade-in-up delay-100">
        <CatalogFilters labels={labels} />
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="animate-scale-in"
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <ImageCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
          <span className="text-3xl">🔍</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun article trouvé.</p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}

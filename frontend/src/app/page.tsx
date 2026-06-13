import Link from "next/link";

import SearchUploader from "@/components/SearchUploader";
import { getLabels } from "@/lib/api";

export default async function HomePage() {
  const { labels } = await getLabels();
  const totalItems = labels.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="relative overflow-hidden">
      {/* Decorative animated background blobs */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20"
      />
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
        <section className="animate-fade-in-up flex flex-col gap-4 text-center">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            Démo interactive · Recherche par similarité visuelle
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Trouvez des articles similaires par{" "}
            <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              recherche d&apos;image (CNN)
            </span>
          </h1>
          <p className="mx-auto max-w-3xl text-balance text-slate-600 dark:text-slate-300">
            Ce démonstrateur utilise un <strong>réseau de neurones convolutif pré-entraîné</strong>{" "}
            (transfert d&apos;apprentissage) pour encoder les images en vecteurs de
            caractéristiques, puis retrouve les articles du{" "}
            <strong>Clothing Dataset</strong> les plus visuellement proches par similarité
            cosinus.
          </p>
        </section>

        <section className="animate-fade-in-up delay-100 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            Rechercher par image
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Envoyez une photo de vêtement pour découvrir les articles les plus similaires parmi
            les <strong className="text-indigo-600 dark:text-indigo-400">{totalItems.toLocaleString("fr-FR")}</strong>{" "}
            images du catalogue.
          </p>
          <SearchUploader />
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon="🧠"
            delay="delay-100"
            title="Transfert d'apprentissage"
            description="Un CNN (ResNet/MobileNet) pré-entraîné sur ImageNet extrait des représentations vectorielles riches, sans ré-entraînement nécessaire."
          />
          <FeatureCard
            icon="📐"
            delay="delay-200"
            title="Similarité cosinus"
            description="Les embeddings sont normalisés (L2) puis comparés par similarité cosinus pour retrouver les images les plus proches du catalogue."
          />
          <FeatureCard
            icon="⚡"
            delay="delay-300"
            title="Inférence ONNX légère"
            description="Le modèle est exporté au format ONNX et exécuté via ONNX Runtime, pour une recherche rapide et un backend léger (sans PyTorch)."
          />
        </section>

        <section className="animate-fade-in-up delay-300 text-center">
          <Link
            href="/catalog"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0"
          >
            Parcourir le catalogue d&apos;images
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${delay} group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-xl transition-transform group-hover:scale-110 dark:bg-indigo-950">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

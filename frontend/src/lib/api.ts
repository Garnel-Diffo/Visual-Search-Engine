// Client API minimal pour communiquer avec le backend Flask (moteur de recherche visuelle).

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface ClothingItem {
  id: string;
  label: string;
  kids: boolean;
  imageUrl: string;
}

export interface ClothingItemWithSimilarity extends ClothingItem {
  similarity?: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface PaginatedItems {
  items: ClothingItem[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

async function apiFetch<T>(path: string, init: RequestInit = {}, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    next: revalidate >= 0 ? { revalidate } : undefined,
  });

  if (!res.ok) {
    let message = `Erreur API (${res.status}) sur ${path}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore: réponse non-JSON
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function getImages(
  params: { label?: string; kids?: boolean; page?: number; perPage?: number } = {}
) {
  const query = new URLSearchParams();
  if (params.label) query.set("label", params.label);
  if (params.kids !== undefined) query.set("kids", String(params.kids));
  if (params.page) query.set("page", String(params.page));
  if (params.perPage) query.set("perPage", String(params.perPage));

  const qs = query.toString();
  return apiFetch<PaginatedItems>(`/api/images${qs ? `?${qs}` : ""}`, {}, 300);
}

export function getLabels() {
  return apiFetch<{ labels: LabelCount[] }>("/api/images/labels", {}, 3600);
}

export function getImage(imageId: string) {
  return apiFetch<ClothingItem>(`/api/images/${imageId}`, {}, 300);
}

export function getSimilarImages(imageId: string, k = 12) {
  return apiFetch<{ item: ClothingItem; similar: ClothingItemWithSimilarity[] }>(
    `/api/images/${imageId}/similar?k=${k}`,
    {},
    300
  );
}

export async function searchByImage(file: File, k = 12) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/api/search?k=${k}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let message = `Erreur API (${res.status}) sur /api/search`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore: réponse non-JSON
    }
    throw new Error(message);
  }

  return res.json() as Promise<{ results: ClothingItemWithSimilarity[] }>;
}

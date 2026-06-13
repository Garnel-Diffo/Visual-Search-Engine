"""Service d'index vectoriel : recherche par similarité cosinus sur les embeddings du catalogue.

Les embeddings (`image_embeddings.npy`) sont pré-calculés une fois pour toutes par le
notebook pour les ~5 400 images du catalogue et sont déjà normalisés (norme L2 = 1) :
la similarité cosinus se réduit donc à un simple produit scalaire, calculable très
rapidement avec NumPy (aucune dépendance lourde type FAISS n'est nécessaire pour ce volume
de données).
"""

import os

import numpy as np
import pandas as pd


class VisualIndex:
    """Encapsule les embeddings du catalogue et la correspondance avec les métadonnées."""

    def __init__(self, artifacts_dir):
        self.embeddings = np.load(os.path.join(artifacts_dir, "image_embeddings.npy"))
        self.metadata = pd.read_csv(os.path.join(artifacts_dir, "metadata.csv"))

        # item_index -> position dans le tableau d'embeddings (les deux coïncident par
        # construction, mais on garde la correspondance explicite pour robustesse).
        self._index_to_row = {int(idx): i for i, idx in enumerate(self.metadata["item_index"])}

    @property
    def n_items(self):
        return self.embeddings.shape[0]

    @property
    def embedding_dim(self):
        return self.embeddings.shape[1]

    def search(self, query_embedding, k=12, exclude_item_index=None):
        """Retourne les `k` images du catalogue les plus proches du vecteur `query_embedding`."""
        sims = self.embeddings @ query_embedding

        if exclude_item_index is not None:
            row = self._index_to_row.get(int(exclude_item_index))
            if row is not None:
                sims = sims.copy()
                sims[row] = -np.inf

        k = min(k, self.n_items)
        top_rows = np.argpartition(-sims, k - 1)[:k]
        top_rows = top_rows[np.argsort(-sims[top_rows])]

        return [
            {"itemIndex": int(self.metadata.iloc[row]["item_index"]), "similarity": float(sims[row])}
            for row in top_rows
        ]

    def similar_to(self, item_index, k=12):
        """Retourne les `k` images les plus proches de `item_index` (similarité cosinus)."""
        row = self._index_to_row.get(int(item_index))
        if row is None:
            return []
        query_embedding = self.embeddings[row]
        return self.search(query_embedding, k=k + 1, exclude_item_index=item_index)[:k]

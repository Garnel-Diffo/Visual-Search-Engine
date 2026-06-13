"""Script de peuplement de la base PostgreSQL (Neon) à exécuter une seule fois (ou après
un ré-entraînement / ré-export du modèle).

Ce script :
1. Crée la table `clothing_items` si elle n'existe pas.
2. Charge les métadonnées du catalogue exportées par le notebook
   (`model_artifacts/metadata.csv` : item_index, image_id, label, kids).
3. Insère/met à jour chaque article avec l'URL de sa vignette, servie statiquement par le
   frontend (`frontend/public/catalog/<image_id>.jpg`) — l'image elle-même n'est pas stockée
   en base.

Usage :
    python -m scripts.populate_db
"""

import os
import sys

import pandas as pd
from dotenv import load_dotenv

# Permet l'exécution directe du script (python scripts/populate_db.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import ClothingItem  # noqa: E402

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "model_artifacts")


def populate_clothing_items():
    print("Chargement des métadonnées du catalogue...")
    metadata = pd.read_csv(os.path.join(ARTIFACTS_DIR, "metadata.csv"))
    print(f"  articles trouvés : {len(metadata)}")

    existing_by_image_id = {item.image_id: item for item in ClothingItem.query.all()}

    inserted = 0
    for _, row in metadata.iterrows():
        image_id = str(row["image_id"])
        item = existing_by_image_id.get(image_id) or ClothingItem(image_id=image_id)
        item.item_index = int(row["item_index"])
        item.label = str(row["label"])
        item.kids = bool(row["kids"])
        item.image_url = f"/catalog/{image_id}.jpg"
        db.session.add(item)
        inserted += 1
        if inserted % 500 == 0:
            db.session.commit()
            print(f"  ... {inserted}/{len(metadata)} articles traités")

    db.session.commit()
    print(f"Articles insérés/mis à jour : {inserted}")


def main():
    app = create_app(os.environ.get("FLASK_ENV", "development"))
    with app.app_context():
        db.create_all()
        populate_clothing_items()

    print("Peuplement de la base de données terminé.")


if __name__ == "__main__":
    main()

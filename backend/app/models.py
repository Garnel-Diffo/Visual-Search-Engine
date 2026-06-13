"""Modèles SQLAlchemy : métadonnées du catalogue d'images.

Conformément à la consigne, les images elles-mêmes ne sont pas stockées en base : seules
les métadonnées (catégorie, identifiant, index dans la matrice d'embeddings, URL de la
vignette servie par le frontend) sont persistées dans PostgreSQL.
"""

from .extensions import db


class ClothingItem(db.Model):
    """Métadonnées d'un article du catalogue (Clothing Dataset)."""

    __tablename__ = "clothing_items"

    id = db.Column(db.Integer, primary_key=True)
    image_id = db.Column(db.String(36), unique=True, nullable=False, index=True)
    item_index = db.Column(db.Integer, nullable=False, unique=True, index=True)
    label = db.Column(db.String(50), nullable=False, index=True)
    kids = db.Column(db.Boolean, nullable=False, default=False)
    image_url = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.image_id,
            "label": self.label,
            "kids": self.kids,
            "imageUrl": self.image_url,
        }

"""Endpoint de santé, utile pour Render et pour le frontend (vérification de connexion)."""

from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    index = current_app.visual_index
    return jsonify({
        "status": "ok",
        "model": {
            "nItems": index.n_items,
            "embeddingDim": index.embedding_dim,
        },
    })

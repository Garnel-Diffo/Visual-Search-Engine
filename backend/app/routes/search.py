"""Endpoint de recherche visuelle : upload d'une image -> encodage -> images similaires."""

from flask import Blueprint, current_app, jsonify, request

from ..models import ClothingItem

search_bp = Blueprint("search", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "bmp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@search_bp.route("/search", methods=["POST"])
def search_by_image():
    """Reçoit une image (multipart/form-data, champ `image`) et retourne les articles
    du catalogue les plus visuellement similaires."""
    if "image" not in request.files:
        return jsonify({"error": "Aucune image reçue (champ 'image' attendu)."}), 400

    file = request.files["image"]
    if not file.filename:
        return jsonify({"error": "Fichier vide."}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": "Format d'image non supporté (jpg, png, webp, bmp)."}), 400

    image_bytes = file.read()
    if not image_bytes:
        return jsonify({"error": "Fichier vide."}), 400

    encoder = current_app.image_encoder
    visual_index = current_app.visual_index
    k = min(current_app.config["MAX_TOP_K"], request.args.get("k", current_app.config["DEFAULT_TOP_K"], type=int))

    try:
        embedding = encoder.encode(image_bytes)
    except Exception:
        return jsonify({"error": "Impossible de lire cette image."}), 400

    matches = visual_index.search(embedding, k=k)

    indices = [m["itemIndex"] for m in matches]
    items_by_index = {
        i.item_index: i for i in ClothingItem.query.filter(ClothingItem.item_index.in_(indices)).all()
    }

    results = []
    for m in matches:
        item = items_by_index.get(m["itemIndex"])
        if item is None:
            continue
        results.append({**item.to_dict(), "similarity": round(m["similarity"], 4)})

    return jsonify({"results": results})

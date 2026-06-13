"""Endpoints relatifs au catalogue d'images : liste paginée, détails, images similaires."""

from flask import Blueprint, current_app, jsonify, request

from ..extensions import db
from ..models import ClothingItem

images_bp = Blueprint("images", __name__)


@images_bp.route("/images", methods=["GET"])
def list_images():
    """Liste paginée du catalogue, avec filtre par catégorie et par section (adulte/enfant)."""
    label = request.args.get("label", "", type=str).strip()
    kids = request.args.get("kids", "", type=str).strip().lower()
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(60, max(1, request.args.get("perPage", 24, type=int)))

    query = ClothingItem.query
    if label:
        query = query.filter(ClothingItem.label == label)
    if kids in ("true", "false"):
        query = query.filter(ClothingItem.kids.is_(kids == "true"))

    query = query.order_by(ClothingItem.item_index.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [item.to_dict() for item in pagination.items],
        "page": pagination.page,
        "perPage": per_page,
        "totalItems": pagination.total,
        "totalPages": pagination.pages,
    })


@images_bp.route("/images/labels", methods=["GET"])
def list_labels():
    """Retourne la liste des catégories de vêtements disponibles, avec le nombre d'articles."""
    rows = (
        db.session.query(ClothingItem.label, db.func.count(ClothingItem.id))
        .group_by(ClothingItem.label)
        .order_by(ClothingItem.label.asc())
        .all()
    )
    return jsonify({"labels": [{"label": label, "count": count} for label, count in rows]})


@images_bp.route("/images/<image_id>", methods=["GET"])
def get_image(image_id):
    item = ClothingItem.query.filter_by(image_id=image_id).first_or_404()
    return jsonify(item.to_dict())


@images_bp.route("/images/<image_id>/similar", methods=["GET"])
def similar_images(image_id):
    """Images les plus proches de `image_id` dans l'espace des représentations vectorielles."""
    visual_index = current_app.visual_index
    k = min(current_app.config["MAX_TOP_K"], request.args.get("k", current_app.config["DEFAULT_TOP_K"], type=int))

    item = ClothingItem.query.filter_by(image_id=image_id).first_or_404()
    similar = visual_index.similar_to(item.item_index, k=k)

    indices = [r["itemIndex"] for r in similar]
    items_by_index = {
        i.item_index: i for i in ClothingItem.query.filter(ClothingItem.item_index.in_(indices)).all()
    }

    results = []
    for r in similar:
        match = items_by_index.get(r["itemIndex"])
        if match is None:
            continue
        results.append({**match.to_dict(), "similarity": round(r["similarity"], 4)})

    return jsonify({"item": item.to_dict(), "similar": results})

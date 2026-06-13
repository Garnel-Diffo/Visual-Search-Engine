"""Fabrique de l'application Flask (application factory)."""

import os

from flask import Flask, jsonify
from flask_cors import CORS

from .config import config_by_name
from .extensions import db
from .routes import register_routes
from .services.encoder import ImageEncoder
from .services.index import VisualIndex


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "production")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(env, config_by_name["production"]))

    # Extensions
    db.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    # Artefacts exportés par le notebook : encodeur ONNX + index vectoriel du catalogue
    app.image_encoder = ImageEncoder(app.config["MODEL_ARTIFACTS_DIR"])
    app.visual_index = VisualIndex(app.config["MODEL_ARTIFACTS_DIR"])

    # Routes
    register_routes(app)

    @app.route("/")
    def index():
        return jsonify({
            "name": "Visual-Search-Engine API",
            "description": "API Flask de recherche visuelle par similarité d'images (Clothing Dataset)",
            "endpoints": [
                "/api/health",
                "/api/images",
                "/api/images/<image_id>",
                "/api/images/<image_id>/similar",
                "/api/images/labels",
                "/api/search",
            ],
        })

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Ressource non trouvée"}), 404

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify({"error": "Image trop volumineuse."}), 413

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"error": "Erreur interne du serveur"}), 500

    return app

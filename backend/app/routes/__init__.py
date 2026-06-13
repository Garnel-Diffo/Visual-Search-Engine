"""Enregistrement de tous les blueprints de l'API."""

from .health import health_bp
from .images import images_bp
from .search import search_bp


def register_routes(app):
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(images_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")

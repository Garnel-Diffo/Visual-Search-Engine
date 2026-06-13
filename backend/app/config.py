"""Configuration de l'application Flask, chargée depuis les variables d'environnement."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    """Configuration commune à tous les environnements."""

    # Base de données PostgreSQL (Neon)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Artefacts du modèle d'encodage d'images (exportés par le notebook)
    MODEL_ARTIFACTS_DIR = os.environ.get(
        "MODEL_ARTIFACTS_DIR", str(BASE_DIR / "model_artifacts")
    )

    # Origines autorisées pour le frontend (CORS), séparées par des virgules
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Nombre de résultats de recherche visuelle par défaut / maximum
    DEFAULT_TOP_K = int(os.environ.get("DEFAULT_TOP_K", "12"))
    MAX_TOP_K = int(os.environ.get("MAX_TOP_K", "50"))

    # Taille maximale des images envoyées pour la recherche visuelle (Mo)
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "8")) * 1024 * 1024


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}

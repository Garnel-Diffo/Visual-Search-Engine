"""Service d'encodage d'images : transforme une image en représentation vectorielle.

Le modèle utilisé est le backbone CNN sélectionné dans `notebook/visual_search_engine.ipynb`,
exporté au format ONNX. ONNX Runtime permet une inférence rapide et légère en production,
sans dépendre de PyTorch (qui n'est nécessaire que pour l'extraction hors ligne effectuée
dans le notebook).

Le prétraitement (redimensionnement, recadrage central, normalisation ImageNet) doit être
strictement identique à celui utilisé lors de l'extraction des embeddings du catalogue,
sous peine de dégrader la qualité de la recherche par similarité.
"""

import io
import os

import numpy as np
import onnxruntime as ort
from PIL import Image

# Doit correspondre exactement au prétraitement utilisé dans le notebook pour produire
# `image_embeddings.npy`.
INPUT_SIZE = 224
RESIZE_SIZE = 256
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class ImageEncoder:
    """Encapsule le modèle ONNX d'extraction de représentations vectorielles d'images."""

    def __init__(self, artifacts_dir):
        model_path = os.path.join(artifacts_dir, "encoder.onnx")
        self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        self.embedding_dim = self.session.get_outputs()[0].shape[-1]

    @staticmethod
    def _preprocess(image: Image.Image) -> np.ndarray:
        """Redimensionne, recadre et normalise une image PIL (RGB) -> tenseur NCHW (1,3,224,224)."""
        image = image.convert("RGB")

        # Redimensionnement du plus petit côté à RESIZE_SIZE, en conservant le ratio
        w, h = image.size
        scale = RESIZE_SIZE / min(w, h)
        new_w, new_h = round(w * scale), round(h * scale)
        image = image.resize((new_w, new_h), Image.BILINEAR)

        # Recadrage central à INPUT_SIZE x INPUT_SIZE
        left = (new_w - INPUT_SIZE) // 2
        top = (new_h - INPUT_SIZE) // 2
        image = image.crop((left, top, left + INPUT_SIZE, top + INPUT_SIZE))

        array = np.asarray(image, dtype=np.float32) / 255.0
        array = (array - IMAGENET_MEAN) / IMAGENET_STD
        array = array.transpose(2, 0, 1)  # HWC -> CHW
        return np.expand_dims(array, axis=0)  # -> NCHW

    def encode(self, image_bytes: bytes) -> np.ndarray:
        """Encode une image (bytes) en un vecteur normalisé (norme L2 = 1)."""
        image = Image.open(io.BytesIO(image_bytes))
        tensor = self._preprocess(image)

        outputs = self.session.run([self.output_name], {self.input_name: tensor})
        embedding = outputs[0][0].astype(np.float32)

        norm = np.linalg.norm(embedding)
        if norm > 1e-10:
            embedding = embedding / norm
        return embedding

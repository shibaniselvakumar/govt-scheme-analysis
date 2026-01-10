# llm/local_llm.py

from gpt4all import GPT4All
from sentence_transformers import SentenceTransformer
import numpy as np
from pathlib import Path


class LocalLLM:
    def __init__(self):
        self.model = GPT4All(
            model_name="Phi-3.5-mini-instruct-Q4_K_M.gguf",
            model_path=Path(
                "C:\\Users\\shibs\\OneDrive\\Desktop\\Projects\\CIP\\models"
            ),
            allow_download=False
        )

        self.embedder = SentenceTransformer(
            "sentence-transformers/all-mpnet-base-v2"
        )  # 768-d

    def generate(self, prompt: str, max_tokens: int = 256) -> str:
        with self.model.chat_session():
            return self.model.generate(prompt, max_tokens=max_tokens)

    def get_embedding(self, text: str) -> np.ndarray:
        return self.embedder.encode(text, normalize_embeddings=True)

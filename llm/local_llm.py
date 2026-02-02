# llm/local_llm.py

from gpt4all import GPT4All
from sentence_transformers import SentenceTransformer
import numpy as np
from pathlib import Path


class LocalLLM:
    def __init__(self):
        # Create models directory if it doesn't exist
        models_dir = Path("../models")
        models_dir.mkdir(exist_ok=True)

        self.model = GPT4All(
            model_name="Phi-3.5-mini-instruct-Q4_K_M.gguf",
            model_path=models_dir,
            allow_download=False  # Allow download if model not found
        )

        # models_dir = Path("C:/Users/shibs/OneDrive/Desktop/Projects/CIP/models")

        # # Full path to the GGUF model file
        # model_file = models_dir / "mistral-7b-instruct-v0.2.Q4_K_M.gguf"

        # self.model = GPT4All(
        #     model_name=str(model_file),  # Pass full path as string
        #     model_path=None,             # Set to None when using full path
        #     allow_download=False
        # )


        self.embedder = SentenceTransformer(
            "sentence-transformers/all-mpnet-base-v2"
        )  # 768-d

    def generate(self, prompt: str, max_tokens: int = 256) -> str:
        with self.model.chat_session():
            return self.model.generate(prompt, max_tokens=max_tokens, temp=0.1)

    def get_embedding(self, text: str) -> np.ndarray:
        return self.embedder.encode(text, normalize_embeddings=True)
    
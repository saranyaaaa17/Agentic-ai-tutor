
import os
import json
import numpy as np
from openai import OpenAI
from typing import List, Dict, Any, Optional

class MemoryManager:
    """
    Manages user interactions and embeddings for context-aware responses.
    """
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        
        # Simple In-Memory Vector Store for now
        # Format: { user_id: [ {"text": "...", "vector": [], "metadata": {}} ] }
        self.memory_store: Dict[str, List] = {}
        
        # Embedding model
        self.model = "text-embedding-3-small"

    def _get_embedding(self, text: str) -> List[float]:
        if not self.client:
            print("[MemoryManager] ⚠️ OPENAI_API_KEY Missing. Embeddings disabled.")
            return []
            
        try:
            res = self.client.embeddings.create(input=[text], model=self.model)
            return res.data[0].embedding
        except Exception as e:
            print(f"[MemoryManager] ❌ Embedding Error: {e}")
            return []

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2: return 0.0
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def add_memory(self, user_id: str, text: str, metadata: Dict[str, Any] = None):
        if not user_id:
            user_id = "anonymous"
            
        vector = self._get_embedding(text)
        if not vector: return

        if user_id not in self.memory_store:
            self.memory_store[user_id] = []
            
        self.memory_store[user_id].append({
            "text": text,
            "vector": vector,
            "metadata": metadata or {},
            "timestamp": "now" # In real app use time.time()
        })
        print(f"[MemoryManager] 🧠 Stored memory for user {user_id}")

    def retrieve_similar(self, user_id: str, query_text: str, top_k: int = 3) -> List[Dict]:
        if user_id not in self.memory_store or not self.client:
            return []
            
        query_vector = self._get_embedding(query_text)
        if not query_vector: return []

        memories = self.memory_store[user_id]
        
        # Calculate similarities
        scored_memories = []
        for mem in memories:
            score = self._cosine_similarity(query_vector, mem["vector"])
            scored_memories.append((score, mem))
        
        # Sort desc
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        
        # Return top k results
        return [m[1] for m in scored_memories[:top_k]]

# Singleton
memory_manager = MemoryManager()

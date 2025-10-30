from __future__ import annotations

import os
from typing import Iterable, List, Sequence

from langchain_community.vectorstores import FAISS
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import OpenAI

from ..config import AppConfig


class AIChatService:
    def __init__(self, config: AppConfig):
        if not config.openai.api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is required")
        self.config = config
        self.client = OpenAI(api_key=config.openai.api_key)
        self.embeddings = OpenAIEmbeddings(openai_api_key=config.openai.api_key)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
        )

        os.makedirs(config.vector_dir, exist_ok=True)
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = os.path.join("visualization-aidece", "prompts", "system_prompt.txt")
        with open(prompt_path, "r", encoding="utf-8") as fp:
            return fp.read().strip()

    def _build_vector_store(self, documents: Iterable[dict]) -> FAISS | None:
        texts: List[str] = []
        metadatas: List[dict] = []
        for doc in documents:
            chunks = self.text_splitter.split_text(doc.get("content", ""))
            for chunk in chunks:
                if not chunk.strip():
                    continue
                texts.append(chunk)
                metadatas.append(doc.get("metadata", {}))
        if not texts:
            return None
        return FAISS.from_texts(texts=texts, embedding=self.embeddings, metadatas=metadatas)

    def generate(self, question: str, history: Sequence[dict[str, str]], documents: Iterable[dict]):
        document_list = list(documents)
        vector_store = self._build_vector_store(document_list)
        context_items: List[dict] = []
        context_snippets: List[str] = []

        if vector_store is not None:
            retriever = vector_store.as_retriever(search_kwargs={"k": 6})
            retrieved_docs = retriever.get_relevant_documents(question)
            for doc in retrieved_docs:
                payload = {
                    "text": doc.page_content,
                    "metadata": doc.metadata,
                }
                context_items.append(payload)
                if isinstance(doc.metadata, dict):
                    filename = doc.metadata.get("filename")
                    label = filename or doc.metadata.get("document_id") or "Dokumen"
                else:
                    label = "Dokumen"
                context_snippets.append(f"Sumber: {label}\n{doc.page_content}")
        else:
            for doc in document_list:
                text = doc.get("content", "")
                if not text:
                    continue
                metadata = doc.get("metadata", {})
                context_items.append({"text": text, "metadata": metadata})
                if isinstance(metadata, dict):
                    label = metadata.get("filename") or metadata.get("document_id") or "Dokumen"
                else:
                    label = "Dokumen"
                context_snippets.append(f"Sumber: {label}\n{text}")

        limited_snippets = context_snippets[:4]
        if limited_snippets:
            formatted_context = "\n\n".join(limited_snippets)
            user_prompt = (
                "Gunakan konteks berikut untuk menjawab pertanyaan pengguna. Jika informasi tidak tersedia, jelaskan data yang diperlukan.\n\n"
                f"{formatted_context}\n\nPertanyaan: {question}"
            )
        else:
            user_prompt = question

        message_payload: List[dict[str, str]] = [{"role": "system", "content": self.system_prompt}]
        message_payload.extend(history)
        message_payload.append({"role": "user", "content": user_prompt})

        response = self.client.responses.create(
            model=self.config.openai.model,
            temperature=self.config.openai.temperature,
            input=message_payload,
        )

        return {
            "answer": response.output_text,
            "context": context_items,
        }

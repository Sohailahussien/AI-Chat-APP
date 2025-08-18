import os
from typing import Any, List
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

# Load environment variables from .env.local
load_dotenv('../../.env.local')

from rag_impl import (
    init_clients,
    ensure_index,
    ingest_texts,
    ingest_file,
    query_text,
)


app = FastAPI()


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


class QueryResponse(BaseModel):
    ids: List[str]
    distances: List[float]
    metadatas: List[Any]
    documents: List[str]


@app.on_event("startup")
def startup() -> None:
    # Uses env: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX
    init_clients()
    ensure_index()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(
    file: UploadFile | None = File(None),
    file_path: str | None = Form(None),
    source: str | None = Form(None),
) -> dict:
    if file is None and not file_path:
        raise HTTPException(status_code=400, detail="Provide either file upload or file_path")

    if file is not None:
        # Save upload to a local temp path, then ingest
        uploads_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        tmp_path = os.path.join(uploads_dir, file.filename)
        data = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(data)
        return ingest_file(tmp_path, source=source or file.filename)

    # file_path mode
    return ingest_file(file_path, source=source)


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    return query_text(req.query, top_k=req.top_k)  # type: ignore[return-value]



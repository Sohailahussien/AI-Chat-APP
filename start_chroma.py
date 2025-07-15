from chromadb.config import Settings
import chromadb
import os

# Create the data directory if it doesn't exist
os.makedirs("chroma_db", exist_ok=True)

# Initialize the Chroma client with persistence
client = chromadb.PersistentClient(
    path="chroma_db",
    settings=Settings(
        allow_reset=True,
        is_persistent=True
    )
)

print("Chroma server is running. Press Ctrl+C to stop.") 
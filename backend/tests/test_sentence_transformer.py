from sentence_transformers import SentenceTransformer
import torch
import sys
import importlib.metadata # 用于获取包版本

print(f"Python version: {sys.version}")
print(f"PyTorch version: {torch.__version__}")
try:
    st_version = importlib.metadata.version('sentence-transformers')
except importlib.metadata.PackageNotFoundError:
    st_version = "unknown (package not found by importlib.metadata)"
print(f"SentenceTransformers version: {st_version}")

model_name = 'all-MiniLM-L6-v2'
# model_name = 'BAAI/bge-base-en-v1.5' # 让我们直接用这个有问题的模型测试

print(f"Attempting to load model: {model_name}")
try:
    model = SentenceTransformer(model_name)
    print(f"Model {model_name} loaded successfully. Type: {type(model)}")
    
    test_sentences = ["This is a test sentence.", "Another test sentence."]
    print(f"Attempting to encode sentences: {test_sentences}")
    
    embeddings = model.encode(test_sentences, batch_size=16, show_progress_bar=True)
    
    print(f"Sentences encoded successfully.")
    print(f"Shape of embeddings: {embeddings.shape}")
    print(f"First embedding vector (first 5 elements): {embeddings[0][:5]}")
    
except Exception as e:
    print(f"An error occurred: {e}")
    import traceback
    traceback.print_exc()

print("Test script finished.") 
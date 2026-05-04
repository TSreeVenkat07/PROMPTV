import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

models_to_test = ["models/embedding-001", "models/gemini-embedding-001", "text-embedding-004", "models/text-embedding-004"]

for model in models_to_test:
    try:
        res = client.models.embed_content(model=model, contents="test")
        print(f"Model {model}: Success")
    except Exception as e:
        print(f"Model {model}: Failed - {e}")

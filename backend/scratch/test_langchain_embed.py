import os
import asyncio
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

async def test_langchain_embeddings():
    api_key = os.getenv("GEMINI_API_KEY")
    # Testing the model that worked in the previous test
    model_name = "models/gemini-embedding-001"
    
    print(f"Testing LangChain with {model_name}...")
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model=model_name,
            google_api_key=api_key
        )
        vector = await embeddings.aembed_query("test prompt for RAG")
        print(f"Success! Vector length: {len(vector)}")
    except Exception as e:
        print(f"Failed with {model_name}: {e}")

if __name__ == "__main__":
    asyncio.run(test_langchain_embeddings())

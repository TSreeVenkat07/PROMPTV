import os
import asyncio
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

async def test_langchain_768():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = "models/gemini-embedding-001"
    
    print(f"Testing LangChain with {model_name} and truncation...")
    try:
        # LangChain's GoogleGenerativeAIEmbeddings doesn't directly expose output_dimensionality in the constructor for all versions
        # But we can try to pass it via model_kwargs or check if it's supported
        embeddings = GoogleGenerativeAIEmbeddings(
            model=model_name,
            google_api_key=api_key,
            # task_type="retrieval_query" # Some versions use this
        )
        vector = await embeddings.aembed_query("test")
        print(f"Default length: {len(vector)}")
        
        # If it's 3072, we need to find a way to get 768 or truncate it (Google allows truncation by just taking the first N elements)
        # However, it's better to use the API's dimensionality parameter if possible.
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_langchain_768())

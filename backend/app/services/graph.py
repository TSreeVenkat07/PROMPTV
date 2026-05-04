from typing import Annotated, TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
import json
import re
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.logging import logger

# Define the state for our graph
class GraphState(TypedDict):
    mode: str
    input_text: str
    phase_1_perception: Optional[Dict[str, Any]]
    phase_2_structuring: Optional[Dict[str, Any]]
    phase_3_analysis: Optional[Dict[str, Any]]
    phase_4_insights: Optional[Dict[str, Any]]
    final_json: Optional[str]

import time
from google import genai
from google.genai import types

# --- DYNAMIC ALIAS CONFIGURATION ---
# Using "-latest" aliases is the secret to bypassing regional 404s on free keys.
MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
]

def imperial_engine_node(state: GraphState):
    """
    DIRECT INTELLIGENCE ENGINE (V18.0):
    Switches to pure English headers to eliminate JSON-parsing glitches.
    """
    mode = state.get("mode", "analyze")
    input_text = state["input_text"]
    
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # --- PHASE 1: DISCOVERY ---
    authorized_models = []
    try:
        for m in client.models.list():
            authorized_models.append(m.name)
    except: pass

    if not authorized_models:
        authorized_models = ["models/gemini-1.5-flash", "models/gemini-pro"]

    master_prompt = f"""### IMPERIAL REASONING PROTOCOL (V18.0)
You are the Supreme Architect of Prompts. Refine the input into 4 clear sections.
Use the exact headers below:

[PERCEPTION]
(Describe your initial understanding here)

[STRUCTURING]
(Decompose the request into components here)

[ANALYSIS]
(Provide deep market and technical analysis here)

[REFINED PROMPT]
(Provide the final, high-quality professional prompt here)

MODE: {mode}
INPUT: {input_text}

IMPORTANT: Do NOT use JSON. Do NOT use brackets. Use PLAIN ENGLISH only."""

    # --- PHASE 2: EXECUTION ---
    prioritized = [m for m in authorized_models if "2.5-flash" in m] + \
                  [m for m in authorized_models if "2.0-flash" in m] + \
                  [m for m in authorized_models if "flash" in m and "1.5" in m] + \
                  [m for m in authorized_models if "pro" in m] + \
                  authorized_models

    for model_name in prioritized:
        try:
            logger.info(f"Imperial Engine: Trying {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=master_prompt,
                config=types.GenerateContentConfig(temperature=0.2)
            )
            
            full_text = response.text
            
            # --- ROBUST HEADER EXTRACTION ---
            sections = {
                "PERCEPTION": "Analysis complete.",
                "STRUCTURING": "Structuring finished.",
                "ANALYSIS": "Deep analysis performed.",
                "REFINED PROMPT": full_text
            }
            
            # Use regex to find sections between [HEADERS]
            for header in sections.keys():
                pattern = rf"\[{header}\]\s*(.*?)(?=\[|$)"
                match = re.search(pattern, full_text, re.DOTALL | re.IGNORECASE)
                if match:
                    sections[header] = match.group(1).strip()

            state.update({
                "phase_1_perception": {"text": sections["PERCEPTION"]},
                "phase_2_structuring": {"text": sections["STRUCTURING"]},
                "phase_3_analysis": {"text": sections["ANALYSIS"]},
                "phase_4_insights": {"refined_prompt": sections["REFINED PROMPT"]},
                "final_json": sections["REFINED PROMPT"]
            })
            return state
            
        except Exception:
            continue

    state["final_json"] = "System reset. Please try again."
    return state

# --- Build Simplified Graph ---
workflow = StateGraph(GraphState)
workflow.add_node("engine", imperial_engine_node)
workflow.set_entry_point("engine")
workflow.add_edge("engine", END)

app_graph = workflow.compile()

async def run_reasoning_graph(text: str, mode: str):
    """Entry point for the consolidated reasoning engine."""
    inputs = {"input_text": text, "mode": mode}
    final_state = await app_graph.ainvoke(inputs)
    
    output_dict = {
        "phase_1_perception": final_state.get("phase_1_perception"),
        "phase_2_structuring": final_state.get("phase_2_structuring"),
        "phase_3_analysis": final_state.get("phase_3_analysis"),
        "phase_4_insights": final_state.get("phase_4_insights")
    }
    return json.dumps(output_dict)


import sys
import os
print("Current directory:", os.getcwd())
print("sys.path:", sys.path)
try:
    from agents.llm_utils import llm_service
    print("Imported agents.llm_utils successfully")
except ImportError as e:
    print("Could not import agents.llm_utils:", e)
    try:
        from llm_utils import llm_service
        print("Imported llm_utils successfully")
    except ImportError as e2:
        print("Could not import llm_utils:", e2)

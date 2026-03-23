
import math

def calculate(expression: str) -> str:
    """Safely evaluates a basic mathematical expression."""
    try:
        # Restriction: Only allow safe math tokens
        allowed_names = {
            "sin": math.sin, "cos": math.cos, "tan": math.tan, 
            "sqrt": math.sqrt, "pi": math.pi, "e": math.e, 
            "log": math.log, "pow": pow
        }
        # A very simple and safe evaluation for demo purposes
        # In a real app, use a proper parser like SymPy
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Error evaluating: {str(e)}"

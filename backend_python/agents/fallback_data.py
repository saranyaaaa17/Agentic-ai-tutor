
FALLBACK_QUESTIONS = {
    "dsa": [
        {
            "id": "f1",
            "q": "What is the time complexity of searching an element in a Balanced Binary Search Tree (BST)?",
            "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            "ans": "O(log n)",
            "explanation": "In a balanced BST, the height is log n, so searching takes logarithmic time.",
            "hint": "Think about how many nodes you skip at each step.",
            "difficulty": "medium",
            "time_limit": 60,
            "concept": "Binary Search Tree"
        },
        {
            "id": "f2",
            "q": "Which data structure uses the LIFO (Last-In-First-Out) principle?",
            "options": ["Queue", "Stack", "Linked List", "Hash Table"],
            "ans": "Stack",
            "explanation": "A stack follows LIFO where the last element added is the first one to be removed.",
            "hint": "Think of a stack of plates.",
            "difficulty": "easy",
            "time_limit": 30,
            "concept": "Stack"
        },
        {
            "id": "f3",
            "q": "What is the worst-case time complexity of QuickSort?",
            "options": ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
            "ans": "O(n^2)",
            "explanation": "Worst case occurs when the pivot is always the smallest or largest element (e.g., sorted array).",
            "hint": "It happens when the partitioning is very unbalanced.",
            "difficulty": "medium",
            "time_limit": 60,
            "concept": "Sorting"
        },
        {
            "id": "f4",
            "q": "What is the space complexity of a recursive DFS on a binary tree with 'h' height?",
            "options": ["O(1)", "O(n)", "O(h)", "O(log n)"],
            "ans": "O(h)",
            "explanation": "The call stack grows proportionally to the height of the tree.",
            "hint": "Think about the recursion depth.",
            "difficulty": "medium",
            "time_limit": 60,
            "concept": "Graph Traversal"
        },
        {
            "id": "f5",
            "q": "Which of the following is NOT a stable sorting algorithm by default?",
            "options": ["Merge Sort", "Insertion Sort", "Quick Sort", "Bubble Sort"],
            "ans": "Quick Sort",
            "explanation": "Quick Sort is typically not stable because its partitioning step can swap identical elements.",
            "hint": "Think about element relative order.",
            "difficulty": "hard",
            "time_limit": 120,
            "concept": "Sorting"
        }
    ],
    "python": [
        {
            "id": "p1",
            "q": "What is the result of '2' + '2' in Python?",
            "options": ["4", "22", "Error", "None"],
            "ans": "22",
            "explanation": "In Python, adding two strings performs concatenation.",
            "hint": "Strings are not integers.",
            "difficulty": "easy",
            "time_limit": 30,
            "concept": "Strings"
        },
        {
            "id": "p2",
            "q": "What is the primary difference between a List and a Tuple in Python?",
            "options": ["List is ordered, Tuple is not", "List is mutable, Tuple is immutable", "Tuple uses square brackets", "No difference"],
            "ans": "List is mutable, Tuple is immutable",
            "explanation": "Lists can be modified after creation, while tuples cannot.",
            "hint": "Can you append to a Tuple?",
            "difficulty": "easy",
            "time_limit": 30,
            "concept": "Data Types"
        },
        {
            "id": "p3",
            "q": "What does the 'self' keyword represent in a Python class method?",
            "options": ["The class itself", "The instance of the class", "A global variable", "A private method"],
            "ans": "The instance of the class",
            "explanation": "'self' refers to the specific object upon which the method is called.",
            "hint": "It represents 'the object itself'.",
            "difficulty": "medium",
            "time_limit": 45,
            "concept": "OOP"
        }
    ],
    "web": [
        {
            "id": "w1",
            "q": "Which React hook is used to handle local component state?",
            "options": ["useEffect", "useContext", "useState", "useMemo"],
            "ans": "useState",
            "explanation": "useState allows you to add state to functional components.",
            "hint": "Think about 'State Management'.",
            "difficulty": "easy",
            "time_limit": 30,
            "concept": "React Hooks"
        }
    ],
    "ml": [
        {
            "id": "m1",
            "q": "In Machine Learning, what is 'Overfitting'?",
            "options": ["The model is too simple", "The model performs well on training data but poorly on test data", "The model is too accurate", "The model training is too slow"],
            "ans": "The model performs well on training data but poorly on test data",
            "explanation": "Overfitting happens when a model learns noise in the training data rather than the actual pattern.",
            "hint": "Think about generalization.",
            "difficulty": "medium",
            "time_limit": 60,
            "concept": "Model Evaluation"
        }
    ]
}

FALLBACK_ANALYSIS = {
    "proficiency_level": "Intermediate (Static Fallback)",
    "proficiency_description": "We are currently using offline analysis due to high service demand. Based on your score, you have a solid foundation but should focus on corner cases.",
    "strong_concepts": ["Fundamentals", "Logic"],
    "weak_concepts": ["Advanced Optimization", "Edge Cases"],
    "priority_concepts": ["Time Complexity"],
    "risk_level": "medium",
    "thinking_pattern": "Balanced cognitive engagement with some hesitation in optimization.",
    "gap_analysis": "You demonstrated good understanding of the core concepts, but there is room for improvement in understanding the underlying performance implications.",
    "recommended_focus": "Complexity Analysis",
    "recommendation_reason": "Mastering O-notation is critical for high-performance engineering.",
    "learning_path_suggestion": ["Study Big-O Notation", "Practice Space-Time Tradeoffs"]
}


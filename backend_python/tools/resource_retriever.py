class ResourceRetriever:
    def __init__(self):
        self.catalog = [
            {
                "title": "Striver's A to Z DSA Course",
                "platform": "YouTube",
                "url": "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_9Z7",
                "description": "Comprehensive roadmap from basics to advanced interview-level data structures and algorithms.",
                "covered_concepts": ["Arrays", "Linked List", "Trees", "Graphs", "Recursion"],
                "tags": ["dsa", "arrays", "linked list", "trees", "graphs", "recursion", "algorithms"],
            },
            {
                "title": "NeetCode DSA Roadmap",
                "platform": "NeetCode",
                "url": "https://neetcode.io/roadmap",
                "description": "A practical roadmap that helps learners move from foundations to interview patterns topic by topic.",
                "covered_concepts": ["Arrays", "Sliding Window", "Binary Search", "Trees"],
                "tags": ["dsa", "arrays", "binary search", "sliding window", "trees", "algorithms"],
            },
            {
                "title": "Abdul Bari Algorithms Playlist",
                "platform": "YouTube",
                "url": "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZghAJkzBW6UqwOTf7u3lH",
                "description": "Strong conceptual explanations for algorithms, complexity, and recursive thinking.",
                "covered_concepts": ["Big O", "Sorting", "Searching", "Divide & Conquer"],
                "tags": ["algorithms", "complexity", "big o", "sorting", "searching", "recursion"],
            },
            {
                "title": "Striver Dynamic Programming Series",
                "platform": "YouTube",
                "url": "https://www.youtube.com/playlist?list=PLgUwDviBIf0qUlt5H_kiKYaNSqJ81PMMY",
                "description": "Step-by-step dynamic programming path from memoization to advanced patterns.",
                "covered_concepts": ["Dynamic Programming", "Memoization", "Tabulation"],
                "tags": ["dynamic programming", "dp", "memoization", "tabulation", "recursion"],
            },
            {
                "title": "The Odin Project Full Stack JavaScript",
                "platform": "The Odin Project",
                "url": "https://www.theodinproject.com/paths/full-stack-javascript",
                "description": "Project-based full stack JavaScript curriculum for frontend and backend growth.",
                "covered_concepts": ["JavaScript", "React", "Node.js", "Express"],
                "tags": ["web", "javascript", "react", "node", "express", "frontend", "backend"],
            },
            {
                "title": "React Official Learn Docs",
                "platform": "React.dev",
                "url": "https://react.dev/learn",
                "description": "Official modern React learning path for components, hooks, state, and effects.",
                "covered_concepts": ["React", "Hooks", "State Management"],
                "tags": ["react", "hooks", "components", "state", "frontend"],
            },
            {
                "title": "MDN JavaScript Guide",
                "platform": "MDN",
                "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
                "description": "Trusted reference and guide for core JavaScript language mechanics.",
                "covered_concepts": ["JavaScript", "Objects", "Async JS", "ES6+"],
                "tags": ["javascript", "async", "objects", "web", "frontend"],
            },
            {
                "title": "Machine Learning Specialization",
                "platform": "Coursera",
                "url": "https://www.coursera.org/specializations/machine-learning-introduction",
                "description": "Foundational machine learning path for regression, classification, and core modeling intuition.",
                "covered_concepts": ["Machine Learning", "Regression", "Neural Networks"],
                "tags": ["machine learning", "ml", "ai", "regression", "classification", "neural networks"],
            },
            {
                "title": "StatQuest Machine Learning Playlist",
                "platform": "YouTube",
                "url": "https://www.youtube.com/@statquest/videos",
                "description": "Excellent visual explanations for ML, probability, trees, and evaluation metrics.",
                "covered_concepts": ["Decision Trees", "Probability", "Linear Regression"],
                "tags": ["machine learning", "ml", "decision trees", "probability", "statistics"],
            },
            {
                "title": "SQLBolt Interactive SQL",
                "platform": "SQLBolt",
                "url": "https://sqlbolt.com/",
                "description": "Interactive SQL lessons ideal for query fundamentals and joins practice.",
                "covered_concepts": ["SELECT", "JOINs", "Aggregates"],
                "tags": ["sql", "dbms", "database", "joins", "aggregates"],
            },
            {
                "title": "Khan Academy Intro to SQL",
                "platform": "Khan Academy",
                "url": "https://www.khanacademy.org/computing/computer-programming/sql",
                "description": "Beginner-friendly path for SQL, schema design, and database reasoning.",
                "covered_concepts": ["SQL", "Schema Design", "Databases"],
                "tags": ["sql", "database", "dbms", "schema"],
            },
            {
                "title": "Neso Academy Operating Systems",
                "platform": "YouTube",
                "url": "https://www.youtube.com/@nesoacademy/videos",
                "description": "Clear OS coverage for processes, deadlocks, scheduling, and memory management.",
                "covered_concepts": ["Operating Systems", "Processes", "Deadlocks", "Memory Management"],
                "tags": ["os", "operating systems", "processes", "deadlocks", "memory"],
            },
        ]

    def _score_resource(self, resource, search_terms):
        haystack = " ".join(
            [
                resource.get("title", ""),
                resource.get("description", ""),
                " ".join(resource.get("covered_concepts", [])),
                " ".join(resource.get("tags", [])),
            ]
        ).lower()
        return sum(2 for term in search_terms if term and term in haystack)

    def get_resources(self, topic: str, weak_concepts: list):
        search_terms = []
        if topic:
            search_terms.extend(part.strip().lower() for part in str(topic).replace("(", ",").replace(")", ",").replace("/", ",").split(","))
        if weak_concepts:
            search_terms.extend(str(concept).strip().lower() for concept in weak_concepts)

        search_terms = [term for term in search_terms if term]
        ranked = []

        for resource in self.catalog:
            score = self._score_resource(resource, search_terms)
            if score > 0:
                ranked.append((score, resource))

        ranked.sort(key=lambda item: item[0], reverse=True)
        if ranked:
            return [resource for _, resource in ranked[:4]]

        dsa_defaults = [resource for resource in self.catalog if "dsa" in resource.get("tags", [])]
        return dsa_defaults[:3]


resource_retriever = ResourceRetriever()

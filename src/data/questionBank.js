
export const questionBank = {
  // === DSA Mastery (dsa_hard) ===
  dsa_hard: [
    { id: 1, q: "What is the time complexity of searching in a Balanced Binary Search Tree?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], ans: "O(log n)", difficulty: "medium", hint: "Think about binary search logic." },
    { id: 2, q: "Which data structure uses LIFO principle?", options: ["Queue", "Stack", "Linked List", "Tree"], ans: "Stack", difficulty: "easy", hint: "Last In, First Out." },
    { id: 3, q: "Which algorithm finds the shortest path in a weighted graph with no negative edges?", options: ["BFS", "DFS", "Dijkstra's Algorithm", "Bellman-Ford"], ans: "Dijkstra's Algorithm", difficulty: "medium", hint: "Greedy shortest path." },
    { id: 4, q: "What is the worst-case time complexity of Quick Sort?", options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"], ans: "O(n^2)", difficulty: "hard", hint: "Unbalanced partitioning." },
    { id: 5, q: "In a Hash Map, what is a 'collision'?", options: ["Two keys map to same index", "Memory leak", "Infinite loop", "Data deletion"], ans: "Two keys map to same index", difficulty: "medium", hint: "Hashing output clash." },
    { id: 6, q: "What is the space complexity of a recursive Fibonacci function without memoization?", options: ["O(1)", "O(n)", "O(2^n)", "O(log n)"], ans: "O(n)", difficulty: "medium", hint: "Think of the recursion depth/call stack." },
    { id: 7, q: "Which data structure is most efficient for implementing a priority queue?", options: ["Array", "Linked List", "Heap", "Binary Search Tree"], ans: "Heap", difficulty: "medium", hint: "Efficient min/max retrieval." },
    { id: 8, q: "What is the primary characteristic of a 'v-table' in C++?", options: ["Static memory", "Dynamic dispatch (polymorphism)", "Compile-time optimization", "Memory leak prevention"], ans: "Dynamic dispatch (polymorphism)", difficulty: "hard", hint: "Used for virtual functions." },
    { id: 9, q: "In a Graph, what is a 'cycle'?", options: ["A path that starts and ends at the same vertex", "A disconnected component", "A path between all nodes", "A directed edge"], ans: "A path that starts and ends at the same vertex", difficulty: "easy", hint: "Think of a loop." },
    { id: 10, q: "What is the time complexity to insert an element at the beginning of a Linked List?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], ans: "O(1)", difficulty: "easy", hint: "No need to shift elements." }
  ],

  // === Machine Learning (ml) ===
  ml: [
    { id: 301, q: "Which algorithm is used for 'unsupervised' learning?", options: ["Linear Regression", "K-Means Clustering", "SVM", "Random Forest"], ans: "K-Means Clustering", difficulty: "medium", hint: "Finding patterns in unlabeled data." },
    { id: 302, q: "What is 'Overfitting' in ML?", options: ["Model is too simple", "Model performs well on training data but poorly on test data", "Model cannot learn the noise", "Model training is too fast"], ans: "Model performs well on training data but poorly on test data", difficulty: "medium", hint: "Generalization vs Memorization." },
    { id: 303, q: "What is a 'Perceptron'?", options: ["A type of database", "A single-layer neural network", "A sorting algorithm", "A data cleaning tool"], ans: "A single-layer neural network", difficulty: "easy", hint: "The building block of neural nets." },
    { id: 304, q: "Which activation function is most commonly used in hidden layers of Deep Neural Networks?", options: ["Sigmoid", "Tanh", "ReLU", "Softmax"], ans: "ReLU", difficulty: "medium", hint: "Solves vanishing gradient problem." },
    { id: 305, q: "What is the purpose of a 'Validation Set'?", options: ["Final testing", "To tune hyperparameters", "To train the model", "To clean data"], ans: "To tune hyperparameters", difficulty: "medium", hint: "Intermediate check during training." },
    { id: 306, q: "In ML, what does 'NLP' stand for?", options: ["Natural Learning Protocol", "Neural Language Process", "Natural Language Processing", "Node Link Parsing"], ans: "Natural Language Processing", difficulty: "easy" },
    { id: 307, q: "What is 'Precision' in classification?", options: ["TP / (TP + FP)", "TP / (TP + FN)", "All Correct / All", "None of these"], ans: "TP / (TP + FP)", difficulty: "medium", hint: "Of those predicted positive, how many are actually positive?" },
    { id: 308, q: "Which of these is a 'Bias-Variance' tradeoff symptom?", options: ["High Bias leads to Overfitting", "High Variance leads to Underfitting", "High Bias leads to Underfitting", "Low Variance leads to Overfitting"], ans: "High Bias leads to Underfitting", difficulty: "hard", hint: "Think about simplicity vs complexity." },
    { id: 309, q: "What is 'Cross-Validation'?", options: ["Merging two datasets", "Splitting data multiple times to evaluate model", "Using an LLM for checking", "Comparing two models"], ans: "Splitting data multiple times to evaluate model", difficulty: "medium", hint: "k-fold." },
    { id: 310, q: "Which loss function is usually used for Binary Classification?", options: ["MSE", "Cross-Entropy", "Absolute Error", "Hinge Loss"], ans: "Cross-Entropy", difficulty: "hard", hint: "Log-loss." }
  ],

  // === Web Development (web) ===
  web: [
    { id: 401, q: "Which hook is used to perform side effects in React?", options: ["useState", "useEffect", "useContext", "useMemo"], ans: "useEffect", difficulty: "easy", hint: "API calls, etc." },
    { id: 402, q: "In CSS, what does 'box-sizing: border-box' do?", options: ["Includes padding/border in total width", "Adds a border", "Makes box circular", "Prevents overflow"], ans: "Includes padding/border in total width", difficulty: "medium", hint: "Calculation of size." },
    { id: 403, q: "What is 'Redux' used for?", options: ["Styling", "Routing", "Global State Management", "Database"], ans: "Global State Management", difficulty: "medium", hint: "Centralized store." },
    { id: 404, q: "What is the virtual DOM in React?", options: ["A browser tool", "A lightweight copy of the real DOM", "The actual HTML", "A CSS framework"], ans: "A lightweight copy of the real DOM", difficulty: "easy", hint: "Used for performance optimization." },
    { id: 405, q: "What does 'lifting state up' mean in React?", options: ["Moving state to a child", "Moving state to the parent", "Deleting state", "Using Redux"], ans: "Moving state to the parent", difficulty: "medium", hint: "Sharing state among siblings." },
    { id: 406, q: "Which HTTP status code means 'Not Found'?", options: ["200", "404", "500", "302"], ans: "404", difficulty: "easy" },
    { id: 407, q: "What is a 'Closure' in JavaScript?", options: ["A function with its lexical environment", "Closing a tab", "The end of a loop", "A private class"], ans: "A function with its lexical environment", difficulty: "hard", hint: "Inner function accessing outer scope." },
    { id: 408, q: "What is 'Event Bubbling'?", options: ["Events moving down to children", "Events moving up to parents", "Events being deleted", "Random events"], ans: "Events moving up to parents", difficulty: "medium", hint: "Propagation." },
    { id: 409, q: "What does JSX stand for?", options: ["Java Syntax XML", "JavaScript XML", "JSON Syntax Extension", "None"], ans: "JavaScript XML", difficulty: "easy" },
    { id: 410, q: "In Node.js, what is the 'Buffer' class used for?", options: ["Styling", "Handling binary data", "Routing", "Database connection"], ans: "Handling binary data", difficulty: "hard" }
  ],

  // === Databases (dbms) ===
  dbms: [
    { id: 501, q: "What does ACID stand for in databases?", options: ["Atomicity, Consistency, Isolation, Durability", "Access, Command, Info, Data", "Auto, Command, Index, Disk", "None"], ans: "Atomicity, Consistency, Isolation, Durability", difficulty: "medium", hint: "Reliable transactions." },
    { id: 502, q: "What is a 'Primary Key'?", options: ["A server key", "Unique identifier for a row", "Null key", "First column"], ans: "Unique identifier for a row", difficulty: "easy" },
    { id: 503, q: "What is 'Normalization'?", options: ["Increasing redundancy", "Reducing redundancy/dependency", "Sorting data", "Formatting text"], ans: "Reducing redundancy/dependency", difficulty: "medium", hint: "1NF, 2NF, 3NF..." },
    { id: 504, q: "What is a 'Foreign Key'?", options: ["A key from another country", "A field in a table that refers to Primary Key of another table", "A secret key", "None"], ans: "A field in a table that refers to Primary Key of another table", difficulty: "easy" },
    { id: 505, q: "Which SQL clause is used to filter records during a join?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], ans: "WHERE", difficulty: "easy" },
    { id: 506, q: "What is 'Indexing' in a database?", options: ["Alphabetical sorting", "Data structure to speed up retrieval", "Deleting unused rows", "Backing up data"], ans: "Data structure to speed up retrieval", difficulty: "medium", hint: "B-Trees." },
    { id: 507, q: "What is a 'Deadlock' in DBMS?", options: ["Database crash", "Circular waiting between transactions", "Empty table", "None"], ans: "Circular waiting between transactions", difficulty: "medium" },
    { id: 508, q: "What is the difference between TRUNCATE and DELETE?", options: ["TRUNCATE is DDL, DELETE is DML", "DELETE is irreversible", "TRUNCATE is slower", "No difference"], ans: "TRUNCATE is DDL, DELETE is DML", difficulty: "hard", hint: "One resets identities, the other doesn't." },
    { id: 509, q: "What is 'NoSQL' primarily known for?", options: ["Being slower than SQL", "Horizontal Scalability & Schema-less data", "Only for small apps", "None"], ans: "Horizontal Scalability & Schema-less data", difficulty: "medium" },
    { id: 510, q: "Which normal form deals with Transitive Dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], ans: "3NF", difficulty: "hard" }
  ],

  // === Operating Systems (os) ===
  os: [
    { id: 601, q: "What is a deadlock?", options: ["Process finish", "Two+ processes stuck waiting for each other", "OS crash", "Low RAM"], ans: "Two+ processes stuck waiting for each other", difficulty: "medium", hint: "Circular waiting." },
    { id: 602, q: "What is 'Thrashing'?", options: ["Idle CPU", "Excessive paging leading to low CPU use", "Disk error", "Kill process"], ans: "Excessive paging leading to low CPU use", difficulty: "hard", hint: "Memory too low for working set." },
    { id: 603, q: "What is a 'Process'?", options: ["A program in execution", "A text file", "A piece of hardware", "A user"], ans: "A program in execution", difficulty: "easy" },
    { id: 604, q: "Which scheduling algorithm is non-preemptive by nature?", options: ["SJFR", "Round Robin", "FCFS", "Multi-level Queue"], ans: "FCFS", difficulty: "easy", hint: "First come first served." },
    { id: 605, q: "What is 'Virtual Memory'?", options: ["Extra RAM", "Technique to use disk as extra RAM address space", "Graphics memory", "None"], ans: "Technique to use disk as extra RAM address space", difficulty: "medium" },
    { id: 606, q: "What is a 'System Call'?", options: ["Calling customer support", "Interface between process and OS kernel", "A hardware click", "A binary file"], ans: "Interface between process and OS kernel", difficulty: "medium" },
    { id: 607, q: "What is 'Starvation' in scheduling?", options: ["Low CPU power", "Process waits indefinitely for resources", "The PC shutting down", "None"], ans: "Process waits indefinitely for resources", difficulty: "medium" },
    { id: 608, q: "Which part of the OS manages interrupts?", options: ["Compiler", "Kernel", "Shell", "IDE"], ans: "Kernel", difficulty: "easy" },
    { id: 609, q: "What is 'Belady's Anomaly'?", options: ["Page faults increase with more frames", "CPU slows down with more RAM", "Memory leak", "None"], ans: "Page faults increase with more frames", difficulty: "hard", hint: "Associated with FIFO page replacement." },
    { id: 610, q: "What is a 'Daemon' in Linux?", options: ["A virus", "A background process", "A user", "A folder"], ans: "A background process", difficulty: "medium" }
  ],

  // === General Programming (programming) ===
  programming: [
    { id: 101, q: "In JavaScript, what 'typeof null' returns?", options: ["null", "undefined", "object", "number"], ans: "object", difficulty: "easy", hint: "A famous JS quirk." },
    { id: 102, q: "What is the result of '2' + 2 in JavaScript?", options: ["4", "22", "Error", "None"], ans: "22", difficulty: "easy" },
    { id: 103, q: "In Python, which is a mutable type?", options: ["Integer", "String", "List", "Tuple"], ans: "List", difficulty: "easy" },
    { id: 104, q: "What does 'SOLID' stand for in OOP?", options: ["5 design principles", "Fast code", "Static Order Link ID", "Simple Object Logic"], ans: "5 design principles", difficulty: "medium" },
    { id: 105, q: "Which keyword is used for inheritance in Java?", options: ["implements", "extends", "inherits", "using"], ans: "extends", difficulty: "easy" },
    { id: 106, q: "What is 'Recursion'?", options: ["A loop", "A function calling itself", "A memory leak", "A type of sorting"], ans: "A function calling itself", difficulty: "easy" },
    { id: 107, q: "Which of these is a Python 'List Comprehension'?", options: ["[x for x in data]", "list(data)", "{x: x}", "None"], ans: "[x for x in data]", difficulty: "medium" },
    { id: 108, q: "What is 'Garbage Collection'?", options: ["Deleting files", "Automatic memory management", "Reformatting disk", "None"], ans: "Automatic memory management", difficulty: "medium" },
    { id: 109, q: "In C++, what is a 'Smart Pointer'?", options: ["A pointer that deletes itself", "A pointer with an AI", "A fast pointer", "None"], ans: "A pointer that deletes itself", difficulty: "hard", hint: "unique_ptr, shared_ptr." },
    { id: 110, q: "What is 'Asynchronous' programming?", options: ["Running tasks in parallel without blocking", "Running tasks step-by-step", "A type of database", "None"], ans: "Running tasks in parallel without blocking", difficulty: "medium" }
  ],

  // === Default Fallbacks ===
  system_design: [
    { id: 201, q: "What is 'Vertical Scaling'?", options: ["Adding machines", "Adding CPU/RAM to one machine", "Sharding", "None"], ans: "Adding CPU/RAM to one machine", difficulty: "medium" },
    { id: 202, q: "What is 'Latency'?", options: ["Throughput", "Delay before transfer starts", "Storage size", "None"], ans: "Delay before transfer starts", difficulty: "easy" },
    { id: 203, q: "Which tool is commonly used as a Cache?", options: ["MySQL", "Redis", "Kafka", "Docker"], ans: "Redis", difficulty: "medium" },
    { id: 204, q: "What is 'Sharding'?", options: ["Splitting db into pieces horizontally", "Vertical scaling", "Backing up data", "None"], ans: "Splitting db into pieces horizontally", difficulty: "hard" },
    { id: 205, q: "What is a 'Load Balancer'?", options: ["Distributes traffic", "Compresses images", "Speeds up CPU", "None"], ans: "Distributes traffic", difficulty: "easy" }
  ]
};




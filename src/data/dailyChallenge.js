
// Challenges Pool for Daily Rotation
export const challengesPool = [
  {
    id: "reverse-nodes-in-k-group",
    title: "Reverse Nodes in k-Group",
    difficulty: "Hard",
    points: 450,
    domain: "dsa",
    description: "Given a list of integers and a group size k, reverse the list in groups of k. If the final group has fewer than k elements, leave it as-is.",
    inputFormat: ["Line 1: Space-separated integers representing the linked list.", "Line 2: Integer k."],
    outputFormat: "Print the transformed list as space-separated integers.",
    constraints: ["1 <= number of nodes <= 100", "1 <= k <= number of nodes"],
    examples: [{ input: "1 2 3 4 5\n2", output: "2 1 4 3 5" }],
    starterCode: {
      python: "def solve(values, k):\n    # Logic\n    return values",
      javascript: "function solve(values, k) {\n    return values;\n}"
    }
  },
  {
    id: "running-sum-arrays",
    title: "Running Sum of 1D Array",
    difficulty: "Easy",
    points: 100,
    domain: "dsa",
    description: "Given an array, return the running sum of the array where runningSum[i] = sum(nums[0]...nums[i]).",
    inputFormat: ["Line 1: Space-separated integers."],
    outputFormat: "Space-separated running sums.",
    constraints: ["1 <= nums.length <= 1000"],
    examples: [{ input: "1 2 3 4", output: "1 3 6 10" }],
    starterCode: {
      python: "def solve(values):\n    return values",
      javascript: "function solve(values) {\n    return values;\n}"
    }
  },
  {
    id: "two-sum-problem",
    title: "Two Sum Indices",
    difficulty: "Medium",
    points: 250,
    domain: "programming-problems",
    description: "Find the indices of two numbers that add up to a specific target.",
    inputFormat: ["Line 1: Space-separated integers.", "Line 2: Target integer."],
    outputFormat: "Two indices separated by space.",
    constraints: ["2 <= nums.length <= 1000", "Target varies"],
    examples: [{ input: "2 7 11 15\n9", output: "0 1" }],
    starterCode: {
      python: "def solve(values, target):\n    return [0, 1]",
      javascript: "function solve(values, target) {\n    return [0, 1];\n}"
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    points: 150,
    domain: "logic-problems",
    description: "Determine if the input string containing brackets is valid (balanced and correctly nested).",
    inputFormat: ["Line 1: String of brackets (,),[,],{,}."],
    outputFormat: "True or False.",
    constraints: ["1 <= s.length <= 10000"],
    examples: [{ input: "()[]{}", output: "True" }],
    starterCode: {
      python: "def solve(s):\n    return True",
      javascript: "function solve(s) {\n    return true;\n}"
    }
  },
  {
     id: "subarray-product-less-than-k",
     title: "Subarray Product Less Than K",
     difficulty: "Hard",
     points: 400,
     domain: "dsa",
     description: "Count the number of contiguous subarrays where the product of elements is strictly less than k.",
     inputFormat: ["Line 1: Space-separated integers.", "Line 2: Integer k."],
     outputFormat: "Single integer count.",
     constraints: ["1 <= nums.length <= 30000", "0 <= k <= 10^6"],
     examples: [{ input: "10 5 2 6\n100", output: "8" }],
     starterCode: {
       python: "def solve(nums, k):\n    return 0",
       javascript: "function solve(nums, k) {\n    return 0;\n}"
     }
  }
];

// Fallback for direct imports
export const dailyChallenge = challengesPool[0];

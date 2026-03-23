const PYTHON_REVERSE_K_GROUP = `def solve():
    values = list(map(int, input().split()))
    k = int(input().strip())

    result = []
    for start in range(0, len(values), k):
        group = values[start:start + k]
        if len(group) == k:
            result.extend(group[::-1])
        else:
            result.extend(group)

    print(" ".join(map(str, result)))


if __name__ == "__main__":
    solve()
`;

const PYTHON_RUNNING_SUM = `def solve():
    values = list(map(int, input().split()))
    running = []
    total = 0

    for value in values:
        total += value
        running.append(total)

    print(" ".join(map(str, running)))


if __name__ == "__main__":
    solve()
`;

const PYTHON_TWO_SUM = `def solve():
    values = list(map(int, input().split()))
    target = int(input().strip())
    seen = {}

    for index, value in enumerate(values):
        needed = target - value
        if needed in seen:
            print(seen[needed], index)
            return
        seen[value] = index

    print(-1)


if __name__ == "__main__":
    solve()
`;

const challengeBank = {
  "programming-problems": [
    {
      id: "coding_running_sum",
      type: "coding",
      language: "python",
      q: "Given a list of integers, print the running sum after each element.",
      prompt:
        "Input format:\\nLine 1: space-separated integers\\n\\nOutput format:\\nPrint the running sum sequence as space-separated integers.",
      hint: "Keep one cumulative total and update it once per element.",
      difficulty: "easy",
      time_limit: 240,
      starter_code: PYTHON_RUNNING_SUM,
      sample_input: "1 2 3 4",
      sample_output: "1 3 6 10",
      visible_tests: [
        { input: "1 2 3 4", output: "1 3 6 10" },
        { input: "5 -2 7", output: "5 3 10" }
      ],
      hidden_tests: [
        { input: "9", output: "9" },
        { input: "2 2 2 2", output: "2 4 6 8" }
      ],
      explanation: "Track the cumulative total as you iterate and print the sequence."
    },
    {
      id: "coding_two_sum_indices",
      type: "coding",
      language: "python",
      q: "Given an integer array and a target, print the indices of the first pair whose sum equals the target.",
      prompt:
        "Input format:\\nLine 1: space-separated integers\\nLine 2: target integer\\n\\nOutput format:\\nPrint the two indices separated by a space, or -1 if no pair exists.",
      hint: "A hash map lets you check the needed complement in constant time.",
      difficulty: "medium",
      time_limit: 300,
      starter_code: PYTHON_TWO_SUM,
      sample_input: "2 7 11 15\\n9",
      sample_output: "0 1",
      visible_tests: [
        { input: "2 7 11 15\\n9", output: "0 1" },
        { input: "3 2 4\\n6", output: "1 2" }
      ],
      hidden_tests: [
        { input: "1 2 3\\n7", output: "-1" },
        { input: "10 5 8 3\\n11", output: "1 2" }
      ],
      explanation: "Store seen values with their indices and look up the needed complement."
    }
  ],
  "dsa-problems": [
    {
      id: "coding_reverse_k_group",
      type: "coding",
      language: "python",
      q: "Reverse the array values in groups of k. Leave the final group unchanged if it has fewer than k elements.",
      prompt:
        "Input format:\\nLine 1: space-separated integers\\nLine 2: integer k\\n\\nOutput format:\\nPrint the transformed sequence as space-separated integers.",
      hint: "Process the array in slices of size k and only reverse complete groups.",
      difficulty: "hard",
      time_limit: 360,
      starter_code: PYTHON_REVERSE_K_GROUP,
      sample_input: "1 2 3 4 5\\n2",
      sample_output: "2 1 4 3 5",
      visible_tests: [
        { input: "1 2 3 4 5\\n2", output: "2 1 4 3 5" },
        { input: "1 2 3 4 5\\n3", output: "3 2 1 4 5" }
      ],
      hidden_tests: [
        { input: "10 20 30 40\\n4", output: "40 30 20 10" },
        { input: "7 8 9\\n5", output: "7 8 9" }
      ],
      explanation: "Reverse only full-size chunks and append leftover items unchanged."
    }
  ]
};

const shuffleArray = (items) => [...items].sort(() => Math.random() - 0.5);

export const injectCodingChallenges = (questions = [], domain = "") => {
  const pool = challengeBank[domain] || [];
  if (pool.length === 0 || questions.length === 0) return questions;

  const codingCount = Math.min(2, Math.max(1, Math.floor(questions.length / 4)));
  const codingChallenges = shuffleArray(pool)
    .slice(0, codingCount)
    .map((challenge, index) => ({
      ...challenge,
      id: `${challenge.id}_${index}_${Date.now()}`
    }));

  const mixed = [...questions];
  codingChallenges.forEach((challenge, index) => {
    const insertAt = Math.min(mixed.length, 2 + index * 3);
    mixed.splice(insertAt, 0, challenge);
  });

  return mixed;
};

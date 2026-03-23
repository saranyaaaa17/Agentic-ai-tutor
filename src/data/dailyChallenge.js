export const dailyChallenge = {
  id: "reverse-nodes-in-k-group",
  title: "Reverse Nodes in k-Group",
  difficulty: "Hard",
  points: 450,
  domain: "dsa",
  description:
    "Given a list of integers and a group size k, reverse the list in groups of k. If the final group has fewer than k elements, leave it as-is.",
  inputFormat: [
    "Line 1: Space-separated integers representing the linked list.",
    "Line 2: Integer k."
  ],
  outputFormat: "Print the transformed list as space-separated integers.",
  constraints: [
    "1 <= number of nodes <= 100",
    "1 <= k <= number of nodes",
    "Node values are integers"
  ],
  examples: [
    {
      input: "1 2 3 4 5\n2",
      output: "2 1 4 3 5"
    },
    {
      input: "1 2 3 4 5\n3",
      output: "3 2 1 4 5"
    }
  ],
  sampleTests: [
    {
      name: "Sample 1",
      input: "1 2 3 4 5\n2",
      expectedOutput: "2 1 4 3 5"
    },
    {
      name: "Sample 2",
      input: "1 2 3 4 5\n3",
      expectedOutput: "3 2 1 4 5"
    }
  ],
  hiddenTests: [
    {
      name: "Hidden 1",
      input: "10 20 30 40 50 60\n4",
      expectedOutput: "40 30 20 10 50 60"
    },
    {
      name: "Hidden 2",
      input: "7 9 11 13\n1",
      expectedOutput: "7 9 11 13"
    },
    {
      name: "Hidden 3",
      input: "8 6 7 5 3 0 9\n2",
      expectedOutput: "6 8 5 7 0 3 9"
    }
  ],
  starterCode: {
    python: `def reverse_k_group(values, k):
    # Write your logic here
    return values


def main():
    values = list(map(int, input().split()))
    k = int(input().strip())
    result = reverse_k_group(values, k)
    print(" ".join(map(str, result)))


if __name__ == "__main__":
    main()
`,
    javascript: `function reverseKGroup(values, k) {
  // Write your logic here
  return values;
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\\n/);
const values = input[0].trim().split(/\\s+/).map(Number);
const k = Number(input[1].trim());
const result = reverseKGroup(values, k);
console.log(result.join(" "));
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> reverseKGroup(vector<int> values, int k) {
    // Write your logic here
    return values;
}

int main() {
    string line;
    getline(cin, line);
    stringstream ss(line);
    vector<int> values;
    int value;

    while (ss >> value) {
        values.push_back(value);
    }

    int k;
    cin >> k;

    vector<int> result = reverseKGroup(values, k);

    for (size_t i = 0; i < result.size(); ++i) {
        if (i) cout << " ";
        cout << result[i];
    }

    return 0;
}
`,
    java: `import java.io.*;
import java.util.*;

public class Main {
    static List<Integer> reverseKGroup(List<Integer> values, int k) {
        // Write your logic here
        return values;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] nums = br.readLine().trim().split("\\\\s+");
        int k = Integer.parseInt(br.readLine().trim());
        List<Integer> values = new ArrayList<>();

        for (String num : nums) {
            values.add(Integer.parseInt(num));
        }

        List<Integer> result = reverseKGroup(values, k);
        StringBuilder out = new StringBuilder();

        for (int i = 0; i < result.size(); i++) {
            if (i > 0) out.append(" ");
            out.append(result.get(i));
        }

        System.out.print(out.toString());
    }
}
`
  }
};

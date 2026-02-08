export const learningFacts = [
  {
    id: 1,
    text: "Did you know? Consistent practice on specialized platforms increases interview success rates by 40%."
  },
  {
    id: 2,
    text: "Stat: 70% of top-tier tech interviews prioritize deep conceptual understanding over memorized syntax."
  },
  {
    id: 3,
    text: "Insight: Developers with strong System Design skills tend to earn 30% more on average regardless of their stack."
  },
  {
    id: 4,
    text: "Fact: Solving 1 high-quality problem daily is more effective for long-term retention than cramming 10 problems once a week."
  },
  {
    id: 5,
    text: "Did you know? Interactive learning retains 60% more knowledge compared to passive video watching."
  },
  {
    id: 6,
    text: "Industry Trend: 85% of recruiters look for problem-solving adaptability rather than just framework knowledge."
  },
  {
    id: 7,
    text: "Pro Tip: Debugging your own code without hints builds neural pathways that speed up future problem solving by 2x."
  },
  {
    id: 8,
    text: "Stat: Candidates who practice mock interviews are 3x more likely to land an offer in their top-choice company."
  }
];

export const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * learningFacts.length);
    return learningFacts[randomIndex].text;
};
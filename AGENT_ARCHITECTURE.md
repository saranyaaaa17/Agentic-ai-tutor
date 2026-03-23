# 🤖 Agent Architecture Documentation

## What is an Agent?

An **Agent** is NOT just an API call. It's a structured entity with:

1. **A Role** — What persona/expertise does it embody?
2. **A Goal** — What specific outcome is it trying to achieve?
3. **Thinking (LLM)** — The AI model that powers its reasoning
4. **Tools (Optional)** — External capabilities it can invoke
5. **Workflow** — Where it fits in the orchestration chain

---

## 🧠 Our Agent System

### **1. Teacher Agent**

- **Role**: Patient AI Teacher / Expert Exam Creator
- **Goal**:
  - **Teach Mode**: Explain concepts with examples and practice questions
  - **Assessment Mode**: Generate unique multiple-choice questions
- **Thinks With**: OpenAI GPT-4o-mini
- **Tools**: LLM only (could add: web search, code execution)
- **Workflow**:
  ```
  Frontend → /api/teach → TeacherAgent → Return {explanation, example, question} OR {questions[]}
  ```
- **File**: `backend/agents/teacherAgent.js`

---

### **2. Evaluator Agent**

- **Role**: Strict but fair academic evaluator
- **Goal**: Analyze student answers for correctness, misconceptions, and strengths
- **Thinks With**: OpenAI GPT-4o
- **Tools**: LLM only
- **Workflow**:
  ```
  Frontend → /api/process-answer → EvaluatorAgent → Return {isCorrect, score, misconceptions, strengths, feedback}
  ```
- **File**: `server.js` (function: `evaluateAnswerInternal`)
- **Trigger**: After student submits an answer

---

### **3. Knowledge Gap Agent**

- **Role**: Cognitive diagnosis expert and educational psychologist
- **Goal**: Identify the root cause of errors (conceptual, procedural, application, or careless)
- **Thinks With**: OpenAI GPT-4o
- **Tools**: LLM only
- **Workflow**:
  ```
  EvaluatorAgent Output → KnowledgeGapAgent → Return {gapType, missingConcept, severity, foundational, reasoning}
  ```
- **File**: `server.js` (function: `analyzeKnowledgeGap`)
- **Trigger**: Automatically after EvaluatorAgent completes

---

### **4. Assessment Evaluator Agent**

- **Role**: Educational assessment analyst
- **Goal**: Analyze full assessment performance and provide strategic feedback
- **Thinks With**: OpenAI GPT-4o
- **Tools**: LLM only
- **Workflow**:
  ```
  Frontend → /api/review-assessment → AssessmentEvaluatorAgent → Return {summary, overallPerformance, keyStrengths, keyWeaknesses, studyStrategy}
  ```
- **File**: `server.js` (function: `runAssessmentEvaluator`)
- **Trigger**: After completing full assessment (Product/Service-Based)

---

### **5. Knowledge Gap Aggregation Agent**

- **Role**: Curriculum specialist
- **Goal**: Aggregate all errors into 1-3 specific focus topics for targeted study
- **Thinks With**: OpenAI GPT-4o
- **Tools**: LLM only
- **Workflow**:
  ```
  Assessment Results → KnowledgeGapAggregationAgent → Return {recommendedFocusTopics[]}
  ```
- **File**: `server.js` (function: `runKnowledgeGapAggregation`)
- **Trigger**: Runs in parallel with AssessmentEvaluatorAgent

---

### **6. Question Generation Agent (Adaptive)**

- **Role**: Expert instructional designer and question author
- **Goal**: Generate personalized practice questions targeting specific weaknesses
- **Thinks With**: OpenAI GPT-4o
- **Tools**: LLM only (could add: difficulty calibration, question database)
- **Workflow**:
  ```
  Frontend → /api/generate-adaptive-practice → QuestionGenerationAgent → Return {generatedQuestions[]}
  ```
- **File**: `server.js` (function: `runQuestionGenerationAgent`)
- **Trigger**: User clicks "Start Personalized Practice" after assessment
- **Special**: Uses learner profile history to adjust difficulty dynamically

---

### **7. Profile Manager (Tool, not an LLM agent)**

- **Role**: Data persistence and adaptive logic coordinator
- **Goal**: Track learner weaknesses over time and adjust difficulty
- **Thinks With**: Rule-based logic (NO LLM)
- **Tools**: PostgreSQL database
- **Workflow**:
  ```
  Any assessment completion → saveOrUpdateProfile() → PostgreSQL
  Adaptive practice request → getLearnerProfile() → Prioritize weaknesses by frequency
  ```
- **File**: `server.js` (functions: `getLearnerProfile`, `saveOrUpdateProfile`)
- **Trigger**: After assessment review, before generating adaptive practice

---

## 🔄 Complete Workflow Example: Assessment Journey

```
1. USER starts assessment (e.g., Google Interview Simulation)
   └─> TeacherAgent generates 10 questions (Assessment Mode)

2. USER completes assessment and submits
   └─> AssessmentEvaluatorAgent analyzes performance
   └─> KnowledgeGapAggregationAgent identifies weak topics
   └─> ProfileManager saves to PostgreSQL

3. USER clicks "Start Personalized Practice"
   └─> ProfileManager retrieves historical weaknesses
   └─> Combines with current session gaps
   └─> Adjusts difficulty based on performance trend
   └─> QuestionGenerationAgent creates 3 targeted questions

4. USER answers practice question
   └─> EvaluatorAgent grades it
   └─> KnowledgeGapAgent diagnoses error type
   └─> ProfileManager updates weakness count
```

---

## 🎯 Key Principles

### ✅ What Makes This "Agent Architecture"?

- **Separation of Concerns**: Each agent has ONE job
- **Sequential Orchestration**: Agents call each other in logical order
- **Contextual Awareness**: Agents receive output from previous agents
- **Stateful Memory**: Profile Manager maintains learner state across sessions
- **Graceful Degradation**: If AI fails, static fallbacks ensure app never breaks

### ❌ What This Is NOT:

- ❌ Single monolithic AI prompt
- ❌ Random function calls
- ❌ Hardcoded decision trees
- ❌ "AI wrapper" around static content

---

## 🚀 Future Enhancements

### Add More Tools to Agents:

- **TeacherAgent**: Add web search tool for real-world examples
- **QuestionGenerationAgent**: Add database query tool to avoid duplicate questions
- **EvaluatorAgent**: Add code execution tool for programming questions

### Add More Agents:

- **Motivational Coach Agent**: Analyze performance trends and provide encouragement
- **Curriculum Planner Agent**: Build multi-week study roadmaps
- **Peer Comparison Agent**: Compare user's performance with anonymized cohort data

### Advanced Workflows:

- **Multi-Agent Debate**: Have two TeacherAgents debate a topic, student picks winner
- **Recursive Learning**: If KnowledgeGapAgent finds foundational gap, auto-trigger prerequisite lesson

---

## 📂 File Structure

```
agentic-ai-tutor/
├── backend/
│   ├── agents/
│   │   ├── teacherAgent.js          ← Agent #1
│   │   └── evaluatorAgent.js        ← (To be created for organization)
│   └── routes/
│       └── teach.js                 ← Route handler for TeacherAgent
├── server.js                        ← Agents #2-6 + Orchestration
└── src/
    └── agents/
        └── TeacherAgent.js          ← Frontend facade
```

**Status**: Partially organized. Recommend extracting all server.js agents into `backend/agents/` folder.

---

## 🎓 Example: How TeacherAgent Works

### System Prompt (Defines Role + Goal)

```javascript
const ASSESSMENT_SYSTEM_PROMPT = `
You are an expert exam creator. Generate 5 unique multiple-choice questions.
Target Audience: {difficulty} level.
Return STRICT JSON only.
`;
```

### Invocation (Workflow Orchestration)

```javascript
// Called from: /api/teach route
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini", // ← The "thinking"
  messages: [
    { role: "system", content: systemPrompt }, // ← The "role"
    { role: "user", content: `Topic: ${topic}` }, // ← The "goal"
  ],
});
```

### Output (Structured Result)

```json
{
  "questions": [
    {
      "id": 1,
      "q": "What is the time complexity of binary search?",
      "options": ["O(log n)", "O(n)", "O(n^2)", "O(1)"],
      "ans": "O(log n)"
    }
  ]
}
```

This is **structured prompting** + **orchestration** = **Agent**.

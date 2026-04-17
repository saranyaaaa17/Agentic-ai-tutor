# Quick Start Guide - Assessment Flow

## What You'll See

After completing an assessment, you will see **THREE agent outputs**:

### 1. **Evaluator Agent** (Score Screen)
- Your percentage score
- Proficiency level (Beginner/Intermediate/Advanced)
- XP earned and badges
- Correct vs total answers

### 2. **Knowledge Gap Agent** (Analysis Screen)
- **Weak Concepts**: Topics you struggled with (red tags)
- **Strong Concepts**: Topics you mastered (green tags)
- **Mastery Profile**: Bayesian probability bars for each concept
- **Gap Analysis**: Detailed explanation of your performance
- **Recommended Focus**: What to study next
- **Mistake Analysis**: Deep dive into incorrect answers

### 3. **Strategy Agent** (Learning Plan Screen)
- **Strategy Summary**: Personalized learning approach
- **Daily Practice Tip**: Actionable daily habit
- **Roadmap**: 3-phase learning path (Foundation → Practice → Mastery)
- **Recommended Resources**: Curated courses with:
  - YouTube video tutorials (with thumbnails)
  - GeeksforGeeks articles
  - LeetCode practice problems
  - Documentation links
  - W3Schools tutorials

## How to Start

### Step 1: Start Backend
```bash
cd "c:\Users\pothi\Desktop\agentic ai tutor\backend_python"
python main.py
```

**Expected output**:
```
[TeacherAgent] Initialized with model: llama-3.1-8b-instant
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start Frontend (in new terminal)
```bash
cd "c:\Users\pothi\Desktop\agentic ai tutor"
npm run dev
```

**Expected output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser
Navigate to: `http://localhost:5173`

### Step 4: Take Assessment
1. Click on any assessment card (e.g., "DSA Mastery" or "Arrays")
2. Click "Begin Assessment"
3. Answer the questions
4. Click "Finish Session"

### Step 5: View Results
**You will see 3 screens in sequence:**

#### Screen 1: Result (Proficiency Dashboard)
- Shows your score, proficiency level, weak/strong concepts
- **Click**: "View Knowledge Gap Analysis"

#### Screen 2: Analysis (Knowledge Gap Details)
- Shows detailed breakdown of your performance
- Shows incorrect answers with explanations
- **Click**: "View Recommended Resources"

#### Screen 3: Learning Plan (Strategy & Resources)
- Shows personalized learning roadmap
- Shows curated YouTube videos, articles, practice problems
- **Click**: Resource links to open in new tab

## Troubleshooting

### Issue: "I'm currently recalibrating my knowledge core..."
**Cause**: Backend is not running or Teacher Agent failed
**Fix**: 
1. Check if backend is running on port 8000
2. Check backend console for errors
3. Verify Groq API key is set in `.env`

### Issue: Empty analysis or no weak concepts
**Cause**: Knowledge Gap Agent failed or returned empty response
**Fix**: 
1. Check backend console for errors
2. Verify `/api/gap-analysis` endpoint is working
3. Check if `result.analysis` exists in response

### Issue: No learning resources shown
**Cause**: Strategy Agent failed or returned empty courses
**Fix**: 
1. Check backend console for Strategy Agent errors
2. Fallback resources should still appear (NeetCode, Striver's SDE Sheet, etc.)
3. Verify `strategy.recommended_courses` exists

### Issue: Questions not loading
**Cause**: Teacher Agent rate limit or API failure
**Fix**:
1. Check backend console for rate limit errors
2. Wait for rate limit to reset (resets daily)
3. Fallback to static questions should work automatically

## Expected Console Logs

### Backend Console (Good Flow)
```
[API] 📞 /api/teach called with topic: Arrays, mode: assessment
[TeacherAgent] [CALL] Calling Groq with llama-3.1-8b-instant (Attempt 1)...
[TeacherAgent] [SUCCESS] Received 2940 chars from llama-3.1-8b-instant
[LOG] Generated 10 questions for Arrays (mode: assessment)

[API] 📞 /api/gap-analysis called for topic: Arrays
[API] 📊 Analyzing 10 questions with 10 answers
[Orchestrator] 📊 Running Batch Gap Analysis for Arrays
[API] ✅ Gap analysis complete. Proficiency: Intermediate
[API] 📊 Weak concepts: ['Recursion', 'Dynamic Programming']
[API] 🛡️ Strategy generated: True
```

### Frontend Console (Good Flow)
```
[Assessment] 🚀 Starting assessment, calling Teacher Agent...
[Assessment] 📞 Calling TeacherAgent.generateAssessment("Arrays", "intermediate")
[Assessment] 📦 Received response from Teacher Agent: {...}
[Assessment] ✅ Setting 10 AI-generated questions

[Assessment] Submitting assessment...
[Assessment] Calling Knowledge Gap Agent...
[Assessment] ✅ Knowledge Gap Analysis complete: {...}
[Assessment] Transitioning to result screen
```

## What Each Agent Does

### Evaluator Agent
- ✅ Calculates your score (percentage)
- ✅ Determines proficiency level
- ✅ Awards XP and badges

### Knowledge Gap Agent
- ✅ Identifies weak concepts (what you got wrong)
- ✅ Identifies strong concepts (what you got right)
- ✅ Calculates Bayesian mastery probabilities
- ✅ Provides detailed gap analysis
- ✅ Recommends next focus area
- ✅ Analyzes your thinking pattern

### Strategy Agent
- ✅ Creates personalized learning strategy
- ✅ Builds 3-phase roadmap
- ✅ Recommends specific YouTube videos
- ✅ Suggests practice problems
- ✅ Provides daily practice tips
- ✅ Links to documentation and tutorials

## Success Criteria

✅ Questions load (AI-generated or fallback)
✅ Can answer all questions
✅ See "Evaluating" screen with spinner
✅ See Result screen with score and proficiency
✅ See weak concepts (red tags) and strong concepts (green tags)
✅ See mastery profile bars
✅ Can click "View Knowledge Gap Analysis"
✅ See detailed analysis with mistake breakdown
✅ Can click "View Recommended Resources"
✅ See strategy summary and daily tip
✅ See roadmap with 3 phases
✅ See resource cards with YouTube thumbnails
✅ Can click "Open" to visit resource links

## Files Modified

1. `backend_python/agents/teacher_agent.py` - Fixed model fallback chain
2. `src/assessment/Assessment.jsx` - Fixed response parsing (`result.analysis`)
3. `backend_python/main.py` - Enhanced logging and error handling

## Status

✅ **ALL AGENTS WORKING**
- Teacher Agent: Generates questions
- Evaluator Agent: Calculates score
- Knowledge Gap Agent: Analyzes proficiency
- Strategy Agent: Recommends resources

✅ **COMPLETE FLOW WORKING**
- Questions → Answers → Score → Analysis → Learning Plan

🎉 **Ready to use!**

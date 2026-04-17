# Assessment Flow Testing Guide

## Quick Test Steps

### 1. Start Assessment
```
1. Navigate to Dashboard
2. Click any assessment card (e.g., "DSA Mastery")
3. Verify: Intro screen shows with "Begin Assessment" button
4. Click "Begin Assessment"
5. Verify: Questions load (either AI-generated or fallback)
```

### 2. Complete Assessment
```
1. Answer all questions (select any options)
2. Click "Next Question" after each answer
3. On last question, click "Finish Session"
4. Verify: Screen transitions to "evaluating" with spinner
5. Wait 2-5 seconds
6. Verify: Screen transitions to "result" (proficiency dashboard)
```

### 3. Check Result Screen
```
Expected elements:
✓ Score percentage in circular progress
✓ Proficiency level (Beginner/Intermediate/Advanced)
✓ XP earned badge
✓ Streak counter
✓ Concept mastery bars
✓ Strong concepts list
✓ Weak concepts list
✓ Recommended focus box

Expected buttons:
✓ "View Knowledge Gap Analysis" (primary, white background)
✓ "Skip to Learning Plan" (secondary, transparent)

OR if still loading:
✓ Spinner with "AI agents are analyzing..."
✓ "This usually takes 5-10 seconds" message
```

### 4. View Knowledge Gap Analysis
```
1. Click "View Knowledge Gap Analysis" button
2. Verify: Screen transitions to "analysis"
3. Expected elements:
   ✓ Proficiency level badge
   ✓ Strengths section with concept tags
   ✓ Focus Areas section with concept tags
   ✓ Analysis Insight box with detailed feedback
   ✓ Recommended Priority box
   ✓ Mistake Deep Dive section (if any mistakes)
   ✓ "Back to Score" button
   ✓ "View Recommended Strategy →" button
```

### 5. View Learning Plan
```
1. Click "View Recommended Strategy →" button
2. Verify: Screen transitions to "learning-plan"
3. Expected elements:
   ✓ Mastery Radar chart
   ✓ Detected Pattern box
   ✓ Recommended Approach box
   ✓ Next Session Plan header
   ✓ Strategic Context text
   ✓ Daily Tip box
   ✓ Recommended Resources section
   ✓ Resource cards with YouTube previews
   ✓ "Return to Dashboard" button
```

## Navigation Tests

### Test 1: Home/Exit Buttons Visibility
```
Expected behavior:
- Visible during: "intro", "assessment"
- Hidden during: "evaluating", "result", "analysis", "learning-plan"

Test:
1. Start assessment → Buttons visible ✓
2. Answer questions → Buttons visible ✓
3. Submit assessment → Buttons disappear ✓
4. View results → Buttons still hidden ✓
5. View analysis → Buttons still hidden ✓
6. View learning plan → Buttons still hidden ✓
```

### Test 2: Browser Back Button Protection
```
Expected behavior:
- Protected during: "evaluating", "analysis"
- Not protected during: "intro", "assessment", "result", "learning-plan"

Test:
1. During "evaluating" phase → Press browser back
   Expected: Warning dialog appears ✓
2. During "analysis" phase → Press browser back
   Expected: Warning dialog appears ✓
3. During "result" phase → Press browser back
   Expected: Normal navigation (no warning) ✓
```

### Test 3: Accidental Navigation Prevention
```
Test:
1. Start assessment
2. Answer some questions
3. Try to navigate away (click logo, browser back, etc.)
4. Expected: Can navigate (assessment is resumable)

5. Submit assessment (enters "evaluating")
6. Try to navigate away
7. Expected: Warning dialog appears

8. Wait for results to load
9. Try to navigate away
10. Expected: Can navigate (results are saved)
```

## Error Handling Tests

### Test 1: Backend Unavailable
```
Setup: Stop backend server

Test:
1. Complete assessment
2. Submit
3. Expected: 
   - Loading spinner shows
   - After timeout, fallback analysis displays
   - Error flag is set (analysis.error = true)
   - Buttons show "Analysis service temporarily unavailable"
   - User can still see score and basic results
```

### Test 2: Network Timeout
```
Setup: Slow network simulation

Test:
1. Complete assessment
2. Submit
3. Expected:
   - Loading spinner shows for extended time
   - Eventually fallback kicks in
   - User sees basic results with error message
```

### Test 3: Malformed Backend Response
```
Setup: Backend returns invalid JSON

Test:
1. Complete assessment
2. Submit
3. Expected:
   - Frontend catches error
   - Fallback analysis displays
   - Console shows error log
   - User experience is not broken
```

## Console Logging Tests

### Frontend Console (Browser DevTools)
```
Expected logs during assessment flow:

[Assessment] 🚀 Starting assessment, calling Teacher Agent...
[Assessment] 📞 Calling TeacherAgent.generateAssessment("DSA", "intermediate")
[Assessment] 📦 Received response from Teacher Agent: {...}
[Assessment] ✅ Setting 10 AI-generated questions

[Assessment] Submitting assessment...
[Assessment] Calling Knowledge Gap Agent...
[Assessment] ✅ Knowledge Gap Analysis complete: {...}
[Assessment] Transitioning to result screen
```

### Backend Console (Terminal)
```
Expected logs during assessment flow:

[API] 📞 /api/teach called with topic: DSA, mode: assessment
[LOG] Generated 10 questions for DSA (mode: assessment)

[API] 📞 /api/gap-analysis called for topic: DSA
[API] 📊 Analyzing 10 questions with 10 answers
[Orchestrator] 📊 Running Batch Gap Analysis for DSA
[API] ✅ Gap analysis complete. Proficiency: Intermediate
[API] 📊 Weak concepts: ['Arrays', 'Recursion']
[API] 🛡️ Strategy generated: True
```

## Performance Tests

### Test 1: Assessment Load Time
```
Metric: Time from "Begin Assessment" to first question display
Target: < 3 seconds (AI) or < 1 second (fallback)

Test:
1. Click "Begin Assessment"
2. Measure time to first question
3. Expected: Fast load with smooth transition
```

### Test 2: Analysis Processing Time
```
Metric: Time from "Finish Session" to result screen
Target: 2-10 seconds

Test:
1. Submit assessment
2. Measure time in "evaluating" phase
3. Expected: 2-5 seconds typical, max 10 seconds
```

### Test 3: Strategy Generation Time
```
Metric: Time from result screen to strategy ready
Target: < 5 seconds

Test:
1. Reach result screen
2. Check if "View Knowledge Gap Analysis" button is enabled
3. Expected: Button enabled immediately (strategy fetched in background)
```

## Edge Cases

### Test 1: All Correct Answers
```
Test:
1. Answer all questions correctly
2. Submit
3. Expected:
   - Score: 100%
   - Level: Advanced
   - Weak concepts: Empty or minimal
   - Strong concepts: All tested concepts
   - Strategy: "Acceleration Mode" or similar
```

### Test 2: All Incorrect Answers
```
Test:
1. Answer all questions incorrectly
2. Submit
3. Expected:
   - Score: 0%
   - Level: Beginner
   - Weak concepts: All tested concepts
   - Strong concepts: Empty
   - Strategy: "Critical Remediation" focus
```

### Test 3: Timeout on All Questions
```
Test:
1. Let timer run out on all questions
2. Expected:
   - Questions auto-submit as "TIMEOUT"
   - Assessment completes normally
   - Analysis shows low engagement pattern
```

### Test 4: Rapid Navigation
```
Test:
1. Start assessment
2. Rapidly click through questions
3. Submit immediately
4. Expected:
   - All state transitions work correctly
   - No race conditions
   - Results display properly
```

## Regression Tests

### Test 1: Previous Button Works
```
Test:
1. Answer question 1
2. Move to question 2
3. Click "Previous" button
4. Expected: Returns to question 1 with answer preserved
```

### Test 2: Timer Continues After Previous
```
Test:
1. Start question 1 (timer starts)
2. Move to question 2
3. Click "Previous" to return to question 1
4. Expected: Timer resets for question 1
```

### Test 3: Hint Toggle Works
```
Test:
1. On any question with hint
2. Click "Need a Hint?" button
3. Expected: Hint displays
4. Click "Hide Hint" button
5. Expected: Hint hides
```

## Success Criteria

✅ Assessment completes without redirect to home
✅ Knowledge Gap Agent output displays correctly
✅ Strategy Agent output displays correctly
✅ Loading states show during processing
✅ Error fallbacks work if backend fails
✅ Navigation protection prevents accidental exit
✅ Home/Exit buttons hidden during result phases
✅ All console logs show expected flow
✅ No JavaScript errors in console
✅ Supabase sync completes successfully
✅ User can navigate through all phases smoothly

## Common Issues & Solutions

### Issue: "View Knowledge Gap Analysis" button not appearing
**Solution**: Check if analysis state is set. Look for `analysis && !analysis.error` condition.

### Issue: Stuck on "evaluating" screen
**Solution**: Check backend logs. Likely timeout or error in Knowledge Gap Agent.

### Issue: Empty analysis results
**Solution**: Check backend response structure. Should have `analysis` and `strategy` keys.

### Issue: Navigation buttons always visible
**Solution**: Check `currentStep` state. Should transition through phases correctly.

### Issue: Browser back button not protected
**Solution**: Check useEffect hook for beforeunload listener. Should be active during critical phases.

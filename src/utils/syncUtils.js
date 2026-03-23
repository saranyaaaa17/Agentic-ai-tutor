import { supabase } from "../lib/supabase";

const normalizeMasteryScore = (score) => {
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore)) return 0;
    if (numericScore <= 0) return 0;
    if (numericScore <= 1) return numericScore;
    if (numericScore <= 100) return numericScore / 100;
    return 1;
};

/**
 * Syncs assessment results to Supabase for persistence.
 * Upserts mastery scores for specific concepts.
 */
export const syncMasteryToSupabase = async (userId, results) => {
    if (!userId || !results || !results.mastery_profile) return;

    try {
        console.log("[Sync] 🔄 Syncing mastery to Supabase...");
        
        const upsertData = Object.entries(results.mastery_profile).map(([concept, score]) => ({
            user_id: userId,
            concept: concept,
            mastery_score: normalizeMasteryScore(score),
            last_updated: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('learner_mastery')
            .upsert(upsertData, { onConflict: 'user_id, concept' });

        if (error) {
            console.error("[Sync] ❌ Error syncing mastery:", error.message);
            return { success: false, error };
        }

        console.log("[Sync] ✅ Mastery synced successfully.");
        return { success: true };
    } catch (e) {
        console.error("[Sync] ❌ Unexpected sync error:", e);
        return { success: false, error: e };
    }
};

/**
 * Fetches mastery data from Supabase for the current user.
 */
export const fetchMasteryFromSupabase = async (userId) => {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('learner_mastery')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error("[Sync] ❌ Error fetching mastery:", error.message);
            return null;
        }

        // Convert array to profile object
        const profile = {};
        data.forEach(item => {
            profile[item.concept] = normalizeMasteryScore(item.mastery_score);
        });

        return profile;
    } catch (_) {
      console.error("Mastery Fetch Error: ", _);
      return null;
    }
};

export { normalizeMasteryScore };

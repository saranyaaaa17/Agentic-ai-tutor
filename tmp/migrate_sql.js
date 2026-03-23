import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error("❌ SUPABASE_DB_URL not found in .env");
    process.exit(1);
}

const client = new Client({ connectionString });

const run = async () => {
    try {
        await client.connect();
        console.log("✅ Connected to Supabase DB.");

        // Using gen_random_uuid() which is default in Supabase/PG13+
        const sql = `
            CREATE TABLE IF NOT EXISTS public.learner_mastery (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users(id) NOT NULL,
                concept TEXT NOT NULL,
                mastery_score FLOAT NOT NULL DEFAULT 0.0,
                attempts INTEGER DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT now(),
                UNIQUE(user_id, concept)
            );

            -- Enable RLS
            ALTER TABLE public.learner_mastery ENABLE ROW LEVEL SECURITY;

            -- Create Policy (with check to avoid duplicate error)
            DO $$ 
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'learner_mastery' 
                AND policyname = 'Users can manage their own mastery'
              ) THEN
                CREATE POLICY "Users can manage their own mastery" 
                ON public.learner_mastery 
                FOR ALL 
                USING (auth.uid() = user_id);
              END IF;
            END $$;
        `;

        await client.query(sql);
        console.log("🚀 SQL migration completed successfully.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
        console.error("Detail:", e.detail);
    } finally {
        await client.end();
    }
};

run();

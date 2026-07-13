import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil. .env dosyanızı kontrol edin. ' +
      'Supabase olmadan uygulama Open Food Facts ile çalışmaya devam eder (cache/manuel ekleme devre dışı).'
  );
}

// `createClient` boş/geçersiz URL ile senkron olarak hata fırlatıyor (`supabaseUrl is required`).
// Supabase henüz yapılandırılmadıysa client'ı hiç oluşturmuyoruz; kullanan kod `supabase`'in
// null olabileceğini kontrol etmeli (bkz. productRepository.ts, manualSubmissions.ts).
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

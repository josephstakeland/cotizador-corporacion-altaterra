import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const useSupabase =
  import.meta.env.VITE_DATA_MODE === "supabase" &&
  Boolean(url) &&
  Boolean(key) &&
  !String(url).includes("YOUR_PROJECT");

export const supabase = useSupabase
  ? createClient(url, key)
  : null;

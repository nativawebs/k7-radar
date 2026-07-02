import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}${path}`, {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

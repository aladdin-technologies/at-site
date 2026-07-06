"use client";

import { supabase } from "./supabase";

let companyId: string | null = null;

async function getCompanyId(): Promise<string | null> {
  if (companyId) return companyId;
  const { data } = await supabase.from("forecast_companies").select("id").limit(1);
  companyId = data?.[0]?.id || null;
  return companyId;
}

export async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const cid = await getCompanyId();
    if (!cid) return fallback;
    const { data } = await supabase.from("app_settings").select("value").eq("company_id", cid).eq("key", key).single();
    if (data?.value !== undefined) return data.value as T;
  } catch {}
  return fallback;
}

export async function saveSetting(key: string, value: any): Promise<void> {
  try {
    const cid = await getCompanyId();
    if (!cid) return;
    await supabase.from("app_settings").upsert(
      { company_id: cid, key, value, updated_at: new Date().toISOString() },
      { onConflict: "company_id,key" }
    );
  } catch {}
}

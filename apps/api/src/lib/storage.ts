import { supabase } from "./supabase";

const BUCKET = "receipts";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

/**
 * Path convention: {transaction_id}/{filename}
 * Full bucket path: receipts/{transaction_id}/{filename}
 */

export async function getReceiptSignedUrl(
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return null;
  }
  return data.signedUrl;
}

export async function uploadReceipt(
  transactionId: string,
  filename: string,
  file: Uint8Array | ArrayBuffer,
  contentType: string
): Promise<string | null> {
  // Path: {transaction_id}/{filename}
  const path = `${transactionId}/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (error) {
    return null;
  }
  return path;
}

export async function deleteReceipt(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

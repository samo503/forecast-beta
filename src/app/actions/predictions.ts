'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Expected outcomes are returned, not thrown: a thrown error's message is
// replaced with a generic one by Next.js in production once it crosses the
// Server Action boundary, so the caller can never branch on err.message
// there. Return values aren't subject to that masking. Only genuine
// unexpected failures (RLS rejection, bad ids, etc) still throw.
export type LockPredictionResult =
  | { ok: true }
  | { ok: false; reason: 'not_authenticated' }
  | { ok: false; reason: 'duplicate_pick' }

export async function lockPrediction(
  predictionId: string,
  optionId: string
): Promise<LockPredictionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, reason: 'not_authenticated' }

  const { error } = await supabase.from('user_predictions').insert({
    prediction_id: predictionId,
    user_id: user.id,
    option_id: optionId,
  })

  if (error) {
    // unique_violation on (prediction_id, user_id) — the user already has
    // a pick locked in for this prediction. Distinct from every other
    // insert failure (RLS rejection, bad ids, etc), which stay generic.
    if (error.code === '23505') return { ok: false, reason: 'duplicate_pick' }
    throw error
  }

  revalidatePath('/predict')
  return { ok: true }
}

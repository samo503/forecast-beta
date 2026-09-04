'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockPrediction(predictionId: string, optionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('not_authenticated')

  const { error } = await supabase.from('user_predictions').insert({
    prediction_id: predictionId,
    user_id: user.id,
    option_id: optionId,
  })

  if (error) throw error

  revalidatePath('/predict')
}

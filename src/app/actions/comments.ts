'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function postComment(episodeId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('empty_comment')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('not_authenticated')

  const { error } = await supabase.from('comments').insert({
    episode_id: episodeId,
    user_id: user.id,
    body: trimmed,
  })

  if (error) throw error

  revalidatePath('/live')
}

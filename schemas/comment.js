import z from 'zod'


const commentSchema = z.object({
  user_id:  z.string().uuid({
    message: 'userId must be a valid UUID'
  }),
  descr: z.string().max(2200), 
  post_id: z.number()
})


export function validateComment (input) {
  return commentSchema.safeParse(input)
}

export function validatePartialComment (input) {
  return commentSchema.partial().safeParse(input)
}

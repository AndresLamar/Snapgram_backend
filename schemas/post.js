import z from 'zod'

// const tagSchema = z.string().max(50);

const postSchema = z.object({
  userId:  z.string().uuid({
    message: 'userId must be a valid UUID'
  }),
  caption: z.string().max(2200), 
  location: z.string().optional(), 
  imageUrl: z.string().url({
    message: 'imageUrl must be a valid URL'
  }).optional(),
  imageId: z.string().optional(),
  // tags: z.array(tagSchema).optional(),
  tags: z.string().max(50).optional()
})


export function validatePost (input) {
  return postSchema.safeParse(input)
}

export function validatePartialPost (input) {
  return postSchema.partial().safeParse(input)
}

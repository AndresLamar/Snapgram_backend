import z from 'zod'

const userSchema = z.object({
  name: z.string().min(2, {message: 'Too short', required_error: 'Name is required.'}),
  username: z.string().min(2, {message: 'Too short', required_error: 'Username is required.'}),
  email: z.string().email({message: 'Invalid email', required_error: 'Email is required.'}),
  password: z.string().min(8, {message: 'Password must be all 8 characters'}),
  phonenumber: z.string().min(8).max(10).optional(),
  bio: z.string().max(2200).optional(),
  imageId: z.string().optional(),
  imageUrl: z.string().url({
    message: 'imageUrl must be a valid URL'
  }).optional(),
})


export function validateUser (input) {
  return userSchema.safeParse(input)
}

export function validatePartialUser (input) {
  return userSchema.partial().safeParse(input)
}

import jwt from 'jsonwebtoken'

const tokenExtractor = (request, response, next) => {
    // const authorization = request.get('authorization')
  
    // request.token = null
    // if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    //   request.token = authorization.substring(7)
    // }

    try {
        const authorization = request.get('authorization')
  
        request.token = null
        if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
          request.token = authorization.substring(7)
        }

        const decodedToken = jwt.verify(request.token, process.env.JWT_SECRET)

        if (!request.token || !decodedToken.id) {
            return response.status(401).json({ error: 'Token missing or invalid' })
        }

        next()
    } catch (error) {
        console.error('Error extracting user:', error);
        return response.status(401).json({ error: 'Token missing or invalid' });
    }
  
}


export { tokenExtractor }

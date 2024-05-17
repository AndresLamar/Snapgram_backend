import { Router } from 'express'
import { UserController } from '../controllers/users.js'
import { tokenExtractor  } from "../middlewares/token.js";

 
export const createUserRouter = ({ userModel }) => {
  const userRouter = Router()

  const userController = new UserController({ userModel })

  userRouter.get('/getUsers', tokenExtractor,  userController.getUsers);
  userRouter.get('/getPostsForUser/:user_id', tokenExtractor, userController.getPostsForUser)
  userRouter.get('/getPostsLikedForUser/:user_id', tokenExtractor, userController.getPostsLikedForUser)
  userRouter.get('/getPostsSaved/:user_id', tokenExtractor, userController.getPostsSaved)
  userRouter.get('/follows/:user_id', userController.getFollows)
  userRouter.get('/:id', tokenExtractor, userController.getUserById)

  userRouter.put('/:id', tokenExtractor, userController.updateUser);

  userRouter.post('/getUser', userController.getUser)
  userRouter.post('/', userController.createUser)
  userRouter.post('/follow', tokenExtractor, userController.followUser)
  userRouter.delete('/unFollow', tokenExtractor, userController.unFollowUser)

  return userRouter
}

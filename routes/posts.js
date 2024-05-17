import { Router } from 'express'
import { PostController } from '../controllers/posts.js'
import { tokenExtractor  } from "../middlewares/token.js";

export const createPostRouter = ({ postModel }) => {
  const postRouter = Router()

  const postController = new PostController({ postModel })

  postRouter.get('/test', postController.test)

  postRouter.get('/', postController.getAll)
  postRouter.get('/infinite',  postController.getInfinitePosts);
  postRouter.get('/comments/:post_id', postController.getComments)
  postRouter.get('/stats/:post_id', postController.getStats)
  postRouter.get('/likes/:post_id', postController.getLikes) 
  postRouter.get('/saves/:post_id', postController.getSaves)
  postRouter.get('/trendingTags', postController.getTrendingTags)
  postRouter.get('/search/:searchTerm', postController.searchPosts);
  postRouter.get('/:id', postController.getPostById)

  postRouter.put('/:id', tokenExtractor, postController.updatePost);
  
  postRouter.post('/', tokenExtractor, postController.create)
  postRouter.post('/like', tokenExtractor, postController.likePost);
  postRouter.post('/save', tokenExtractor, postController.savePost);
  postRouter.post('/comment', tokenExtractor, postController.addComment);

  postRouter.delete('/unlike', tokenExtractor, postController.unlikePost);
  postRouter.delete('/unsave', tokenExtractor, postController.unsavePost);
  postRouter.delete('/:id', tokenExtractor, postController.deletePost);

  return postRouter
}

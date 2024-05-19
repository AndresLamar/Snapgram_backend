import { validateComment } from '../schemas/comment.js'
import { validatePartialPost, validatePost } from '../schemas/post.js'

export class PostController {
  constructor ({ postModel }) {
    this.postModel = postModel
  } 

  test = async (req,res) => {
    await this.postModel.test()

    res.status(200).json({ message: 'ok' })
  }

  getAll = async (req, res) => {
    const posts = await this.postModel.getAll()
    res.json(posts)
  }

  getPostById = async (req, res) => {
    const { id } = req.params

    if(!id){
      return res.status(400).json({error: 'Id not provided'})
    }

    try {
      const post = await this.postModel.getPostById({ id })
      if(post) return res.status(200).json(post)
    } catch (error) {
      console.log(error)
      res.status(404).json({ message: 'Post not found' })

    }

  }
   
  getInfinitePosts = async (req, res) => {
    
    const { page, limit } = req.query;

    const { user_id } = req.params

    const postsPerPage = parseInt(limit); // Número de posts por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const posts = await this.postModel.getInfinitePosts(startIndex, postsPerPage, user_id);

      // Devuelve los posts al cliente
      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching infinite posts:', error);
      res.status(500).json({ error: 'Failed to fetch infinite posts' });
    }
  };

  getComments = async (req, res) => {
    const { post_id } = req.params
    const { page, limit } = req.query;

    const commentsPerPage = parseInt(limit); // Número de comentarios por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const comments = await this.postModel.getComments(startIndex, commentsPerPage, post_id);

      // Devuelve los posts al cliente
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  addComment = async (req, res) => {
    const result = validateComment(req.body)

    if (!result.success) {
    // 422 Unprocessable Entity
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    try{
      await this.postModel.addComment({ input: result.data })

      res.status(201).json('New Comment added ')
    } catch (error) {
      console.log(error)
      res.status(400)
    }
  }

  getStats = async (req,res) => {
    const { post_id } = req.params

    const { user_id } = req.query

    const result = await this.postModel.getStats(post_id, user_id)

    if(result) return res.status(200).json(result)

    res.status(404)
  }

  getLikes = async (req, res) => {
    const { post_id } = req.params;

    const result = await this.postModel.getLikes(post_id)

    if(result) return res.status(200).json(result)

    res.status(404)
  }

  getSaves = async (req, res) => {
    const { post_id } = req.params;

    const result = await this.postModel.getSaves(post_id)

    if(result) return res.status(200).json(result)

    res.status(404)
  }

  getTrendingTags = async (req, res) => {
    const tags = await this.postModel.getTrendingTags()
    res.json(tags)
  }

  searchPosts = async (req, res) => {
    const { searchTerm } = req.params;
    const { user_id } = req.query

    try {
      // Llamar al método del modelo para buscar posts por término de búsqueda
      const posts = await this.postModel.searchPosts(searchTerm, user_id);

      // Devolver los posts encontrados
      res.status(200).json(posts);
    } catch (error) {
      console.error('Error searching posts:', error);
      res.status(500).json({ error: 'Failed to search posts' });
    }
  };

  create = async (req, res) => { 
 
    const result = validatePost(req.body)

    if (!result.success) {
    // 422 Unprocessable Entity
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newPost = await this.postModel.create({ input: result.data })

    res.status(201).json(newPost)
  }

  updatePost = async (req, res) => {
    const result = validatePartialPost(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params

    const updatedPost = await this.postModel.update({ id, input: result.data })

    return res.status(204).json(updatedPost)
  }

  deletePost = async (req, res) => {
    const { id } = req.params
    const deletedPost = await this.postModel.delete({ id })

    if (deletedPost) return res.status(204)
    return res.status(404).json({ message: 'Post not found' })
  }

  likePost = async (req, res) => {
    const { user_id, post_id } = req.body;
  
    try {
      await this.postModel.like(user_id, post_id);
      res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(400).json({ error: 'Failed to like post' });
    }
  }

  unlikePost = async (req, res) => {
    const { user_id, post_id } = req.body;
  
    try {
      await this.postModel.unlike(user_id, post_id);
      res.status(200).json({ message: 'Post unliked successfully' });
    } catch (error) {
      console.error('Error unliking post:', error);
      res.status(400).json({ error: 'Failed to unlike post' });
    }
  }

  savePost = async (req, res) => {
    const { user_id, post_id } = req.body;
  
    try {
      await this.postModel.save(user_id, post_id);
      res.status(200).json({ message: 'Post saved successfully' });
    } catch (error) {
      console.error('Error saving post:', error);
      res.status(500).json({ error: 'Failed to save post' });
    }
  }

  unsavePost = async (req, res) => {
    const { user_id, post_id } = req.body;
  
    try {
      await this.postModel.unsave(user_id, post_id);
      res.status(200).json({ message: 'Post unsaved successfully' });
    } catch (error) {
      console.error('Error unsaving post:', error);
      res.status(500).json({ error: 'Failed to unsave post' });
    }
  }
}


import {  validateUser, validatePartialUser } from '../schemas/user.js'
import jwt  from "jsonwebtoken";

export class UserController {
  constructor ({ userModel }) {
    this.userModel = userModel
  }

  getUser = async (req, res) => {
    const result = req.body
    const user = await this.userModel.getUser(result)
    res.json(user)
  }

  getUsers = async (req, res) => {
    const authorization = req.get('authorization')
    const token = authorization.substring(7)

    const user = jwt.decode(token)
    
    const { page, limit } = req.query;


    const usersPerPage = parseInt(limit); // Número de posts por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const users = await this.userModel.getUsers(startIndex, usersPerPage, user.id);

      // Devuelve los posts al cliente
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  getUserById = async (req, res) => {
    const { id } = req.params

    const user = await this.userModel.getUserById({ id })
    if(user) return res.json(user)

    res.status(404).json({ message: 'User not found' })
  }

  getPostsForUser = async (req, res) => {
    const { user_id } = req.params
    const { page, limit } = req.query;

    const postsPerPage = parseInt(limit); // Número de posts por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const posts = await this.userModel.getPostsForUser(startIndex, postsPerPage, user_id);

      // Devuelve los posts al cliente
      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching posts for user:', error);
      res.status(500).json({ error: 'Failed to fetch posts for user' });
    }
  }

  getPostsLikedForUser = async (req, res) => {
    const { user_id } = req.params
    const { page, limit } = req.query;

    const postsPerPage = parseInt(limit); // Número de posts por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const posts = await this.userModel.getPostsLikedForUser(startIndex, postsPerPage, user_id);

      // Devuelve los posts al cliente
      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching posts for user:', error);
      res.status(500).json({ error: 'Failed to fetch posts for user' });
    }
  }

  createUser = async (req, res) => {
    const result = validateUser(req.body)

    if (!result.success) {
    // 422 Unprocessable Entity
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newUser = await this.userModel.create({ input: result.data })

    res.status(201).json(newUser)
  }

  getFollows = async (req, res) => {
    const { user_id } = req.params;

    const result = await this.userModel.getFollows(user_id)

    if(result) return res.status(200).json(result)

    res.status(404)
  }

  getPostsSaved = async (req, res) => {
    const { user_id } = req.params;
    const { page, limit } = req.query;

    const postsPerPage = parseInt(limit); // Número de posts por página
    const currentPage = parseInt(page) ; // Página actual, por defecto 1
 
    try {
      // Calcula el índice de inicio de los posts según la página actual
      const startIndex = currentPage * limit ;

      // Obtiene los posts desde la base de datos
      const result = await this.userModel.getPostsSaved(user_id, startIndex, postsPerPage)
      // const posts = await this.postModel.getInfinitePosts(startIndex, postsPerPage);

      // Devuelve los posts al cliente
      if(result) return res.status(200).json(result)

      res.status(404)

    } catch (error) {
      console.error('Error fetching infinite posts:', error);
      res.status(500).json({ error: 'Failed to fetch infinite posts' });
    }

    // const result = await this.userModel.getPostsSaved(user_id)

    // if(result) return res.status(200).json(result)

  }

  followUser = async (req, res) => {
    const { follower, following } = req.body
  
    try {
      await this.userModel.follow(follower, following)
      res.status(200).json({ message: 'User followed successfully' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }

  unFollowUser = async (req, res) => {
    const { follower, following } = req.body
  
    try {
      await this.userModel.unFollow(follower, following)
      res.status(200).json({ message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }

  updateUser = async (req, res) => {
    const result = validatePartialUser(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params


    const updatedUser = await this.userModel.update({ id, input: result.data })

    return res.status(200).json(updatedUser)
  }
}

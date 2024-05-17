import pool from '../../db/postgresql.js'
import bcrypt from 'bcrypt'
import { deleteImage } from '../../utils.js';

export class UserModel{
    static async create ({ input }) {
      const {
        name,
        username,
        email,
        password
      } = input

      // crypto.randomUUID()
      const uuResult = await pool.query('SELECT uuid_generate_v4();')
      const uuid = uuResult.rows[0].uuid_generate_v4

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      try {
        await pool.query(
          `INSERT INTO users (id, name, username, email, password)
            VALUES ($1, $2, $3, $4, $5);`,
          [uuid, name, username, email, passwordHash]
        )
      } catch (e) {
        // puede enviarle información sensible
        console.log(e);
        throw new Error('Error creating user')
        // enviar la traza a un servicio interno
        // sendLog(e)
      }

      const result = await pool.query(
        `SELECT id, name, username, email, password, created_at
          FROM users WHERE id = $1;`,
        [uuid]
      )

      return result.rows
    }

    static async getUser(input) {      
        const { username } = input;
    
        try {
          const result = await pool.query(
            'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE username = $1;',
            [username]
          );
    
          return result.rows[0];
        } catch (error) {
          console.error('Error al obtener el usuario:', error);
          return null;
        }
    }

    static async getUserById({ id }) {
        try {
          const result = await pool.query(
            'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1;',
            [id]
          );
    
          if (result.rows.length === 0) {
            return null; // Usuario no encontrado
          }
    
          const user = result.rows[0];
    
          const follows = await this.getFollows(id);
          const following = await this.getFollowingForUser(id);
    
          user.follows = follows;
          user.following = following;
    
          return user;
        } catch (error) {
          console.error('Error al obtener el usuario por ID:', error);
          return null;
        }
    }

    static async getUsers(startIndex, limit, id) {
      try {
        const pageNumber = Math.floor(startIndex / limit) + 1;
  
        const usersQuery = {
          text: `
            SELECT id, name, username, email, imageUrl, imageId
            FROM users
            WHERE id != $1
            LIMIT $2 OFFSET $3;
          `,
          values: [id, limit, startIndex],
        };
  
        const usersResult = await pool.query(usersQuery);
        const users = usersResult.rows;
  
        // Añadir el número de página a cada usuario
        for (const user of users) {
          user.pageNumber = pageNumber;
        }
  
        return users;
      } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        throw new Error('Error al obtener los usuarios');
      }
  }

    static async getPostsForUser(startIndex, limit, id) {
        try {
          const pageNumber = Math.floor(startIndex / limit) + 1;
    
          const postsQuery = {
            text: `
              SELECT id, creator_id, caption, imageUrl, imageId, location, likes_count, has_liked, has_saved, created_at 
              FROM posts 
              WHERE creator_id = $1
              ORDER BY created_at DESC 
              LIMIT $2 OFFSET $3;
            `,
            values: [id, limit, startIndex],
          };
    
          const postsResult = await pool.query(postsQuery);
          const posts = postsResult.rows;
    
          for (const post of posts) {
            const creatorResult = await pool.query(
              'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1;',
              [post.creator_id]
            );
            const creator = creatorResult.rows[0];
    
            const tagsQuery = {
              text: `
                SELECT t.name 
                FROM tags t
                INNER JOIN posts_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = $1;
              `,
              values: [post.id],
            };
            const tagsResult = await pool.query(tagsQuery);
            const tags = tagsResult.rows.map(tag => tag.name);
    
            post.creator = creator;
            post.tags = tags;
            post.pageNumber = pageNumber;
          }
    
          return posts;
        } catch (error) {
          console.error('Error al obtener las publicaciones del usuario:', error);
          throw new Error('Error al obtener las publicaciones del usuario');
        }
    }

    static async getPostsLikedForUser(startIndex, limit, id) {
        try {
          const pageNumber = Math.floor(startIndex / limit) + 1;
    
          const postsQuery = {
            text: `
              SELECT 
                  p.id, 
                  p.creator_id, 
                  p.caption, 
                  p.imageUrl, 
                  p.imageId, 
                  p.location, 
                  p.likes_count, 
                  p.has_liked, 
                  p.has_saved,
                  p.created_at 
              FROM 
                  posts p
              JOIN 
                  likes l ON p.id = l.post_id
              WHERE 
                  l.user_id = $1
              ORDER BY 
                  p.created_at DESC
              LIMIT 
                  $2 OFFSET $3;
              `,
            values: [id, limit, startIndex],
          };
    
          const postsResult = await pool.query(postsQuery);
          const posts = postsResult.rows;
    
          // Recuperar detalles adicionales para cada publicación
          for (const post of posts) {
            const creatorResult = await pool.query(
              'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1;',
              [post.creator_id]
            );
            const creator = creatorResult.rows[0];
    
            const tagsQuery = {
              text: `
                SELECT t.name 
                  FROM tags t
                  INNER JOIN posts_tags pt ON t.id = pt.tag_id
                  WHERE pt.post_id = $1;
                `,
              values: [post.id],
            };
            const tagsResult = await pool.query(tagsQuery);
            const tags = tagsResult.rows.map(tag => tag.name);
    
            post.creator = creator;
            post.tags = tags;
            post.pageNumber = pageNumber;
          }
    
          return posts;
        } catch (error) {
          console.error('Error al obtener las publicaciones que le gustan al usuario:', error);
          throw new Error('Error al obtener las publicaciones que le gustan al usuario');
        }
    }

    static async getFollowingForUser(id) {
        try {
          const followsQuery = {
            text: `
              SELECT following_id
              FROM follows 
              WHERE follower_id = $1;
            `,
            values: [id],
          };
    
          const followsResult = await pool.query(followsQuery);
          const followingIds = followsResult.rows.map(following => following.following_id);
    
          return followingIds;
        } catch (error) {
          console.error('Error al obtener los seguidos por el usuario:', error);
          throw new Error('Error al obtener los seguidos por el usuario');
        }
    }

    static async getFollows(user_id) {
        try {
          const followsQuery = {
            text: `
              SELECT follower_id AS user_id
              FROM follows
              WHERE following_id = $1;
            `,
            values: [user_id],
          };
    
          const followsResult = await pool.query(followsQuery);
          const follows = followsResult.rows.map(follow => follow.user_id);
    
          return follows;
        } catch (error) {
          console.error('Error al obtener los seguidores del usuario:', error);
          throw new Error('Error al obtener los seguidores del usuario');
        }
    }

    static async getPostsSaved(user_id, startIndex, limit) {
        try {
          const pageNumber = Math.floor(startIndex / limit) + 1;
    
          const postsQuery = {
            text: `
              SELECT posts.id, posts.creator_id, posts.caption, posts.imageUrl, posts.imageId, posts.location, posts.likes_count, posts.has_liked, posts.has_saved, posts.created_at 
              FROM posts 
              INNER JOIN saves ON posts.id = saves.post_id 
              WHERE user_id = $1 
              LIMIT $2 OFFSET $3;
            `,
            values: [user_id, limit, startIndex],
          };
    
          const postsResult = await pool.query(postsQuery);
          const posts = postsResult.rows;
    
          // Recuperar detalles adicionales para cada publicación
          for (const post of posts) {
            const creatorResult = await pool.query(
              'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1;',
              [post.creator_id]
            );
            const creator = creatorResult.rows[0];
    
            const tagsQuery = {
              text: `
                SELECT t.name 
                FROM tags t
                INNER JOIN posts_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = $1;
              `,
              values: [post.id],
            };
            const tagsResult = await pool.query(tagsQuery);
            const tags = tagsResult.rows.map(tag => tag.name);
    
            post.creator = creator;
            post.tags = tags;
            post.pageNumber = pageNumber;
          }
    
          return posts;
        } catch (error) {
          console.error('Error al obtener las publicaciones guardadas por el usuario:', error);
          throw new Error('Error al obtener las publicaciones guardadas por el usuario');
        }
    }

    static async follow(follower, following) {
        try {  
          await pool.query(
            'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2);',
            [follower, following]
          );
    
        } catch (error) {
          console.error('Error al seguir al usuario:', error);
          throw new Error('Error al seguir al usuario');
        }
    }

    static async unFollow(follower, following) {
        try {
          // Eliminar el seguimiento de la tabla follows
          await pool.query(
            'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2;',
            [follower, following]
          );
    
        } catch (error) {
          console.error('Error al dejar de seguir al usuario:', error);
          throw new Error('Error al dejar de seguir al usuario');
        }
    }

    static async update({ id, input }) {
        try {
          const { name, username, email, bio, imageUrl, imageId } = input;
    
          // Comprueba si el usuario existe
          const existingUserQuery = {
            text: 'SELECT * FROM users WHERE id = $1',
            values: [id],
          };
          const existingUserResult = await pool.query(existingUserQuery);
          const existingUser = existingUserResult.rows;
    
          if (!existingUser.length) {
            throw new Error('User not found');
          }
    
          // Inicia una transacción
          await pool.query('BEGIN');
    
          // Actualiza el name, username, email y bio
          const updateUserQuery = {
            text: 'UPDATE users SET name = $1, username = $2, email = $3, bio = $4 WHERE id = $5',
            values: [name, username, email, bio, id],
          };
          await pool.query(updateUserQuery);
    
          // Actualiza la imagen si se proporciona una nueva
          if (imageUrl && imageId) {
            if (existingUser[0].imageurl && existingUser[0].imageid ){
              // Comprueba si la imagen actual es diferente de la nueva imagen
              if (existingUser[0].imageurl !== imageUrl || existingUser[0].imageid !== imageId) {
                // Elimina la imagen actual
                // Aquí deberías tener la lógica para eliminar la imagen, si es necesario
                await deleteImage(existingUser[0].imageid);
    
                // Actualiza la información de la imagen en la base de datos con los nuevos detalles de la imagen
                const updateImageQuery = {
                  text: 'UPDATE users SET imageUrl = $1, imageId = $2 WHERE id = $3',
                  values: [imageUrl, imageId, id],
                };
                await pool.query(updateImageQuery);
              }
            } else {
              const updateImageQuery = {
                text: 'UPDATE users SET imageUrl = $1, imageId = $2 WHERE id = $3',
                values: [imageUrl, imageId, id],
              };
              await pool.query(updateImageQuery);
            }
          }
    
          // Confirma la transacción
          await pool.query('COMMIT');
    
          // Obtén y devuelve el usuario actualizado
          const updatedUserQuery = {
            text: 'SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1',
            values: [id],
          };
          const updatedUserResult = await pool.query(updatedUserQuery);
          const updatedUser = updatedUserResult.rows[0];
    
          return updatedUser;
        } catch (error) {
          // Revierte la transacción en caso de error
          await pool.query('ROLLBACK');
          console.error('Error updating user:', error);
          throw new Error('Error updating user');
        }
    }
}
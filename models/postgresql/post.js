import pool from '../../db/postgresql.js'
import { deleteImage } from "../../utils.js";

export class PostModel {  
    static async create({ input }) {
      const {
        userId,
        caption,
        location,
        tags,
        imageUrl,
        imageId
      } = input;

      try {
        // Iniciar la transacción
        await pool.query('BEGIN');

        let Atags = tags?.replace(/ /g, '').split(',') || [];

        const { newTagIds, existingTagIds } = await this.insertNewTags(Atags);

        const { actualPost, postId } = await this.insertPostAndGetId(userId, caption, location, imageId, imageUrl);

        await this.insertPostTagRelationships(postId, [...newTagIds, ...existingTagIds]);

        // Confirmar la transacción
        await pool.query('COMMIT');

        return actualPost;
      } catch (error) {
        // Revertir la transacción en caso de error
        await pool.query('ROLLBACK');

        await deleteImage(imageId);
        // puede enviar información sensible
        console.log(error);
        throw new Error('Error creating post');
        // enviar la traza a un servicio interno
        // sendLog(error)
      }
    }
    static async getAll() {
        try {
          const postsQuery = {
            text: `
              SELECT 
                id, 
                BIN_TO_UUID(creator_id) AS creator_id, 
                caption, 
                imageUrl, 
                imageId, 
                location, 
                likes_count, 
                has_liked, 
                has_saved,
                created_at 
              FROM 
                posts 
              ORDER BY 
                created_at DESC;
            `,
          };
          const postsResult = await pool.query(postsQuery);
          const posts = postsResult.rows;
    
          for (const post of posts) {
            const creator = await this.getCreatorOfPost(post.creator_id);
            const tags = await this.getTagsForPost(post.id);
    
            post.creator = creator;
            post.tags = tags;
          }
    
          return posts;
        } catch (error) {
          console.error('Error al obtener todas las publicaciones:', error);
          throw new Error('Error al obtener todas las publicaciones');
        }
    }
    
    static async getPostById({ id }) {
        try {
          const postQuery = {
            text: `
              SELECT 
                id, 
                creator_id, 
                caption, 
                imageUrl, 
                imageId, 
                location, 
                likes_count, 
                created_at 
              FROM 
                posts 
              WHERE 
                id = $1;
            `,
            values: [id],
          };
          const postResult = await pool.query(postQuery);
          const post = postResult.rows[0];
    
          const creator = await this.getCreatorOfPost(post.creator_id);
          const tags = await this.getTagsForPost(post.id);
    
          post.creator = creator;
          post.tags = tags;
    
          return post;
        } catch (error) {
          console.error('Error al obtener la publicación por ID:', error);
          throw new Error('Error al obtener la publicación por ID');
        }
    }    

    static async getInfinitePosts(startIndex, limit, user_id) {
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
                p.created_at,
                CASE 
                    WHEN l.user_id IS NOT NULL THEN TRUE 
                    ELSE FALSE  
                END AS has_liked,
                CASE 
                    WHEN s.user_id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END AS has_saved
            FROM 
                posts p
            LEFT JOIN 
                likes l ON p.id = l.post_id AND l.user_id = $3
            LEFT JOIN 
                saves s ON p.id = s.post_id AND s.user_id = $3
            ORDER BY 
                p.created_at DESC 
            LIMIT 
                $2 
            OFFSET 
                $1;
            `,
            values: [startIndex, limit, user_id],
          };
          const postsResult = await pool.query(postsQuery);
          const posts = postsResult.rows;
    
          // Recuperar detalles adicionales para cada post
          for (const post of posts) {
            const user = await this.getCreatorOfPost(post.creator_id);
            const tags = await this.getTagsForPost(post.id);
    
            post.creator = user[0];
            post.tags = tags;
            post.pageNumber = pageNumber;
          }
    
          return posts;
        } catch (error) {
          console.error('Error fetching infinite posts:', error);
          throw new Error('Error fetching infinite posts');
        }
    }

    static async addComment({ input }) {
        const { post_id, user_id, descr } = input;
    
        try {
          const commentQuery = {
            text: `
              INSERT INTO 
                comments (post_id, user_id, descr) 
              VALUES 
                ($1, $2, $3);
            `,
            values: [post_id, user_id, descr],
          };
          await pool.query(commentQuery);
    
          const updatePostQuery = {
            text: `
              UPDATE 
                posts 
              SET 
                comment_count = comment_count + 1 
              WHERE 
                id = $1;
            `,
            values: [post_id],
          };
          await pool.query(updatePostQuery);
        } catch (error) {
          console.error('Error adding comment:', error);
          throw new Error('Error adding comment');
        }
    }

    static async getComments(startIndex, limit, id) {
        try {
          const pageNumber = Math.floor(startIndex / limit) + 1;
    
          const commentsQuery = {
            text: `
              SELECT 
                c.*, 
                u.id , 
                u.name, 
                u.imageUrl 
              FROM 
                comments AS c 
              JOIN 
                users AS u 
              ON 
                (u.id = c.user_id) 
              WHERE 
                c.post_id = $1 
              ORDER BY 
                c.created_at DESC 
              LIMIT 
                $3 
              OFFSET  
                $2;
            `,
            values: [id, startIndex, limit],
          };
          const commentsResult = await pool.query(commentsQuery);
          const comments = commentsResult.rows;
    
          // Recuperar detalles adicionales para cada comentario
          for (const comment of comments) {
            comment.pageNumber = pageNumber;
          }
    
          return comments;
        } catch (error) {
          console.error('Error fetching comments:', error);
          throw new Error('Error fetching comments');
        }
    }

    static async getStats(post_id, user_id) {
 
        try {
          const statsQuery = {
            text: `
              SELECT  
                p.likes_count, 
                p.comment_count, 
              CASE 
                WHEN l.user_id IS NOT NULL THEN TRUE 
                ELSE FALSE  
              END AS has_liked,
              CASE 
                WHEN s.user_id IS NOT NULL THEN TRUE 
                ELSE FALSE 
              END AS has_saved
              FROM 
                posts p
              LEFT JOIN 
                likes l ON p.id = l.post_id AND l.user_id = $2
              LEFT JOIN 
                saves s ON p.id = s.post_id AND s.user_id = $2  
              WHERE 
                p.id = $1;
            `,
            values: [post_id, user_id],
          };
          const result = await pool.query(statsQuery);
          return result.rows[0];
        } catch (error) {
          console.error('Error fetching post stats:', error);
          throw new Error('Error fetching post stats');
        }
    }

    static async getLikes(post_id) {
        try {
          const likesQuery = {
            text: `
              SELECT 
                BIN_TO_UUID(user_id) AS user_id 
              FROM 
                likes 
              WHERE 
                post_id = $1;
            `,
            values: [post_id],
          };
          const result = await pool.query(likesQuery);
          return result.rows.map(like => like.user_id);
        } catch (error) {
          console.error('Error fetching likes:', error);
          throw new Error('Error fetching likes');
        }
    }

    static async getSaves(post_id) {
        try {
          const savesQuery = {
            text: `
              SELECT 
                BIN_TO_UUID(user_id) AS user_id 
              FROM 
                saves 
              WHERE 
                post_id = $1;
            `,
            values: [post_id],
          };
          const result = await pool.query(savesQuery);
          return result.rows.map(save => save.user_id);
        } catch (error) {
          console.error('Error fetching saves:', error);
          throw new Error('Error fetching saves');
        }
    }

    static async getTrendingTags() {
        try {
          const tagsQuery = `
          SELECT 
              tags.name AS tag_name, 
              COUNT(posts_tags.tag_id) AS tag_count 
          FROM 
              posts_tags 
          JOIN 
              tags ON posts_tags.tag_id = tags.id 
          GROUP BY 
              tags.name 
          ORDER BY 
              tag_count DESC 
          LIMIT 
              4;
          `;
          const tags = await pool.query(tagsQuery);

          return tags.rows;
        } catch (error) {
          console.error('Error fetching trending tags:', error);
          throw new Error('Error fetching trending tags');
        }
    }

    static async searchPosts(searchTerm, user_id) {
        try {
          const searchQuery = {
            text: `
              SELECT 
                p.id, 
                p.creator_id, 
                p.caption, 
                p.imageUrl, 
                p.imageId, 
                p.location, 
                p.likes_count,
                CASE  
                    WHEN l.user_id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END AS has_liked,
                CASE 
                    WHEN s.user_id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END AS has_saved, 
                p.created_at 
              FROM 
                posts AS p
              LEFT JOIN 
                likes l ON p.id = l.post_id AND l.user_id = $2
              LEFT JOIN 
                saves s ON p.id = s.post_id AND s.user_id = $2  
              INNER JOIN 
                posts_tags AS pt ON p.id = pt.post_id
              INNER JOIN 
                tags AS t ON pt.tag_id = t.id
              WHERE 
                t.name ILIKE $1
              ORDER BY 
                p.created_at DESC;
            `,
            values: [`%${searchTerm}%`, user_id],
          };
          const { rows: posts } = await pool.query(searchQuery);
    
          for (const post of posts) {
            const user = await this.getCreatorOfPost(post.creator_id);
            post.creator = user[0];
    
            const tags = await this.getTagsForPost(post.id);
            post.tags = tags;
          }
    
          return posts;
        } catch (error) {
          console.error('Error searching posts:', error);
          throw new Error('Error searching posts');
        }
    }

    static async update({ id, input }) {
        try {
          const { caption, location, tags, imageUrl, imageId } = input;

          console.log(caption)
    
          // Comprueba si el post existe
          const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
          );

          const existingPost = result.rows[0]

          console.log({existingPost})
    
          if (result.rows.length < 0) {
            throw new Error('Post not found');
          }
    
          let Atags = tags?.replace(/ /g, '').split(',') || [];
    
          // Actualiza el post en la base de datos
          await pool.query('BEGIN');
    
          // Actualiza el caption y el location
          await pool.query(
            'UPDATE posts SET caption = $1, location = $2 WHERE id = $3',
            [caption, location, id]
          );
    
          // Actualiza la imagen si se proporciona una nueva
          if (imageUrl && imageId) {
            // Comprueba si la imagen actual es diferente de la nueva imagen
            if (existingPost.imageUrl !== imageUrl || existingPost.imageId !== imageId) {
              // await deleteImage(existingPost.imageId);
              // Actualiza la información de la imagen en la base de datos con los nuevos detalles de la imagen
              await pool.query(
                'UPDATE posts SET imageUrl = $1, imageId = $2 WHERE id = $3',
                [imageUrl, imageId, id]
              );
            }
          }
    
          // Actualiza los tags
          await this.updatePostTags(id, Atags);
    
          // Confirma la transacción
          await pool.query('COMMIT');
    
          // Obtén y devuelve el post actualizado
          const updatedPost = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
          );
    
          return updatedPost.rows[0];
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error('Error updating post:', error);
          throw new Error('Error updating post');
        }
    }

    static async delete({ id }) {
        try {
          const [existingPost] = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
          );
    
          if (!existingPost.length) {
            throw new Error('Post not found');
          }
    
          await deleteImage(existingPost[0].imageId);
    
          await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    
          return true;
        } catch (error) {
          console.error('Error deleting post:', error);
          throw new Error('Error deleting post');
        }
    }

    static async updatePostTags(postId, tags) {
        try {
          // Elimina los tags existentes para el post
          await pool.query('DELETE FROM posts_tags WHERE post_id = $1', [postId]);
    
          // Inserta los nuevos tags
          for (const tag of tags) {
            // Busca el ID del tag o inserta uno nuevo si no existe
            const tagQuery = await pool.query('SELECT id FROM tags WHERE name = $1', [tag]);
            let tagId;
    
            if (tagQuery.rows.length > 0) {
              tagId = tagQuery.rows[0].id;
            } else {
              const insertResult = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [tag]);
              tagId = insertResult.rows[0].id;
            }
    
            // Inserta la relación entre el post y el tag
            await pool.query('INSERT INTO posts_tags (post_id, tag_id) VALUES ($1, $2)', [postId, tagId]);
          }
        } catch (error) {
          console.error('Error updating post tags:', error);
          throw new Error('Error updating post tags');
        }
    }

    static async insertPostAndGetId(userId, caption, location, imageId, imageUrl) {
        try {
          // Ejecutar la consulta para insertar el post
          const result = await pool.query(
            `INSERT INTO posts (creator_id, caption, location, imageId, imageUrl)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, creator_id, caption, imageUrl, imageId, location, created_at`,
            [userId, caption, location, imageId, imageUrl]
          );
          
          // Obtener el ID del post recién insertado y los detalles del post
          const actualPost = result.rows[0];
          const postId = actualPost.id
    
          // Devolver el ID del post y los detalles del post
          return { actualPost, postId };
        } catch (error) {
          // Manejar errores, por ejemplo, lanzar una excepción o registrar el error
          console.error('Error inserting post:', error);
          throw new Error('Error inserting post');
        }
    }

    static async insertNewTags(tags) {
        try {
          const { newTags, existingTagIds } = await this.checkExistingTags(tags);
    
          const newTagIds = []; // Array para almacenar los IDs de los nuevos tags insertados
    
          if (newTags.length > 0) {
            for (const tag of newTags) {
              // Insertar el nuevo tag en la base de datos
              const result = await pool.query(
                `INSERT INTO tags (name) VALUES ($1) RETURNING id`,
                [tag]
              );
              // Obtener el ID del tag recién insertado y agregarlo al array de IDs
              newTagIds.push(result.rows[0].id);
            }
          }
          return { newTagIds, existingTagIds };
        } catch (error) {
          console.error('Error inserting new tags:', error);
          throw new Error('Failed to insert new tags');
        }
    }
    
    static async checkExistingTags(tags) {
        const existingTags = [];
        const newTags = [];
        const existingTagIds = []; // Array para almacenar los IDs de los tags existentes
      
        for (const tag of tags) {
          const query = 'SELECT id FROM tags WHERE name LIKE $1';
          const { rows } = await pool.query(query, [tag]);
      
          if (rows.length > 0) {
            // El tag ya existe en la base de datos, agregamos el ID a existingTagIds
            existingTags.push(tag);
            existingTagIds.push(rows[0].id); // Suponiendo que solo esperamos un ID por tag
          } else {
            // El tag no existe en la base de datos y necesitará ser insertado
            newTags.push(tag);
          }
        }
      
        return { existingTags, newTags, existingTagIds };
    }

    static async insertPostTagRelationships(postId, tagIds) {
        try {
          for (const tagId of tagIds) {
            await pool.query(
              `INSERT INTO Posts_Tags (post_id, tag_id) VALUES ($1, $2);`,
              [postId, tagId]
            );
          }
        } catch (error) {
          console.error('Error inserting post-tag relationships:', error);
          throw new Error('Error inserting post-tag relationships');
        }
    }

    static async getTagsForPost(postId) {
        try {
          const { rows } = await pool.query(
            `SELECT t.name 
             FROM tags t
             INNER JOIN posts_tags pt ON t.id = pt.tag_id
             WHERE pt.post_id = $1;`,
            [postId]
          );
          return rows.map(tag => tag.name);
        } catch (error) {
          console.error('Error fetching tags for post:', error);
          throw new Error('Error fetching tags for post');
        }
    }

    static async getCreatorOfPost(creatorId) {
        try {
          const { rows } = await pool.query(
            `SELECT id, name, username, email, phonenumber, bio, imageUrl, imageId FROM users WHERE id = $1;`,
            [creatorId]
          );
          return rows;
        } catch (error) {
          console.error('Error fetching user for post:', error);
          throw new Error('Error fetching user for post');
        }
    }

    static async userHasLiked (user_id, post_id) {
      try {
        const res = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND post_id = $2', [user_id, post_id])
 
        console.log(res.rows)

        return res.rows.length

      } catch (e) {
        console.log(e)
      }
    }

    static async like(user_id, post_id) {
        try {  
          await pool.query('BEGIN');

    
          // Agregar like a la tabla de likes
          await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2)', [user_id, post_id]);
          

          await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [post_id]);

    
          await pool.query('COMMIT');
        } catch (error) {
          await pool.query('ROLLBACK');
    
          console.error('Error al dar like:', error);
          throw new Error('Error al dar like');
        }
    }

    static async unlike(user_id, post_id) {
        try {
          await pool.query('BEGIN');
    
          // Eliminar el like de la tabla likes
          await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [user_id, post_id]);
    
          await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [post_id]);

    
          await pool.query('COMMIT');
    
        } catch (error) {
          await pool.query('ROLLBACK');
    
          console.error('Error al quitar like:', error); 
          throw new Error('Error al quitar like');
        }
    }

    static async save(user_id, post_id) {
        try {
          await pool.query('BEGIN');
    
          // Agregar el like a la tabla likes
          await pool.query('INSERT INTO saves (user_id, post_id) VALUES ($1, $2)', [user_id, post_id]);
    
          // await pool.query('UPDATE posts SET has_saved = TRUE WHERE id = $1', [post_id]);
    
          await pool.query('COMMIT');
    
        } catch (error) {
          await pool.query('ROLLBACK');
    
          console.error('Error saving post:', error);
          throw new Error('Error saving post');
        }
    }

    static async unsave(user_id, post_id) {
        try {
          await pool.query('BEGIN');
    
          // Eliminar el like de la tabla likes
          await pool.query('DELETE FROM saves WHERE user_id = $1 AND post_id = $2', [user_id, post_id]);
    
          // await pool.query('UPDATE posts SET has_saved = FALSE WHERE id = $1', [post_id]);
    
          await pool.query('COMMIT');
    
        } catch (error) {
          await pool.query('ROLLBACK');
    
          console.error('Error unsaving post:', error);
          throw new Error('Error unsaving post');
        }
    }
}

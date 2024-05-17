import { createToken } from "../../utils.js";
import bcrypt from 'bcrypt'
import pool from '../../db/postgresql.js'

export class LoginModel {
  static async login(body) {
    const { email, password } = body;

    try {
      const result = await pool.query(
        'SELECT id, name, username, password, email, phonenumber, bio, imageUrl, imageId FROM users WHERE email = $1;',
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return null; // Usuario no encontrado
      }

      const passwordCorrect = await bcrypt.compare(password, user.password);

      if (!passwordCorrect) {
        return null; // Contraseña incorrecta
      }

      const token = createToken({
        id: user.id,
        username: user.username, 
        email: user.email
      });

      user.token = token;

      return user;
    } catch (error) {
      console.error('Error al realizar el inicio de sesión:', error);
      return null;
    }
  }
}

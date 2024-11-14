import { Pool } from 'pg';
import argon2 from 'argon2';

/**
 * Class representing database interactions for login and registration.
 */
export class Database {
  #pool: Pool;

  /**
   * Initialize the Database class.
   */
  constructor() {
    const {
      DATABASE_USER = 'postgres',
      DATABASE_PASSWORD = 'perunalaatikko',
      DATABASE_NAME = 'testdb',
      DATABASE_HOST = 'localhost',
    } = process.env;

    this.#pool = new Pool({
      host: DATABASE_HOST,
      user: DATABASE_USER,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      port: 5432
    });

    this.#pool
      .connect()
      .then(() => console.log('Connected to database'))
      .catch((error) => console.error('Database connection error:', error));
  }

  /**
   * Check if a user exists based on their username.
   * @param {string} username - The username to check.
   * @returns {Promise<boolean>} A promise resolving to true if the user exists, false otherwise.
   */
  async doesUserExist(username: string): Promise<boolean> {
    try {
      const result = await this.#pool.query(`SELECT 1 FROM users WHERE username = $1`, [username]);
      if (result.rowCount === null) return false;
      return result.rowCount > 0;
    } catch (error) {
      console.warn('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Register a new user.
   * @param {string} username - The user's username.
   * @param {string} password - The user's password to be hashed before storage.
   * @returns {Promise<boolean>} A promise resolving to true if the user was registered successfully, false otherwise.
   */
  async register(username: string, password: string): Promise<boolean> {
    try {
      // Hash the password using Argon2
      const hashedPassword = await argon2.hash(password);
      
      // Store the hashed password in the database
      await this.#pool.query(`INSERT INTO users (username, password) VALUES ($1, $2)`, [username, hashedPassword]);
      
      return true;
    } catch (error) {
      console.warn('Error registering user:', error);
      return false;
    }
  }

  /**
   * Login a user by checking if the provided password matches the stored hashed password.
   * @param {string} username - The user's username.
   * @param {string} password - The user's password to verify.
   * @returns {Promise<boolean>} A promise resolving to true if the login was successful, false otherwise.
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      // Query the database to get the stored password hash
      const result = await this.#pool.query(`SELECT password FROM users WHERE username = $1`, [username]);

      if (result.rowCount === 0) {
        console.log('User not found');
        return false;
      }

      const storedPassword = result.rows[0].password;
      
      // Verify the password using Argon2
      const isMatch = await argon2.verify(storedPassword, password);
      
      return isMatch;
    } catch (error) {
      console.warn('Error logging in:', error);
      return false;
    }
  }
}

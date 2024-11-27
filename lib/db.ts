import { Pool } from 'pg';
import argon2 from 'argon2';

/**
 * Database class for handling login, registration, and advanced interactions such as groups, favorites, and followers.
 */
export class Database {
  #pool: Pool;

  /**
   * Initialize the Database class and connect to the database.
   */
  constructor() {
    const {
      DATABASE_USER = 'postgres',
      DATABASE_PASSWORD = 'Perunalaatikko4321',
      DATABASE_NAME = 'moviedb',
      DATABASE_HOST = 'localhost',
    } = process.env;

    this.#pool = new Pool({
      host: DATABASE_HOST,
      user: DATABASE_USER,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      port: 5432,
    });

    this.#pool
      .connect()
      .then(() => console.log('Connected to the database'))
      .catch((error) => console.error('Database connection error:', error));
  }

  /**
   * Disconnect from the database by closing the connection pool.
   */
  async disconnect(): Promise<void> {
    try {
      await this.#pool.end();
      console.log('Disconnected from the database');
    } catch (error) {
      console.error('Error disconnecting from the database:', error);
    }
  }

  /**
   * Check if a user exists by username.
   */
  async doesUserExist(username: string): Promise<boolean> {
    try {
      const result = await this.#pool.query(`SELECT 1 FROM "User" WHERE username = $1`, [username]);
      if (result.rowCount === null) return false;
      return result.rowCount > 0;
    } catch (error) {
      console.warn('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Register a new user with a hashed password.
   */
  async register(username: string, email: string, password: string): Promise<boolean> {
    try {
      const hashedPassword = await argon2.hash(password)
      console.log('Inserting user into database:', { username, email, password: hashedPassword })
      await this.#pool.query(
        `INSERT INTO "User" (username, email, password) VALUES ($1, $2, $3)`,
        [username, email, hashedPassword]
      )
      console.log(`User ${username} registered successfully.`)
      return true
    } catch (error) {
      console.warn('Error registering user:', error)
      return false
    }
  }

  /**
   * Login a user by verifying the password.
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const result = await this.#pool.query(`SELECT password FROM "User" WHERE username = $1`, [username]);
      if (result.rowCount === 0) return false;
      const isMatch = await argon2.verify(result.rows[0].password, password);
      return isMatch;
    } catch (error) {
      console.warn('Error logging in:', error);
      return false;
    }
  }

  // Method to get user profile based on username
  async getUserProfile(username: string): Promise<any | null> {
    try {
      const result = await this.#pool.query(
        'SELECT username, email, createdat FROM "User" WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return null; // User not found
      }

      return result.rows[0]; // Return the first matching row
    } catch (error) {
      console.error('Error fetching user profile from database:', error);
      throw new Error('Database error');
    }
  }

  /**
   * Delete a user and their related data.
   */
  async deleteUser(username: string): Promise<boolean> {
    try {
      const userID = await this.getUserID(username);
      if (!userID) return false;

      await this.#pool.query(`DELETE FROM "FavoriteList" WHERE userID = $1`, [userID]);
      await this.#pool.query(`DELETE FROM "Follower" WHERE followerID = $1 OR followedID = $1`, [userID]);
      await this.#pool.query(`DELETE FROM "GroupMember" WHERE userID = $1`, [userID]);
      await this.#pool.query(`DELETE FROM "User" WHERE userID = $1`, [userID]);

      return true;
    } catch (error) {
      console.warn('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Add a movie to a user's favorite list.
   */
  async addToFavoriteList(username: string, movieID: number): Promise<boolean> {
    try {
      const userID = await this.getUserID(username);
      if (!userID) return false;

      await this.#pool.query(`INSERT INTO "FavoriteList" (userID, movieID) VALUES ($1, $2)`, [userID, movieID]);
      return true;
    } catch (error) {
      console.warn('Error adding movie to favorite list:', error);
      return false;
    }
  }

  /**
   * Get all movies in a user's favorite list.
   */
  async getFavoriteList(username: string): Promise<any[]> {
    try {
      const userID = await this.getUserID(username);
      if (!userID) return [];

      const result = await this.#pool.query(
        `SELECT m.movieID, m.title FROM "FavoriteList" f JOIN "Movie" m ON f.movieID = m.movieID WHERE f.userID = $1`,
        [userID]
      );

      return result.rows;
    } catch (error) {
      console.warn('Error fetching favorite list:', error);
      return [];
    }
  }

  /**
   * Create a new group with the owner as the first member.
   */
  async createGroup(groupName: string, ownerUsername: string): Promise<boolean> {
    try {
      const ownerID = await this.getUserID(ownerUsername);
      if (!ownerID) return false;

      const groupResult = await this.#pool.query(
        `INSERT INTO "Group" (name, ownerID) VALUES ($1, $2) RETURNING groupID`,
        [groupName, ownerID]
      );

      const groupID = groupResult.rows[0].groupID;
      await this.#pool.query(`INSERT INTO "GroupMember" (groupID, userID) VALUES ($1, $2)`, [groupID, ownerID]);
      return true;
    } catch (error) {
      console.warn('Error creating group:', error);
      return false;
    }
  }

  /**
   * Delete a group and its members.
   */
  async deleteGroup(groupID: number): Promise<boolean> {
    try {
      await this.#pool.query(`DELETE FROM "GroupMember" WHERE groupID = $1`, [groupID]);
      await this.#pool.query(`DELETE FROM "Group" WHERE groupID = $1`, [groupID]);
      return true;
    } catch (error) {
      console.warn('Error deleting group:', error);
      return false;
    }
  }

  /**
   * Get all groups a user belongs to.
   */
  async getUserGroups(username: string): Promise<any[]> {
    try {
      const userID = await this.getUserID(username);
      if (!userID) return [];

      const result = await this.#pool.query(
        `SELECT g.groupID, g.name FROM "Group" g JOIN "GroupMember" gm ON g.groupID = gm.groupID WHERE gm.userID = $1`,
        [userID]
      );

      return result.rows;
    } catch (error) {
      console.warn('Error fetching user groups:', error);
      return [];
    }
  }

  /**
   * Get all members of a specific group.
   */
  async getGroupMembers(groupID: number): Promise<any[]> {
    try {
      const result = await this.#pool.query(
        `SELECT u.username FROM "User" u JOIN "GroupMember" gm ON u.userID = gm.userID WHERE gm.groupID = $1`,
        [groupID]
      );

      return result.rows;
    } catch (error) {
      console.warn('Error fetching group members:', error);
      return [];
    }
  }

  /**
   * Follow another user.
   */
  async followUser(followerUsername: string, followedUsername: string): Promise<boolean> {
    try {
      const followerID = await this.getUserID(followerUsername);
      const followedID = await this.getUserID(followedUsername);
      if (!followerID || !followedID) return false;

      await this.#pool.query(`INSERT INTO "Follower" (followerID, followedID) VALUES ($1, $2)`, [followerID, followedID]);
      return true;
    } catch (error) {
      console.warn('Error following user:', error);
      return false;
    }
  }

  /**
   * Unfollow a user.
   */
  async unfollowUser(followerUsername: string, followedUsername: string): Promise<boolean> {
    try {
      const followerID = await this.getUserID(followerUsername);
      const followedID = await this.getUserID(followedUsername);
      if (!followerID || !followedID) return false;

      await this.#pool.query(`DELETE FROM "Follower" WHERE followerID = $1 AND followedID = $2`, [followerID, followedID]);
      return true;
    } catch (error) {
      console.warn('Error unfollowing user:', error);
      return false;
    }
  }

  /**
   * Helper method to get a user's ID by username.
   */
  private async getUserID(username: string): Promise<number | null> {
    try {
      const result = await this.#pool.query(`SELECT userID FROM "User" WHERE username = $1`, [username]);
      
      // If no rows were returned, return null
      if (result.rowCount === 0) return null;
  
      return result.rows[0].userid;
    } catch (error) {
      console.warn('Error fetching user ID:', error);
      return null;
    }
  }
  
}

import { Pool } from 'pg';
import argon2 from 'argon2';

/**
 * Database class for handling login, registration, and advanced interactions such as groups, favorites.
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
      DATABASE_PORT = 5432,
    } = process.env;

    this.#pool = new Pool({
      host: DATABASE_HOST,
      user: DATABASE_USER,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      port: DATABASE_PORT,
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
      const userid = await this.getUserID(username);
      if (!userid) return false;

      await this.#pool.query(`DELETE FROM "FavoriteList" WHERE userid = $1`, [userid]);
      await this.#pool.query(`DELETE FROM "GroupMember" WHERE userid = $1`, [userid]);
      await this.#pool.query(`DELETE FROM "User" WHERE userid = $1`, [userid]);

      return true;
    } catch (error) {
      console.warn('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Add a movie to a user's favorite list.
   */
  async addToFavoriteList(username: string, movied: number, title: string): Promise<boolean> {
    try {
      const userid = await this.getUserID(username);
      if (!userid) return false;

      await this.#pool.query(`INSERT INTO "FavoriteList" (userid, movieid, createdat, title) VALUES ($1, $2, $3, $4)`, [userid, movied, new Date().toISOString(), title]);
      return true;
    } catch (error) {
      console.warn('Error adding movie to favorite list:', error);
      return false;
    }
  }

  async deleteFromFavoriteList(username: string, movieid: number): Promise<boolean> {
    try {
      const userid = await this.getUserID(username);
      if (!userid) return false;

      const result = await this.#pool.query(
        `DELETE FROM "FavoriteList" WHERE userid = $1 AND movieid = $2`,
        [userid, movieid]
      );

      // Check if any row was deleted
      if (result.rowCount === 0) {
        console.warn('No favorite entry found for deletion.');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error deleting movie from favorite list:', error);
      return false;
    }
  }


  /**
   * Get all movies in a user's favorite list.
   */
  async getFavoriteList(username: string): Promise<any[]> {
    try {
      const userid = await this.getUserID(username);
      if (!userid) return [];

      const result = await this.#pool.query(
        `SELECT movieid, title FROM "FavoriteList" where userid = $1`,
        [userid]
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
  async createGroup(groupName: string, creatorUsername: string): Promise<number | null> {
    try {
      // Get the user ID based on the creator's username
      const id = await this.getUserID(creatorUsername);
  
      // Insert new group into the "Group" table
      const result = await this.#pool.query(
        `INSERT INTO "Group" (name, ownerid) VALUES ($1, $2) RETURNING groupid`,
        [groupName, id]
      );
  
      if (result.rowCount === 0) {
        console.warn('Failed to create group');
        return null;
      }
  
      const groupId = result.rows[0].groupid;
  
      // Insert the creator into the GroupMember table, marking them as the owner
      const success = await this.#pool.query(
        `INSERT INTO "GroupMember" (groupid, userid, isowner) VALUES ($1, $2, true)`,
        [groupId, id]
      );
  
      if (success.rowCount === 0) {
        console.warn('Failed to add user as a member of the group');
        return null;
      }
  
      return groupId;
    } catch (error) {
      console.warn('Error creating group:', error);
      return null;
    }
  }
  
  
  

  /**
   * Delete a group and its members.
   */
  async deleteGroup(groupid: number): Promise<boolean> {
    try {
      await this.#pool.query(`DELETE FROM "GroupMember" WHERE "groupid" = $1`, [groupid]);
      await this.#pool.query(`DELETE FROM "Group" WHERE "groupid" = $1`, [groupid]);
      return true;
    } catch (error) {
      console.warn('Error deleting group:', error);
      return false;
    }
  }


/**
 * Add a movie to the Movie table and associate it with a group.
 */
async addMovieAndLinkToGroup(groupid: number, movieName: string, tmdbID: number, watchDate: string): Promise<boolean> {
  try {
    let movieID: number;

    // Step 1: Check if the movie already exists based on tmdbID
    const movieQuery = await this.#pool.query(
      `SELECT movieID FROM "Movie" WHERE tmdbID = $1`,
      [tmdbID]
    );

    if (movieQuery.rows.length > 0) {
      // Movie already exists, get the movieID
      movieID = movieQuery.rows[0].movieid;
      console.log(`Movie already exists with movieID: ${movieID}`);
    } else {
      // Movie does not exist, insert into the Movie table
      const movieResult = await this.#pool.query(
        `INSERT INTO "Movie" (name, tmdbID, createdAt, updatedAt) 
         VALUES ($1, $2, $3, $4) RETURNING movieID`,
        [movieName, tmdbID, new Date().toISOString(), new Date().toISOString()]
      );

      // Ensure the movieID is returned from the INSERT query
      if (movieResult.rows.length > 0) {
        movieID = movieResult.rows[0].movieid;
        console.log(`New movie inserted with movieID: ${movieID}`);
      } else {
        console.error('Failed to insert movie, movieID not returned');
        return false;
      }
    }

    // Ensure movieID is set before proceeding
    if (!movieID) {
      console.error('No movieID found, cannot link to group.');
      return false;
    }

    // Step 2: Update the GroupMovie table to link the movie to the group with a watchDate
    await this.#pool.query(
      `INSERT INTO "GroupMovie" (groupID, movieID, watchDate) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (groupID, movieID) DO NOTHING`,
      [groupid, movieID, watchDate]
    );

    console.log(`Movie '${movieName}' added and linked to group with ID ${groupid} for watch on ${watchDate}.`);
    return true;
  } catch (error) {
    console.warn('Error adding movie and linking to group:', error);
    return false;
  }
}


async getGroupMoviesWithWatchDate(groupid: number): Promise<any[]> {
  const query = `
    SELECT m.name, m.tmdbID, gm.watchDate 
    FROM "Movie" m
    JOIN "GroupMovie" gm ON m.movieID = gm.movieID
    WHERE gm.groupID = $1
  `;
  const result = await this.#pool.query(query, [groupid]);
  return result.rows;
}


async getGroupMovies(groupid: number): Promise<any> {
  try {
    // Query to find all movies linked to the groupID via the GroupMovie relationship table
    const groupQuery = await this.#pool.query(
      `SELECT m.movieID, m.name, m.tmdbID
       FROM "Movie" m
       JOIN "GroupMovie" gm ON m.movieID = gm.movieID
       WHERE gm.groupID = $1`,
      [groupid]
    );

    if (groupQuery.rows.length > 0) {
      return groupQuery.rows; // Return the list of movies linked to the group
    } else {
      return null; // No movies linked to this group
    }
  } catch (error) {
    console.warn('Error fetching group movies:', error);
    return null;
  }
}

async addUserToGroup(groupid: number, username: string, isOwner: boolean = false): Promise<boolean> {
  try {
    // Get the user's ID from the username
    const userID = await this.getUserID(username);
    if (!userID) return false;

    // Check if the user is already a member of the group
    const existingMember = await this.#pool.query(
      `SELECT 1 FROM "GroupMember" WHERE groupid = $1 AND userid = $2`,
      [groupid, userID]
    );

    if (existingMember.rowCount) {
      if (existingMember.rowCount > 0) {
        console.warn('User is already a member of the group');
        return false; // User is already in the group, so no need to add them again
      }
    }
    // Insert the user into the GroupMember table, marking them as the owner if isOwner is true
    await this.#pool.query(
      `INSERT INTO "GroupMember" (groupid, userid, isowner) 
       VALUES ($1, $2, $3)`,
      [groupid, userID, isOwner]
    );

    return true;
  } catch (error) {
    console.warn('Error adding user to group:', error);
    return false;
  }
}



async getGroupCreator(groupid: number): Promise<number | null> {
  try {
    const res = await this.#pool.query(
      `SELECT userid FROM "GroupMember" WHERE groupid = $1 AND isowner = true`,
      [groupid]
    );
    return res.rows.length > 0 ? res.rows[0].userid : null;
  } catch (error) {
    console.warn('Error fetching group creator:', error);
    return null;
  }
}




async getGroupById(groupId: number): Promise<any> {
  // Use a parameterized query to prevent SQL injection and ensure proper syntax
  const result = await this.#pool.query('SELECT * FROM "Group" WHERE groupid = $1', [groupId]);

  // Check if the result has rows and return the first row (assuming group IDs are unique)
  if (result.rows.length === 0) {
    return null; // No group found
  }

  return result.rows[0]; // Return the first group found
}

async getAllGroups(): Promise<any> {
  const result = await this.#pool.query('SELECT * FROM "Group"');

  // Check if the result has rows 
  if (result.rows.length === 0) {
    return null; // No groups found
  }

  return result.rows; // Return all groups found
}



async getGroupIdByName(groupName: string): Promise<number | null> {
  try {
    const result = await this.#pool.query(
      `SELECT groupid FROM "Group" WHERE name = $1`,
      [groupName]
    );

    if (result.rowCount === 0) {
      return null; // No group found with the given name
    }

    return result.rows[0].groupid; // Return the group ID
  } catch (error) {
    console.warn('Error fetching group ID by name:', error);
    return null;
  }
}



async checkIfUserIsOwner(groupid: number, username: string): Promise<boolean> {
  try {
    const userid = await this.getUserID(username);
    console.log(username)
    if (!userid) {
      console.warn('User not found');
      return false;
    }

    // Check if the user is the owner in the GroupMember table
    const result = await this.#pool.query(
      `SELECT isowner FROM "GroupMember" WHERE groupid = $1 AND userid = $2`,
      [groupid, userid]
    );

    // If the user is an owner, the isowner flag will be true
    if (result.rows.length > 0 && result.rows[0].isowner) {
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Error checking if user is owner:', error);
    return false;
  }
}


async removeUserFromGroup(groupid: number, username: string): Promise<boolean> {
  try {
    const userid = await this.getUserID(username);
    if (!userid) {
      console.warn('User not found');
      return false;
    }

    // Delete the user from the GroupMember table
    await this.#pool.query(
      `DELETE FROM "GroupMember" WHERE groupid = $1 AND userid = $2`,
      [groupid, userid]
    );

    console.log(`User ${username} removed from group with ID ${groupid}`);
    return true;
  } catch (error) {
    console.warn('Error removing user from group:', error);
    return false;
  }
}


  /**
   * Get all groups a user belongs to.
   */
  async getUserGroups(username: string): Promise<any[]> {
    try {
      const userid = await this.getUserID(username);
      if (!userid) return [];

      const result = await this.#pool.query(
        `SELECT g."groupid", g.name FROM "Group" g JOIN "GroupMember" gm ON g."groupid" = gm."groupid" WHERE gm.userid = $1`,
        [userid]
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
  async getGroupMembers(groupid: number): Promise<any[]> {
    try {
      const result = await this.#pool.query(
        `SELECT u.username, gm.isowner FROM "User" u 
         JOIN "GroupMember" gm ON u.userid = gm.userid 
         WHERE gm."groupid" = $1`,
        [groupid]
      );
  
      return result.rows;
    } catch (error) {
      console.warn('Error fetching group members:', error);
      return [];
    }
  }

  async updatePassword(username: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Step 1: Fetch the stored hashed password from the database
      const result = await this.#pool.query(
        `SELECT password FROM "User" WHERE username = $1`,
        [username]
      );
  
      if (result.rowCount === 0) {
        console.warn('User not found');
        return false;
      }
  
      // Step 2: Verify the current password
      const storedHashedPassword = result.rows[0].password;
      const isCurrentPasswordValid = await argon2.verify(storedHashedPassword, currentPassword);
  
      if (!isCurrentPasswordValid) {
        console.warn('Current password is incorrect');
        return false; // Incorrect current password
      }
  
      // Step 3: Hash the new password
      const newHashedPassword = await argon2.hash(newPassword);
  
      // Step 4: Update the password in the database
      await this.#pool.query(
        `UPDATE "User" SET password = $1 WHERE username = $2`,
        [newHashedPassword, username]
      );
  
      console.log(`Password updated successfully for user ${username}`);
      return true; // Password successfully updated
    } catch (error) {
      console.error('Error updating password:', error);
      return false; // Error during password update
    }
  }

  async getReviews(userid: number): Promise<any> {
    if (!userid) {
      throw new Error('userid is required to fetch reviews.');
    }

    return this.#pool.query(
      `SELECT 
         r.reviewid, 
         r.movied, 
         r.rating, 
         r.text, 
         r."createdAt", 
         r."updatedAt"
       FROM 
         "Review" r
       WHERE 
         r.userid = $1
       ORDER BY 
         r."createdAt" DESC`,
      [userid]
    );
  }

  async getAllReviews(): Promise<any> {
    return this.#pool.query(
      `SELECT 
         r.reviewid, 
         r.movied, 
         r.rating, 
         r.text, 
         r."createdAt", 
         r."updatedAt", 
         u.email
       FROM 
         "Review" r
       INNER JOIN 
         "User" u ON r.userid = u.userid`
    );
  }

  async insertReview(userid: number, movied: number, rating: number, text: string) {
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    return this.#pool.query(
      `INSERT INTO "Review" (userid, movied, rating, text, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userid, movied, rating, text, createdAt, updatedAt]
    );
  }

  async getUserIDByEmail(email: string) {
    return this.#pool.query(`SELECT userid FROM "User" WHERE email = $1`, [email]);
  }

  /**
   * Delete a review by reviewID
   */
  async deleteReview(reviewID: number) {
    return this.#pool.query(`DELETE FROM "Review" WHERE reviewID = $1`, [reviewID]);
  }

  /**
   * Helper method to get a user's ID by username.
   */
  private async getUserID(username: string): Promise<number | null> {
    try {
      const result = await this.#pool.query(`SELECT userid FROM "User" WHERE username = $1`, [username]);

      // If no rows were returned, return null
      if (result.rowCount === 0) return null;

      return result.rows[0].userid;
    } catch (error) {
      console.warn('Error fetching user ID:', error);
      return null;
    }
  }

}

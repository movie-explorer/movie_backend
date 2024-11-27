import { Database } from '../lib/db'
import argon2 from 'argon2'

jest.mock('pg', () => {
    const mockClient = {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(null),  
      end: jest.fn().mockResolvedValue(undefined), 
    }
  
    return {
      Pool: jest.fn(() => mockClient),
    }
  })
  

describe('Database Class', () => {
  let db: Database
  const mockPool = new (require('pg').Pool)()

  beforeEach(() => {
    db = new Database()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    if (db) {
        // Disconnect from the database
        await db.disconnect()
        db = null as any  
      }// Close the connection after each test
  })

  describe('doesUserExist', () => {
    it('returns true if user exists', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 })
      const result = await db.doesUserExist('testUser')
      expect(result).toBe(true)
    })

    it('returns false if user does not exist', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 })
      const result = await db.doesUserExist('testUser')
      expect(result).toBe(false)
    })
  })

  describe('register', () => {
    it('registers a new user with hashed password', async () => {
      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedPassword')
      mockPool.query.mockResolvedValue({})

      const result = await db.register('testUser', 'test@test.com', 'testPassword')
      expect(result).toBe(true)
      expect(argon2.hash).toHaveBeenCalledWith('testPassword')
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO "User" (username, email, password) VALUES ($1, $2, $3)',
        ['testUser', 'test@test.com', 'hashedPassword']
      )
    })
  })

  describe('login', () => {
    it('returns true for valid username and password', async () => {
      jest.spyOn(argon2, 'verify').mockResolvedValue(true)
      mockPool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ password: 'hashedPassword' }],
      })

      const result = await db.login('testUser', 'testPassword')
      expect(result).toBe(true)
      expect(argon2.verify).toHaveBeenCalledWith('hashedPassword', 'testPassword')
    })
  })

  describe('deleteUser', () => {
    it('deletes a user and related data', async () => {
      jest.spyOn(db as any, 'getUserID').mockResolvedValue(1)
      mockPool.query.mockResolvedValue({})

      const result = await db.deleteUser('testUser')
      expect(result).toBe(true)
      expect(mockPool.query).toHaveBeenCalledTimes(4) // Deletes from multiple tables
    })
  })

  describe('Favorites', () => {
    it('adds to favorite list', async () => {
      jest.spyOn(db as any, 'getUserID').mockResolvedValue(1)
      mockPool.query.mockResolvedValue({})

      const result = await db.addToFavoriteList('testUser', 123)
      expect(result).toBe(true)
    })

    it('fetches favorite list', async () => {
      jest.spyOn(db as any, 'getUserID').mockResolvedValue(1)
      mockPool.query.mockResolvedValue({
        rows: [{ movieID: 1, title: 'Inception' }],
      })

      const result = await db.getFavoriteList('testUser')
      expect(result).toEqual([{ movieID: 1, title: 'Inception' }])
    })
  })
})

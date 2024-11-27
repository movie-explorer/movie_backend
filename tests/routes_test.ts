import request from 'supertest'
import { createServer } from 'http'
import { router } from '../routes/routes'

const server = createServer((req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    router(req, res, url.pathname)
})

let token: string 

beforeAll(async () => {
    // wait for start
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create a new user for the tests
    await request(server)
        .post('/register')
        .send({
            username: 'testUser',
            email: 'test@example.com',
            password: 'TestPassword1'
        })

    // Login to get the token
    const loginResponse = await request(server)
        .post('/login')
        .send({ username: 'testUser', password: 'TestPassword1', email: 'test@example.com' })

    token = loginResponse.body.token 
})

describe('API Routes', () => {
    it('should return root content for GET /', async () => {
        const response = await request(server).get('/')
        const expected = { message: 'Hello World' }

        try {
            expect(response.status).toBe(200)
            expect(response.body).toEqual(expected)
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })

    it('should return test content for GET /test', async () => {
        const response = await request(server)
            .get('/test')
            .set('Authorization', token) 
        const expected = { message: 'You are logged in!' }

        try {
            expect(response.status).toBe(200)
            expect(response.body).toEqual(expected)
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })

    it('should handle user registration with POST /register', async () => {
        const response = await request(server)
            .post('/register')
            .send({
                username: 'testUser2',
                email: 'test2@example.com',
                password: 'TestPassword2'
            })
        const expected = { message: 'User registered successfully' }

        try {
            expect(response.status).toBe(200)
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })

    it('should return error for weak password during registration', async () => {
        const response = await request(server)
            .post('/register')
            .send({
                username: 'testUserWeak',
                email: 'testweak@example.com',
                password: 'short'  // Weak password (too short)
            })
        const expected = { error: 'Password must contain at least one uppercase letter, number, and be 8 characters long.' }

        try {
            expect(response.status).toBe(409)
            expect(response.body).toEqual(expected)
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })

    it('should handle user login with POST /login', async () => {
        const response = await request(server)
            .post('/login')
            .send({
                username: 'testUser',
                password: 'TestPassword1',
                email: 'test@example.com'
            })
        const expected = { message: 'Logged in successfully', token: expect.any(String) }

        try {
            expect(response.status).toBe(200)
            expect(response.body.token).toBeDefined()
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
        token = response.body.token
    })

    it('should return error for login with incorrect credentials', async () => {
        const response = await request(server)
            .post('/login')
            .send({
                username: 'testUser',
                password: 'WrongPassword',
                email: 'test@example.com'
            })
        const expected = { error: 'Invalid credentials' }

        try {
            expect(response.status).toBe(401)
            expect(response.body.error).toContain('Invalid credentials')
        } catch (error) {
            console.log('Expected:', JSON.stringify(expected))
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })

    it('should handle logout with GET /logout', async () => {
        const response = await request(server)
            .get('/logout')
            .set('Authorization', token)

        try {
            expect(response.status).toBe(200)
        } catch (error) {
            console.log('Actual:', JSON.stringify(response.body))
            throw error
        }
    })
})

afterAll(async () => {
    const loginResponseUser1 = await request(server)
        .post('/login')
        .send({
            username: 'testUser',
            password: 'TestPassword1',
            email: 'test@example.com'
        })

    const tokenUser1 = loginResponseUser1.body.token 

    const loginResponseUser2 = await request(server)
        .post('/login')
        .send({
            username: 'testUser2',
            password: 'TestPassword2',
            email: 'test2@example.com'
        })

    const tokenUser2 = loginResponseUser2.body.token 

    const deleteResponseUser1 = await request(server)
        .delete('/deleteme')
        .set('Authorization', tokenUser1) 

    try {
        expect(deleteResponseUser1.status).toBe(200)
    } catch (error) {
        console.log('Actual for User 1:', JSON.stringify(deleteResponseUser1.body))
        throw error
    }

    const deleteResponseUser2 = await request(server)
        .delete('/deleteme')
        .set('Authorization', tokenUser2) 

    try {
        expect(deleteResponseUser2.status).toBe(200)
    } catch (error) {
        console.log('Actual for User 2:', JSON.stringify(deleteResponseUser2.body))
        throw error
    }
    server.close()
})


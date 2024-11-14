import express from 'express';
import { Database } from '../lib/db';
import { Auth } from '../lib/auth';

const router = express.Router();
const db = new Database();
const auth = new Auth('you will never guess this', 1 * 60 * 10000); // Secret for auth

router.get('/', (_req, res) => {
  res.send('Hello World');
});

// Login Route
router.post('/login', async (req: any, res: any) => {
  console.log(req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }

  try {
    const loggedIn = await db.login(username, password);

    if (!loggedIn) {
      return res.status(401).send('Invalid credentials');
    }

    const authToken = auth.setLoggedIn(username);
    console.log(`User ${username} logged in`);
    return res.status(200).json({ message: 'Logged in successfully', token: authToken });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).send('Internal server error');
  }
});

// Register Route
router.post('/register', async (req: any, res: any) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }

  try {
    const userExists = await db.doesUserExist(username);

    if (userExists) {
      return res.status(409).send('User already exists');
    }

    const userCreated = await db.register(username, password);  

    if (!userCreated) {
      return res.status(500).send('User registration failed');
    }

    console.log(`User ${username} registered`);
    return res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).send('Internal server error');
  }
});

// Test Route
router.get('/test', (req: any, res: any) => {
  const token = req.headers.cookie;

  if (!token || !auth.isUserLoggedin(token)) {
    return res.status(401).send('Not logged in');
  }

  res.status(200).send('You are logged in!');
});

export default router;

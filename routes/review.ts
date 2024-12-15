import { IncomingMessage, ServerResponse } from 'http';
import { db } from '../connectors/shared';

export const reviewRoute = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => (body += chunk));
      await new Promise(resolve => req.on('end', resolve));
      const { email, movieID, rating, text } = JSON.parse(body);

      if (!email || !movieID || !rating || !text) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'All fields are required: email, movieID, rating, text.' }));
        return;
      }

      const userId = await db.getUserIDByEmail(email)

      await db.insertReview(userId.rows[0].userid, movieID, rating, text);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Review added successfully!' }));
    } catch (error) {
      console.error('Error adding review:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  } else if (req.method === 'GET') {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const email = url.searchParams.get('email');

      if (!email) {
        const reviewResult = await db.getAllReviews()
        res.end(JSON.stringify({ reviews: reviewResult.rows }));
        return
      }

      const userResult = await db.getUserIDByEmail(email);
      if (userResult.rowCount === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found.' }));
        return;
      }

      const userID = userResult.rows[0].userid;
      const reviewResult = await db.getReviews(userID);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reviews: reviewResult.rows }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }
};

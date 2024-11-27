import { Auth } from '../lib/auth';
import { Database } from '../lib/db';

export const db = new Database();
export const auth = new Auth('you will never guess this', 1 * 60 * 10000);

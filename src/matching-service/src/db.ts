import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Charge le fichier .env situé à la racine du projet (26A/.env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
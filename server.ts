import app from './app';
import { connectDB } from './src/config/db';

// Local / traditional-host entry point. On Vercel the app is served via
// api/index.ts as a serverless function and this file is not used.
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err: unknown) => {
    console.error('MongoDB connection error:', err);
    if (err instanceof Error) console.error(err.message);
    process.exit(1);
  });

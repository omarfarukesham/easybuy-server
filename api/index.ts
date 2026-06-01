import app from '../app';

// Vercel invokes the default export as the request handler. An Express app
// instance is a valid (req, res) handler, so we can export it directly.
export default app;

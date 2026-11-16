import express from 'express';
import AuthRouter from './routes/auth.routes.js';
import AuthorRouter from './routes/authors.routes.js';
import BookRouter from './routes/books.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', AuthRouter)
app.use('/authors', AuthorRouter)
app.use('/books', BookRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app;
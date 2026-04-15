const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { createCorsOptions } = require('./config/corsOptions');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const tagRoutes = require('./routes/tagRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const requestContext = require('./middleware/requestContext');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(requestContext);
app.use(helmet());
app.use(cors(createCorsOptions(env.corsOrigins)));
app.use(express.json());
morgan.token('request-id', (req) => req.requestId);
app.use(morgan(env.nodeEnv === 'production'
  ? ':request-id :remote-addr :method :url :status :res[content-length] - :response-time ms'
  : ':request-id :method :url :status :response-time ms'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.nodeEnv,
    requestId: req.requestId
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.FRONTEND_ORIGIN = 'http://localhost:3000';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  const connectDB = require('../src/config/db');
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  it('registers a user with a default credit count', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.user.credits).toBe(5);
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    await User.create({
      name: 'Existing User',
      email: 'duplicate@example.com',
      passwordHash: 'hashed-password',
      credits: 5,
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'duplicate@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('logs in a user and returns a JWT', async () => {
    const password = 'StrongPass123!';
    const user = await User.create({
      name: 'Login User',
      email: 'login@example.com',
      passwordHash: await require('bcryptjs').hash(password, 12),
      credits: 5,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });
});

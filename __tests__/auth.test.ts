import { PrismaClient } from '@prisma/client';
import createUserIfNotExists from '../pages/api/auth/[...nextauth]'; // Changed to default import

const prisma = new PrismaClient();

describe('Auth Functions', () => {
  beforeAll(async () => {
    // Clear the database before tests
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('createUserIfNotExists creates a new user', async () => {
    const session = {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    await createUserIfNotExists(session);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe(session.user.name);
  });

  test('createSessionIfNotExists creates a new session', async () => {
    const session = {
      user: {
        id: '1', // This should match the ID of the user created in the previous test
      },
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    };
    const token = {
      id: 'unique-session-token', // Use a unique token for testing
    };

    await createSessionIfNotExists(session, token);

    const sessionRecord = await prisma.session.findUnique({
      where: { sessionToken: token.id },
    });

    expect(sessionRecord).not.toBeNull();
    expect(sessionRecord?.userId).toBe(session.user.id);
  });
}); 
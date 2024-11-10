import { PrismaClient } from '@prisma/client';
import { getUserOrCreate, createSessionIfNotExists } from '../pages/api/auth/[...nextauth]';
import { Session } from 'next-auth';

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

  test('getUserOrCreate creates a new user', async () => {
    const mockSession = {
      user: {
        id: '',  // Will be set by the function
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date().toISOString()
    } as Session;

    await getUserOrCreate(mockSession);

    const user = await prisma.user.findUnique({
      where: { email: mockSession.user.email! },
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe(mockSession.user.name);
  });

  test('createSessionIfNotExists creates a new session', async () => {
    const mockSession = {
      user: {
        id: '1', // This should match the ID of the user created in the previous test
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 1000 * 60 * 60).toISOString() // Convert to ISO string
    } as Session;

    const token = {
      id: 'unique-session-token', // Use a unique token for testing
    };

    await createSessionIfNotExists(mockSession, token);

    const sessionRecord = await prisma.session.findUnique({
      where: { sessionToken: token.id },
    });

    expect(sessionRecord).not.toBeNull();
    expect(sessionRecord?.userId).toBe(mockSession.user.id);
  });
});

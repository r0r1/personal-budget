import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, user.id);
    case 'POST':
      return handlePost(req, res, user.id);
    case 'PUT':
      return handlePut(req, res, user.id);
    case 'DELETE':
      return handleDelete(req, res, user.id);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get all OAuth apps for the user
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const apps = await prisma.oAuthApp.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json(apps);
}

// Create a new OAuth app
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { name, description, redirectUris } = req.body;

  if (!name || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({
      error: 'Name and at least one redirect URI are required',
    });
  }

  // Validate redirect URIs
  const validUris = redirectUris.every(uri => {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  });

  if (!validUris) {
    return res.status(400).json({
      error: 'Invalid redirect URI format',
    });
  }

  const app = await prisma.oAuthApp.create({
    data: {
      name,
      description,
      redirectUris,
      userId,
    },
  });

  return res.status(201).json(app);
}

// Update an OAuth app
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { id, name, description, redirectUris } = req.body;

  if (!id || !name || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({
      error: 'ID, name, and at least one redirect URI are required',
    });
  }

  // Validate redirect URIs
  const validUris = redirectUris.every(uri => {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  });

  if (!validUris) {
    return res.status(400).json({
      error: 'Invalid redirect URI format',
    });
  }

  // Verify ownership
  const existingApp = await prisma.oAuthApp.findFirst({
    where: { id, userId },
  });

  if (!existingApp) {
    return res.status(404).json({ error: 'OAuth app not found' });
  }

  const app = await prisma.oAuthApp.update({
    where: { id },
    data: {
      name,
      description,
      redirectUris,
    },
  });

  return res.status(200).json(app);
}

// Delete an OAuth app
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'App ID is required' });
  }

  // Verify ownership
  const existingApp = await prisma.oAuthApp.findFirst({
    where: { id, userId },
  });

  if (!existingApp) {
    return res.status(404).json({ error: 'OAuth app not found' });
  }

  await prisma.oAuthApp.delete({
    where: { id },
  });

  return res.status(204).end();
}

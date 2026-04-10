import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.query
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code required' })

  try {
    const drop = await prisma.drop.findUnique({ where: { code: code.toUpperCase() } })
    if (!drop) return res.status(404).json({ error: 'Drop not found' })

    // Increment views
    await prisma.drop.update({ where: { id: drop.id }, data: { views: { increment: 1 } } })

    return res.status(200).json(drop)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

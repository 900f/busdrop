import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/codeGen'
import { computeDrop, Point, MapType } from '@/lib/dropPhysics'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { mapType, busRoute, landPoint } = req.body as {
      mapType: MapType
      busRoute: Point[]
      landPoint: Point
    }

    if (!mapType || !['current','og'].includes(mapType)) {
      return res.status(400).json({ error: 'Invalid mapType' })
    }
    if (!Array.isArray(busRoute) || busRoute.length < 2) {
      return res.status(400).json({ error: 'busRoute must have at least 2 points' })
    }
    if (!landPoint || typeof landPoint.x !== 'number' || typeof landPoint.y !== 'number') {
      return res.status(400).json({ error: 'Invalid landPoint' })
    }

    const result = computeDrop(busRoute, landPoint, mapType)

    // Unique code
    let code = generateCode()
    for (let i = 0; i < 10; i++) {
      const existing = await prisma.drop.findUnique({ where: { code } })
      if (!existing) break
      code = generateCode()
    }

    // Prisma Json fields need plain serialisable values — JSON.parse(JSON.stringify(...))
    const safe = (v: unknown) => JSON.parse(JSON.stringify(v))

    const drop = await prisma.drop.create({
      data: {
        code,
        mapType,
        busRoute: safe(busRoute),
        dropPoint: safe(result.jumpPoint),
        landPoint: safe(result.landPoint),
        jumpTick: result.jumpTimeSec,
        flightPath: safe(result.flightPath),
      },
    })

    return res.status(200).json({
      code: drop.code,
      jumpPoint: result.jumpPoint,
      jumpTimeSec: result.jumpTimeSec,
      flightPath: result.flightPath,
      landPoint: result.landPoint,
      glideDistM: result.glideDistM,
      freefallDistM: result.freefallDistM,
      jumpAlt: result.jumpAlt,
      targetGroundAlt: result.targetGroundAlt,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[create drop]', msg)
    return res.status(500).json({ error: msg })
  }
}

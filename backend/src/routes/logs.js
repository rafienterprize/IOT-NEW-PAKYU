import express from 'express';

const router = express.Router();

/**
 * GET /api/logs
 * Get device logs with optional filtering
 * Query params: esp, type, limit, offset
 */
export function createLogsRouter(prisma) {
  router.get('/', async (req, res) => {
    try {
      const { esp, type, limit = 50, offset = 0 } = req.query;

      // Validate parameters
      const parsedLimit = Math.min(parseInt(limit) || 50, 500);
      const parsedOffset = parseInt(offset) || 0;

      if (esp && (isNaN(esp) || esp < 1 || esp > 4)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid esp parameter: must be 1, 2, 3, or 4',
        });
      }

      // Build query filters
      const where = {};
      if (esp) {
        where.espNumber = parseInt(esp);
      }
      if (type) {
        where.messageType = type;
      }

      // Get total count
      const total = await prisma.deviceLog.count({ where });

      // Get logs
      const logs = await prisma.deviceLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      });

      res.json({
        success: true,
        data: logs.map(log => ({
          id: log.id,
          espNumber: log.espNumber,
          messageType: log.messageType,
          message: log.message,
          createdAt: log.createdAt.toISOString(),
        })),
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + parsedLimit < total,
        },
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch logs',
        error: error.message,
      });
    }
  });

  return router;
}

export default createLogsRouter;

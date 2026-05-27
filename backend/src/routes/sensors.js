import express from 'express';

const router = express.Router();

/**
 * GET /api/sensors/history
 * Get historical sensor data for charts
 * Query params: esp (required), type (required), from, to, limit
 */
export function createSensorsRouter(prisma) {
  router.get('/history', async (req, res) => {
    try {
      const { esp, type, from, to, limit = 60 } = req.query;

      // Validate required parameters
      if (!esp || !type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: esp and type',
        });
      }

      const espNumber = parseInt(esp);
      if (isNaN(espNumber) || espNumber < 1 || espNumber > 4) {
        return res.status(400).json({
          success: false,
          message: 'Invalid esp parameter: must be 1, 2, 3, or 4',
        });
      }

      if (!['GAS', 'RAIN'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type parameter: must be GAS or RAIN',
        });
      }

      const parsedLimit = Math.min(parseInt(limit) || 60, 1000);

      // Build query filters
      const where = {
        espNumber,
        sensorType: type,
      };

      // Add time range filters if provided
      if (from || to) {
        where.timestamp = {};
        if (from) {
          where.timestamp.gte = new Date(from);
        }
        if (to) {
          where.timestamp.lte = new Date(to);
        }
      }

      // Get sensor history
      const history = await prisma.sensorHistory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parsedLimit,
      });

      // Reverse to get chronological order
      const data = history.reverse().map(record => ({
        timestamp: record.timestamp.toISOString(),
        value: record.value,
        sensorType: record.sensorType,
        espNumber: record.espNumber,
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sensor history',
        error: error.message,
      });
    }
  });

  return router;
}

export default createSensorsRouter;

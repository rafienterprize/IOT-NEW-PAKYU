import express from 'express';

const router = express.Router();

/**
 * GET /api/status
 * Get current status of all ESP32 devices
 */
export function createStatusRouter(prisma) {
  router.get('/', async (req, res) => {
    try {
      const deviceStates = await prisma.deviceState.findMany({
        orderBy: { espNumber: 'asc' },
      });

      res.json({
        success: true,
        data: deviceStates.map(state => ({
          espNumber: state.espNumber,
          isOnline: state.isOnline,
          lastSeenAt: state.lastSeenAt.toISOString(),
          lampState: state.lampState,
          gasValue: state.gasValue,
          rainValue: state.rainValue,
          clotheslinePos: state.clotheslinePos,
          doorState: state.doorState,
          gateState: state.gateState,
          wifiStatus: state.wifiStatus,
        })),
      });
    } catch (error) {
      console.error('Error fetching device status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device status',
        error: error.message,
      });
    }
  });

  return router;
}

export default createStatusRouter;

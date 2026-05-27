import express from 'express';

const router = express.Router();

/**
 * POST /api/wifi
 * Send WiFi configuration to ESP32 device(s)
 * Body: { ssid: string, password: string, target?: number }
 */
export function createWiFiRouter(commandService) {
  router.post('/', async (req, res) => {
    try {
      const { ssid, password, target } = req.body;

      // Validate request
      if (!ssid || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: ssid and password',
        });
      }

      if (target && ![1, 2, 3].includes(target)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target: must be 1, 2, or 3',
        });
      }

      // Send WiFi configuration
      const result = await commandService.sendWiFiConfig(ssid, password, target);

      res.json({
        success: true,
        message: 'WiFi configuration sent',
        data: {
          ssid,
          targets: result.targets,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error sending WiFi config:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send WiFi configuration',
      });
    }
  });

  return router;
}

export default createWiFiRouter;

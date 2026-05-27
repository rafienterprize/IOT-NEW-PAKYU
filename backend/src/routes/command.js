import express from 'express';

const router = express.Router();

/**
 * POST /api/command
 * Send a command to an ESP32 device
 * Body: { target: number, command: string }
 */
export function createCommandRouter(commandService) {
  router.post('/', async (req, res) => {
    try {
      const { target, command } = req.body;

      // Validate request
      if (!target || !command) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: target and command',
        });
      }

      if (![1, 2, 3].includes(target)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target: must be 1, 2, or 3',
        });
      }

      // Execute command
      const result = await commandService.executeCommand(target, command);

      res.json({
        success: true,
        message: 'Command sent successfully',
        data: {
          target: result.target,
          command: result.command,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error sending command:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send command',
      });
    }
  });

  return router;
}

export default createCommandRouter;

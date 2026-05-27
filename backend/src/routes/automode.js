import express from 'express';

const router = express.Router();

/**
 * Auto mode management routes
 */
export function createAutoModeRouter(autoModeService) {
  /**
   * GET /api/automode
   * Get clothesline auto mode status
   */
  router.get('/', async (req, res) => {
    try {
      const state = await autoModeService.getAutoModeState();

      res.json({
        success: true,
        data: {
          enabled: state.enabled,
          rainThreshold: state.rainThreshold,
          lastTriggeredAt: state.lastTriggeredAt ? state.lastTriggeredAt.toISOString() : null,
        },
      });
    } catch (error) {
      console.error('Error fetching auto mode status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch auto mode status',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/automode
   * Enable or disable clothesline auto mode
   * Body: { enabled: boolean }
   */
  router.post('/', async (req, res) => {
    try {
      const { enabled } = req.body;

      // Validate request
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Missing or invalid field: enabled (must be boolean)',
        });
      }

      // Update auto mode
      const result = enabled
        ? await autoModeService.enableAutoMode()
        : await autoModeService.disableAutoMode();

      res.json({
        success: true,
        message: `Auto mode ${enabled ? 'enabled' : 'disabled'}`,
        data: {
          enabled: result.enabled,
          rainThreshold: result.rainThreshold,
        },
      });
    } catch (error) {
      console.error('Error updating auto mode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update auto mode',
        error: error.message,
      });
    }
  });

  return router;
}

export default createAutoModeRouter;

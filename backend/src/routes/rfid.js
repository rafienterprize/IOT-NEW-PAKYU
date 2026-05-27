import express from 'express';

const router = express.Router();

/**
 * RFID whitelist management routes
 */
export function createRFIDRouter(prisma) {
  /**
   * GET /api/rfid/whitelist
   * Get all RFID whitelist entries
   */
  router.get('/whitelist', async (req, res) => {
    try {
      const whitelist = await prisma.rFIDWhitelist.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: whitelist.map(entry => ({
          id: entry.id,
          uid: entry.uid,
          description: entry.description,
          createdAt: entry.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching RFID whitelist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch RFID whitelist',
        error: error.message,
      });
    }
  });

  /**
   * POST /api/rfid/whitelist
   * Add a new RFID UID to the whitelist
   * Body: { uid: string, description?: string }
   */
  router.post('/whitelist', async (req, res) => {
    try {
      const { uid, description } = req.body;

      // Validate UID
      if (!uid) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: uid',
        });
      }

      // Validate UID format (alphanumeric, 8-16 characters)
      if (!/^[A-Za-z0-9]{8,16}$/.test(uid)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UID format: must be alphanumeric, 8-16 characters',
        });
      }

      // Check if UID already exists
      const existing = await prisma.rFIDWhitelist.findUnique({
        where: { uid },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'UID already exists in whitelist',
        });
      }

      // Add to whitelist
      const entry = await prisma.rFIDWhitelist.create({
        data: { uid, description },
      });

      res.status(201).json({
        success: true,
        message: 'RFID UID added to whitelist',
        data: {
          id: entry.id,
          uid: entry.uid,
          description: entry.description,
          createdAt: entry.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error adding RFID to whitelist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add RFID to whitelist',
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/rfid/whitelist/:uid
   * Remove an RFID UID from the whitelist
   */
  router.delete('/whitelist/:uid', async (req, res) => {
    try {
      const { uid } = req.params;

      // Check if UID exists
      const existing = await prisma.rFIDWhitelist.findUnique({
        where: { uid },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'UID not found in whitelist',
        });
      }

      // Remove from whitelist
      await prisma.rFIDWhitelist.delete({
        where: { uid },
      });

      res.json({
        success: true,
        message: 'RFID UID removed from whitelist',
        data: { uid },
      });
    } catch (error) {
      console.error('Error removing RFID from whitelist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove RFID from whitelist',
        error: error.message,
      });
    }
  });

  return router;
}

export default createRFIDRouter;

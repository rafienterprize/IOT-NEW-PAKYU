import { useState, useCallback } from 'react';
import { sendCommand as apiSendCommand, sendWifiConfig as apiSendWifiConfig } from '../services/esp4Api';

interface CommandError {
  message: string;
  code?: string;
  timestamp: Date;
}

/**
 * useCommand
 *
 * Hook untuk mengirim command ke device (via ESP4) dan
 * mengirim konfigurasi WiFi ke ESP4.
 *
 * Semua request diteruskan melalui esp4Api service layer.
 */
export function useCommand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommandError | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  /**
   * Kirim command ke ESP target.
   * ESP4 meneruskan command ke ESP1/2/3 via UART.
   *
   * @param target   Nomor ESP tujuan (1 | 2 | 3)
   * @param command  String command, contoh: "LAMP:ON", "FEED", "DOOR:OPEN"
   */
  const sendCommand = useCallback(async (target: number, command: string) => {
    try {
      setLoading(true);
      setError(null);
      setLastCommand(`${command} → ESP${target}`);

      if (target < 1 || target > 3) {
        throw new Error('Target ESP tidak valid. Harus antara 1 dan 3.');
      }
      if (!command || command.trim().length === 0) {
        throw new Error('Command tidak boleh kosong.');
      }

      await apiSendCommand(target as 1 | 2 | 3, command);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (err as CommandError)?.message ?? 'Gagal mengirim command ke ESP4';

      const parsed: CommandError = { message, code: 'COMMAND_ERROR', timestamp: new Date() };
      setError(parsed);
      console.error('[useCommand] sendCommand:', message);
      throw parsed;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Kirim konfigurasi WiFi ke ESP4.
   * ESP4 meneruskan ke semua ESP atau ESP tertentu.
   *
   * @param ssid      SSID WiFi
   * @param password  Password WiFi (min 8 karakter)
   * @param target    Nomor ESP tujuan (opsional, jika kosong = broadcast semua)
   */
  const sendWiFiConfig = useCallback(async (ssid: string, password: string, target?: number) => {
    try {
      setLoading(true);
      setError(null);
      setLastCommand(`WiFi config → ${target ? `ESP${target}` : 'semua device'}`);

      if (!ssid || ssid.trim().length === 0) {
        throw new Error('SSID tidak boleh kosong.');
      }
      if (!password || password.length < 8) {
        throw new Error('Password WiFi minimal 8 karakter.');
      }
      if (target !== undefined && (target < 1 || target > 4)) {
        throw new Error('Target ESP tidak valid. Harus antara 1 dan 4.');
      }

      await apiSendWifiConfig(ssid, password, target);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (err as CommandError)?.message ?? 'Gagal mengirim konfigurasi WiFi';

      const parsed: CommandError = { message, code: 'WIFI_ERROR', timestamp: new Date() };
      setError(parsed);
      console.error('[useCommand] sendWiFiConfig:', message);
      throw parsed;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    sendCommand,
    sendWiFiConfig,
    loading,
    error,
    lastCommand,
    clearError,
  };
}

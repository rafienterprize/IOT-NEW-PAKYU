import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DeviceCard from './DeviceCard';

// Mock the StatusIndicator component
vi.mock('../ui/StatusIndicator', () => ({
  default: ({ isOnline, size }: { isOnline: boolean; size: string }) => (
    <div data-testid="status-indicator" data-online={isOnline} data-size={size}>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  ),
}));

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DeviceCard', () => {
  it('should render device information correctly', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={new Date().toISOString()}
        deviceType="Lamp, Gas Sensor, Fish Feeder"
      />
    );

    expect(screen.getByText('ESP32 #1')).toBeInTheDocument();
    expect(screen.getByText('Lamp, Gas Sensor, Fish Feeder')).toBeInTheDocument();
  });

  it('should display online status with green wifi icon', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={new Date().toISOString()}
        deviceType="Test Device"
      />
    );

    const statusIndicator = screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveAttribute('data-online', 'true');
    expect(statusIndicator).toHaveAttribute('data-size', 'sm');
  });

  it('should display offline status with gray wifi icon', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={2}
        status="offline"
        lastSeen={new Date(Date.now() - 10000).toISOString()}
        deviceType="Test Device"
      />
    );

    const statusIndicator = screen.getByTestId('status-indicator');
    expect(statusIndicator).toHaveAttribute('data-online', 'false');
  });

  it('should format last seen time correctly for seconds', () => {
    const lastSeen = new Date(Date.now() - 30000).toISOString(); // 30 seconds ago
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={lastSeen}
        deviceType="Test Device"
      />
    );

    expect(screen.getByText(/30s ago/)).toBeInTheDocument();
  });

  it('should format last seen time correctly for minutes', () => {
    const lastSeen = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={lastSeen}
        deviceType="Test Device"
      />
    );

    expect(screen.getByText(/2m ago/)).toBeInTheDocument();
  });

  it('should format last seen time correctly for hours', () => {
    const lastSeen = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={lastSeen}
        deviceType="Test Device"
      />
    );

    expect(screen.getByText(/2h ago/)).toBeInTheDocument();
  });

  it('should format last seen time correctly for days', () => {
    const lastSeen = new Date(Date.now() - 172800000).toISOString(); // 2 days ago
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={lastSeen}
        deviceType="Test Device"
      />
    );

    expect(screen.getByText(/2d ago/)).toBeInTheDocument();
  });

  it('should handle invalid timestamp gracefully', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen="invalid-date"
        deviceType="Test Device"
      />
    );

    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });

  it('should link to correct device detail page', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={3}
        status="online"
        lastSeen={new Date().toISOString()}
        deviceType="Door, Gate, RFID"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/esp3');
  });

  it('should render all ESP numbers correctly', () => {
    [1, 2, 3, 4].forEach((espNum) => {
      const { unmount } = renderWithRouter(
        <DeviceCard
          espNumber={espNum}
          status="online"
          lastSeen={new Date().toISOString()}
          deviceType="Test Device"
        />
      );

      expect(screen.getByText(`ESP32 #${espNum}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should apply hover styles via CSS classes', () => {
    renderWithRouter(
      <DeviceCard
        espNumber={1}
        status="online"
        lastSeen={new Date().toISOString()}
        deviceType="Test Device"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:border-gray-600');
    expect(link).toHaveClass('hover:bg-gray-750');
  });
});

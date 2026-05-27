import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusIndicator from './StatusIndicator';

describe('StatusIndicator', () => {
  it('should render online status with default label', () => {
    render(<StatusIndicator isOnline={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render offline status with default label', () => {
    render(<StatusIndicator isOnline={false} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render custom label when provided', () => {
    render(<StatusIndicator isOnline={true} label="Connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should apply online styling when isOnline is true', () => {
    const { container } = render(<StatusIndicator isOnline={true} />);
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-green-400');
    expect(badge?.className).toContain('border-green-600');
  });

  it('should apply offline styling when isOnline is false', () => {
    const { container } = render(<StatusIndicator isOnline={false} />);
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-gray-400');
    expect(badge?.className).toContain('border-gray-600');
  });

  it('should render with small size', () => {
    const { container } = render(<StatusIndicator isOnline={true} size="sm" />);
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-xs');
  });

  it('should render with medium size by default', () => {
    const { container } = render(<StatusIndicator isOnline={true} />);
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-sm');
  });

  it('should render with large size', () => {
    const { container } = render(<StatusIndicator isOnline={true} size="lg" />);
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-base');
  });
});

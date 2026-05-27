import { useState } from 'react';
import { type LucideIcon, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandButtonProps {
  label: string;
  command: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger';
  onSend: (command: string) => Promise<void>;
  requireConfirmation?: boolean;
}

export default function CommandButton({
  label,
  command,
  icon: Icon,
  variant = 'primary',
  onSend,
  requireConfirmation = false,
}: CommandButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const handleClick = () => {
    if (requireConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    handleSend();
  };

  const handleSend = async () => {
    setIsLoading(true);
    setFeedback(null);
    setShowConfirmation(false);

    try {
      await onSend(command);
      setFeedback('success');
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      setFeedback('error');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  // Show confirmation dialog
  if (showConfirmation) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-800 border border-yellow-500 rounded-lg">
        <p className="text-sm text-white">
          Are you sure you want to {label.toLowerCase()}?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSend}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || feedback !== null}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        feedback === 'success' && 'bg-green-600 hover:bg-green-600',
        feedback === 'error' && 'bg-red-600 hover:bg-red-600'
      )}
    >
      {/* Icon or loading spinner */}
      {isLoading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : feedback === 'success' ? (
        <Check size={18} />
      ) : feedback === 'error' ? (
        <X size={18} />
      ) : Icon ? (
        <Icon size={18} />
      ) : null}

      {/* Label */}
      <span>
        {isLoading
          ? 'Sending...'
          : feedback === 'success'
          ? 'Success!'
          : feedback === 'error'
          ? 'Failed'
          : label}
      </span>
    </button>
  );
}

'use client';

type Mode = 'edit' | 'browse' | 'run';

interface ModeSwitcherProps {
  currentMode: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeSwitcher({ currentMode, onChange }: ModeSwitcherProps) {
  const modes: { value: Mode; label: string; icon: string }[] = [
    { value: 'edit', label: 'Edit', icon: '✏️' },
    { value: 'browse', label: 'Browse', icon: '📖' },
    { value: 'run', label: 'Run', icon: '▶️' },
  ];

  return (
    <div className="flex gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`
            flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-all flex-1 sm:flex-initial
            ${currentMode === mode.value
              ? 'bg-white shadow-md text-blue-600 font-semibold'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <span className="text-base sm:text-lg">{mode.icon}</span>
          <span className="text-xs sm:text-base">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

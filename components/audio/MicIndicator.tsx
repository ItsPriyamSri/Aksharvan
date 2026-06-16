'use client';

type MicState = 'idle' | 'listening' | 'thinking' | 'result';

interface MicIndicatorProps {
  state: MicState;
  matched?: boolean | null;
}

export default function MicIndicator({ state, matched }: MicIndicatorProps) {
  if (state === 'idle') return null;

  const rings = state === 'listening' ? 'animate-ping' : '';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {state === 'listening' && (
          <div className={`absolute inset-0 rounded-full bg-firefly/30 ${rings}`} />
        )}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            state === 'listening'
              ? 'bg-firefly'
              : state === 'thinking'
                ? 'bg-magic'
                : matched === true
                  ? 'bg-success'
                  : 'bg-surface/30'
          }`}
        >
          {state === 'listening' && (
            <span className="text-2xl" role="img" aria-label="माइक्रोफोन">🎤</span>
          )}
          {state === 'thinking' && (
            <div className="w-5 h-5 border-2 border-white/70 rounded-full border-t-transparent animate-spin" />
          )}
          {state === 'result' && (
            <span className="text-white text-xl font-mukta font-bold">
              {matched === true ? '✓' : '✗'}
            </span>
          )}
        </div>
      </div>
      <p className="text-surface/70 font-mukta text-sm">
        {state === 'listening' && 'सुन रहा हूँ…'}
        {state === 'thinking' && 'सोच रहा हूँ…'}
        {state === 'result' && (matched === true ? 'शाबाश! ✨' : 'फिर से…')}
      </p>
    </div>
  );
}

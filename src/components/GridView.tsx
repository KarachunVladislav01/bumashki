import React from "react";

type MeetGridProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

function bestMeetCols(n: number, w: number, h: number) {
  if (n <= 0) return 1;

  let bestCols = 1;
  let bestScore = -Infinity;

  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const tileW = w / cols;
    const tileH = h / rows;
    const area = tileW * tileH;

    const ratio = tileW / tileH;
    const ratioPenalty = Math.abs(Math.log(ratio)); // 0 when square-ish

    const score = area - ratioPenalty * area * 0.25;
    if (score > bestScore) {
      bestScore = score;
      bestCols = cols;
    }
  }

  return bestCols;
}

function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ w: cr.width, h: cr.height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function GridList<T>({
  items,
  renderItem,
  className = "",
}: MeetGridProps<T>) {
  const { ref, size } = useElementSize<HTMLDivElement>();

  const n = items.length;
  const w = Math.max(1, size.w);
  const h = Math.max(1, size.h);

  const cols = React.useMemo(() => bestMeetCols(n, w, h), [n, w, h]);
  const rows = Math.max(1, Math.ceil(n / cols));

  const tileW = w / cols;

  const rowsArr = React.useMemo(() => {
    const res: Array<Array<{ item: T; idx: number }>> = [];
    for (let r = 0; r < rows; r++) {
      const start = r * cols;
      const end = Math.min(start + cols, n);
      const row: Array<{ item: T; idx: number }> = [];
      for (let i = start; i < end; i++) row.push({ item: items[i], idx: i });
      res.push(row);
    }
    return res;
  }, [items, n, cols, rows]);

  return (
    <div className={`min-h-screen w-full bg-white ${className}`}>
      <div className="mobileLandscapeBlocker fixed inset-0 z-50 hidden items-center justify-center bg-white p-6 text-center">
        <div className="max-w-sm">
          <div className="text-lg font-semibold">Rotate your phone to portrait mode</div>
          <div className="mt-2 text-sm text-neutral-600">
            This screen only works in portrait mode.
          </div>
        </div>
      </div>

      <div ref={ref} className="flex h-screen w-full flex-col bg-white divide-y divide-neutral-200">
        {rowsArr.map((row, r) => {
          const isFullRow = row.length === cols;

          if (isFullRow) {
            return (
              <div key={r} className="flex flex-1 w-full divide-x divide-neutral-200">
                {row.map(({ item, idx }) => (
                  <div
                    key={idx}
                    className="bg-white min-w-0 min-h-0 flex items-center justify-center"
                    style={{ width: tileW }}
                  >
                    {renderItem(item, idx)}
                  </div>
                ))}
              </div>
            );
          }

          const groupW = tileW * row.length;

          return (
            <div key={r} className="flex flex-1 w-full justify-center">
              <div
                className="h-full bg-white border-l border-r border-neutral-200 divide-x divide-neutral-200 flex"
                style={{ width: groupW }}
              >
                {row.map(({ item, idx }) => (
                  <div
                    key={idx}
                    className="bg-white min-w-0 min-h-0 flex items-center justify-center"
                    style={{ width: tileW }}
                  >
                    {renderItem(item, idx)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 767px) and (orientation: landscape) {
          .mobileLandscapeBlocker { display: flex; }
        }
      `}</style>
    </div>
  );
}

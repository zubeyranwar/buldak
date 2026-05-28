"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FC,
  type RefObject,
} from "react";

// ─── Layout constants ─────────────────────────────────────────────────────────

const ITEM_HEIGHT = 42;
const VISIBLE_ROWS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ROWS / 2);
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

/**
 * Drag sensitivity — lower = slower / more precise.
 * 1.0 = original speed, 0.5 = half speed (recommended for mobile).
 */
const DRAG_SENSITIVITY = 0.5;

// ─── Data builders ────────────────────────────────────────────────────────────

function buildDates(count = 60): string[] {
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const MO = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ] as const;

  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (i === 0) return "Today";
    if (i === 1) return "Tomorrow";
    return `${WD[d.getDay()]}, ${d.getDate()} ${MO[d.getMonth()]}`;
  });
}

function buildTimes(): string[] {
  const slots: string[] = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const ampm = h < 12 ? "AM" : "PM";
      const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
      slots.push(`${hh}:${String(m).padStart(2, "0")} ${ampm}`);
    }
  }
  return slots;
}

export const DATES: string[] = buildDates();
export const TIMES: string[] = buildTimes();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, n));
}

function useNonPassiveWheel(
  ref: RefObject<HTMLDivElement | null>,
  handler: (e: WheelEvent) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const listener = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handlerRef.current(e);
    };

    el.addEventListener("wheel", listener, { passive: false });
    return () => el.removeEventListener("wheel", listener);
  }, [ref]);
}

// ─── WheelColumn ──────────────────────────────────────────────────────────────

type TextAlign = "left" | "center" | "right";

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number, value: string) => void;
  align?: TextAlign;
  minWidth?: number;
}

const WheelColumn: FC<WheelColumnProps> = ({
  items,
  selectedIndex,
  onChange,
  align = "center",
  minWidth = 80,
}) => {
  const [cur, setCur] = useState<number>(selectedIndex);

  const colRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startIdx = useRef(selectedIndex);
  const velY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);

  useEffect(() => {
    if (selectedIndex !== Math.round(cur)) {
      setCur(selectedIndex);
      startIdx.current = selectedIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const snapTo = useCallback(
    (rawIdx: number, animate = true) => {
      const snapped = clamp(Math.round(rawIdx), items.length - 1);
      startIdx.current = snapped;
      setCur(snapped);
      if (animate) onChange(snapped, items[snapped]);
    },
    [items, onChange]
  );

  // ── Pointer events ────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startY.current = e.clientY;
    startIdx.current = Math.round(cur);
    velY.current = 0;
    lastY.current = e.clientY;
    lastT.current = e.timeStamp;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const dy = e.clientY - lastY.current;
    const dt = e.timeStamp - lastT.current || 1;
    velY.current = dy / dt;
    lastY.current = e.clientY;
    lastT.current = e.timeStamp;

    const delta = ((e.clientY - startY.current) / ITEM_HEIGHT) * DRAG_SENSITIVITY;
    setCur(clamp(startIdx.current - delta, items.length - 1));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;

    const delta = ((e.clientY - startY.current) / ITEM_HEIGHT) * DRAG_SENSITIVITY;
    const momentumSteps = (-velY.current * 40) / ITEM_HEIGHT;
    const target = startIdx.current - delta + momentumSteps;
    snapTo(target);
  };

  const onPointerCancel = () => {
    isDragging.current = false;
    snapTo(startIdx.current);
  };

  // ── Non-passive wheel ─────────────────────────────────────────────────────
  useNonPassiveWheel(colRef, (e: WheelEvent) => {
    const next = clamp(startIdx.current + Math.sign(e.deltaY), items.length - 1);
    startIdx.current = next;
    setCur(next);
    onChange(next, items[next]);
  });

  // ── Derived values ────────────────────────────────────────────────────────

  const trackY = (CENTER_OFFSET - cur) * ITEM_HEIGHT;

  const distanceFrom = (i: number) => Math.abs(i - Math.round(cur));

  const itemOpacity = (dist: number) =>
    dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.25 : 0.1;

  const justifyMap: Record<TextAlign, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={colRef}
      style={{
        flex: 1,
        minWidth,
        height: PICKER_HEIGHT,
        overflow: "hidden",
        position: "relative",
        cursor: "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* Highlight band */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          top: CENTER_OFFSET * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
          background: "var(--color-background-secondary)",
          borderTop: "0.5px solid var(--color-border-secondary)",
          borderBottom: "0.5px solid var(--color-border-secondary)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Top fade */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: CENTER_OFFSET * ITEM_HEIGHT,
          background:
            "linear-gradient(to bottom, var(--color-background-primary) 10%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Bottom fade */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: CENTER_OFFSET * ITEM_HEIGHT,
          background:
            "linear-gradient(to top, var(--color-background-primary) 10%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Scrolling track */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: `translateY(${trackY}px)`,
          transition: isDragging.current
            ? "none"
            : "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {items.map((label, i) => {
          const dist = distanceFrom(i);
          return (
            <div
              key={i}
              style={{
                height: ITEM_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: justifyMap[align],
                paddingLeft: align === "left" ? 16 : 0,
                paddingRight: align === "right" ? 20 : 0,
                fontSize: dist === 0 ? 16 : 14,
                fontWeight: dist === 0 ? 500 : 400,
                color:
                  dist === 0
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                opacity: itemOpacity(dist),
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── DateTimePicker ───────────────────────────────────────────────────────────

export interface DateTimeValue {
  date: string;
  time: string;
}

interface DateTimePickerProps {
  onChange?: (value: DateTimeValue) => void;
  defaultDate?: string;
  defaultTime?: string;
}

export const DateTimePicker: FC<DateTimePickerProps> = ({
  onChange,
  defaultDate = "Today",
  defaultTime = "7:00 PM",
}) => {
  const initialDateIdx = Math.max(0, DATES.indexOf(defaultDate));
  const initialTimeIdx = Math.max(0, TIMES.indexOf(defaultTime));

  const [dateIdx, setDateIdx] = useState(initialDateIdx);
  const [timeIdx, setTimeIdx] = useState(initialTimeIdx);

  useEffect(() => {
    onChange?.({ date: DATES[dateIdx], time: TIMES[timeIdx] });
  }, [dateIdx, timeIdx, onChange]);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <WheelColumn
        items={DATES}
        selectedIndex={dateIdx}
        onChange={(i) => setDateIdx(i)}
        align="right"
        minWidth={120}
      />

      <div
        aria-hidden
        style={{
          width: "0.5px",
          flexShrink: 0,
          background: "var(--color-border-tertiary)",
        }}
      />

      <WheelColumn
        items={TIMES}
        selectedIndex={timeIdx}
        onChange={(i) => setTimeIdx(i)}
        align="left"
        minWidth={90}
      />
    </div>
  );
};

// ─── PartySizePicker ──────────────────────────────────────────────────────────

interface PartySizePickerProps {
  max?: number;
  value?: number;
  onChange?: (guests: number) => void;
}

export const PartySizePicker: FC<PartySizePickerProps> = ({
  max = 8,
  value = 2,
  onChange,
}) => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
      const isSelected = n === value;
      return (
        <button
          key={n}
          type="button"
          aria-label={`${n} guest${n > 1 ? "s" : ""}`}
          aria-pressed={isSelected}
          onClick={() => onChange?.(n)}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: isSelected
              ? "2px solid #D0534A"
              : "1.5px solid var(--color-border-secondary)",
            background: "transparent",
            color: isSelected ? "#D0534A" : "var(--color-text-primary)",
            fontSize: 15,
            fontWeight: isSelected ? 500 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.15s, color 0.15s",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          {n}
        </button>
      );
    })}
  </div>
);
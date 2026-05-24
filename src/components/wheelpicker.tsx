"use client";

/**
 * WheelPicker.tsx
 *
 * Provides three components that together recreate the iOS-style
 * drum-roll reservation UI:
 *
 *   • WheelColumn   – generic, reusable spinning-wheel column
 *   • DateTimePicker – two-column wheel (date | time, 30-min slots)
 *   • PartySizePicker – row of circular number bubbles
 *
 * Behaviours implemented
 * ──────────────────────
 * - Drag (mouse + touch via Pointer Events API)
 * - Momentum on release – velocity at lift-off continues the scroll
 * - Mouse-wheel / trackpad scrolling
 * - SCROLL LOCK: while the pointer is inside a WheelColumn OR the wheel
 *   event fires inside it, the outer page scroll is blocked.  This is
 *   done by attaching a non-passive "wheel" listener directly to the
 *   DOM node (React's synthetic onWheel is passive by default in some
 *   bundler configs and cannot call preventDefault reliably).
 * - Snap to nearest item on every interaction end
 * - Controlled via selectedIndex prop; internal state kept in sync
 *
 * Responsiveness
 * ──────────────
 * The picker fills 100% of its container width.  Minimum widths are
 * enforced on each column so text never wraps on small phones.
 * ITEM_HEIGHT is declared as a CSS-style constant so tweaking one
 * value reflows the whole component.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FC,
  type RefObject,
} from "react";

// ─── Layout constant ──────────────────────────────────────────────────────────
/**
 * Height of a single row in pixels.
 * Change this one value to resize the whole wheel uniformly.
 */
const ITEM_HEIGHT = 42;

/**
 * How many rows are visible at once (must be odd so there is a clear
 * centre row).  The selected item sits in row index CENTER_OFFSET.
 */
const VISIBLE_ROWS = 5;
const CENTER_OFFSET = Math.floor(VISIBLE_ROWS / 2); // 2
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;   // 210 px

// ─── Data builders ────────────────────────────────────────────────────────────

/** Returns an array of human-readable date strings starting from today. */
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

/**
 * Returns half-hour time slots from 6:00 AM → 11:30 PM.
 * Format: "7:00 PM"
 */
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

/** Exported so callers can display / convert the selected index. */
export const DATES: string[] = buildDates();
export const TIMES: string[] = buildTimes();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clamp n so it stays within [0, max]. */
function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, n));
}

/**
 * Attach a DOM-level (non-passive) wheel listener to ref.current.
 * Returns a cleanup function.  We do this instead of React's onWheel
 * because React marks its synthetic wheel events as passive, which
 * means calling preventDefault() inside them has no effect and the
 * page still scrolls behind the picker.
 */
function useNonPassiveWheel(
  ref: RefObject<HTMLDivElement | null>,
  handler: (e: WheelEvent) => void
) {
  // Keep the handler in a ref so the effect doesn't need to re-run
  // when the handler closure changes.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const listener = (e: WheelEvent) => {
      e.preventDefault(); // ← blocks page scroll
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
  /** Full list of string options to scroll through. */
  items: string[];
  /** Controlled selected index (0-based). */
  selectedIndex: number;
  /** Called with (newIndex, newValue) whenever the selection changes. */
  onChange: (index: number, value: string) => void;
  /**
   * Text alignment inside each cell.
   * Use "right" for the date column and "left" for the time column
   * so they read naturally across the divider line.
   */
  align?: TextAlign;
  /** Minimum column width in px – prevents text wrapping on small screens. */
  minWidth?: number;
}

const WheelColumn: FC<WheelColumnProps> = ({
  items,
  selectedIndex,
  onChange,
  align = "center",
  minWidth = 80,
}) => {
  // `cur` drives rendering; it may be fractional during a drag so the
  // track appears to move continuously.
  const [cur, setCur] = useState<number>(selectedIndex);

  // Mutable refs that don't need to trigger re-renders.
  const colRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);       // pointer Y at drag start
  const startIdx = useRef(selectedIndex); // index at drag start
  const velY = useRef(0);         // drag velocity (px/ms) at last move
  const lastY = useRef(0);
  const lastT = useRef(0);

  // Keep `startIdx` in sync when the column is controlled externally.
  useEffect(() => {
    if (selectedIndex !== Math.round(cur)) {
      setCur(selectedIndex);
      startIdx.current = selectedIndex;
    }
    // Intentionally only re-sync when the prop changes, not when `cur`
    // changes from internal drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  /** Snap cur to the nearest integer, call onChange, persist startIdx. */
  const snapTo = useCallback(
    (rawIdx: number, animate = true) => {
      const snapped = clamp(Math.round(rawIdx), items.length - 1);
      startIdx.current = snapped;
      setCur(snapped);
      if (animate) onChange(snapped, items[snapped]);
    },
    [items, onChange]
  );

  // ── Pointer events (drag) ──────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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

    // Track velocity so we can add momentum on release.
    const dy = e.clientY - lastY.current;
    const dt = e.timeStamp - lastT.current || 1;
    velY.current = dy / dt;
    lastY.current = e.clientY;
    lastT.current = e.timeStamp;

    // Update cur continuously (fractional) for smooth visual feedback.
    const delta = (e.clientY - startY.current) / ITEM_HEIGHT;
    setCur(clamp(startIdx.current - delta, items.length - 1));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;

    // Compute where the list should land after coasting.
    const delta = (e.clientY - startY.current) / ITEM_HEIGHT;
    const momentumSteps = (-velY.current * 80) / ITEM_HEIGHT;
    const target = startIdx.current - delta + momentumSteps;
    snapTo(target);
  };

  const onPointerCancel = () => {
    isDragging.current = false;
    snapTo(startIdx.current);
  };

  // ── Non-passive wheel (scroll lock) ───────────────────────────────────────
  useNonPassiveWheel(colRef, (e: WheelEvent) => {
    const next = clamp(startIdx.current + Math.sign(e.deltaY), items.length - 1);
    startIdx.current = next;
    setCur(next);
    onChange(next, items[next]);
  });

  // ── Derived values ─────────────────────────────────────────────────────────

  /** translateY that positions item[cur] in the selection band. */
  const trackY = (CENTER_OFFSET - cur) * ITEM_HEIGHT;

  /**
   * Per-item distance from the selected row.  Used to fade and
   * de-emphasise rows as they move away from centre.
   */
  const distanceFrom = (i: number) => Math.abs(i - Math.round(cur));

  const itemOpacity = (dist: number) =>
    dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.25 : 0.1;

  const justifyMap: Record<TextAlign, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* ── Highlight band ── */}
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

      {/* ── Top fade ── */}
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

      {/* ── Bottom fade ── */}
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

      {/* ── Scrolling track ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          // Snap transition only when not mid-drag.
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
  date: string; // e.g. "Today" | "Tomorrow" | "Mon, 12 May"
  time: string; // e.g. "7:00 PM"
}

interface DateTimePickerProps {
  /** Called whenever either column changes. */
  onChange?: (value: DateTimeValue) => void;
  /** Initial date string (must match an entry in DATES). Defaults to "Today". */
  defaultDate?: string;
  /** Initial time string (must match an entry in TIMES). Defaults to "7:00 PM". */
  defaultTime?: string;
}

/**
 * DateTimePicker
 *
 * Two-column wheel picker: date on the left, time on the right.
 * Times are spaced in 30-minute increments (6:00 AM – 11:30 PM).
 * Fires onChange with { date, time } whenever either column moves.
 */
export const DateTimePicker: FC<DateTimePickerProps> = ({
  onChange,
  defaultDate = "Today",
  defaultTime = "7:00 PM",
}) => {
  const initialDateIdx = Math.max(0, DATES.indexOf(defaultDate));
  const initialTimeIdx = Math.max(0, TIMES.indexOf(defaultTime));

  const [dateIdx, setDateIdx] = useState(initialDateIdx);
  const [timeIdx, setTimeIdx] = useState(initialTimeIdx);

  // Notify parent whenever selection changes.
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
      {/* Date column – right-aligned so it reads close to the divider */}
      <WheelColumn
        items={DATES}
        selectedIndex={dateIdx}
        onChange={(i) => setDateIdx(i)}
        align="right"
        minWidth={120}
      />

      {/* Visual divider */}
      <div
        aria-hidden
        style={{
          width: "0.5px",
          flexShrink: 0,
          background: "var(--color-border-tertiary)",
        }}
      />

      {/* Time column – left-aligned */}
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
  /** Highest number to show. Defaults to 8. */
  max?: number;
  /** Currently selected guest count. */
  value?: number;
  /** Called when the user taps a different number. */
  onChange?: (guests: number) => void;
}

/**
 * PartySizePicker
 *
 * A horizontally scrollable row of circular number buttons.
 * The selected number gets a red outline matching the app's brand colour.
 * Wraps naturally on very narrow screens.
 */
export const PartySizePicker: FC<PartySizePickerProps> = ({
  max = 8,
  value = 2,
  onChange,
}) => (
  <div
    style={{
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    }}
  >
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
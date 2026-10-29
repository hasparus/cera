import { useEffect, useReducer, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";

export interface RhythmLabels {
  retinol: string;
  acid: string;
  cream: string;
  day: string;
  morning: string;
  evening: string;
  tapHint: string;
  weekdays: string;
}

interface Props {
  labels: RhythmLabels;
}

const DAYS = 14;

const ROWS = [
  {
    key: "retinol" as const,
    product: "Paula's Choice Clinical 0.3% Retinol",
    on: new Set([0, 3, 7, 10]),
    time: "evening" as const,
  },
  {
    key: "acid" as const,
    product: "The Ordinary Mandelic Acid 10% + HA",
    on: new Set([1, 4, 7, 10, 13]),
    time: "evening" as const,
  },
  {
    key: "cream" as const,
    product: "La Roche-Posay Toleriane Sensitive",
    on: new Set(Array.from({ length: DAYS }, (_, i) => i)),
    time: "both" as const,
  },
];

const pickDay = (_: number | null, day: number | null) => day;

export default function RhythmPlayground({ labels }: Props) {
  const [hotCol, setHotCol] = useReducer(pickDay, null);
  const [openDay, setOpenDay] = useReducer(pickDay, null);
  const gridRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const openedByHover = useRef(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const springConfig = reducedMotion
    ? { stiffness: 4000, damping: 300 }
    : { stiffness: 380, damping: 36 };
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDay(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const weekdays = labels.weekdays.split(" ");

  const trackPointer = (e: React.PointerEvent) => {
    const grid = gridRef.current;
    const wrap = wrapRef.current;
    if (!grid || !wrap) return;
    const rect = grid.getBoundingClientRect();
    const labelOffset = rect.width > 520 ? 176 : 0;
    const x = e.clientX - rect.left - labelOffset;
    const col = Math.min(
      DAYS - 1,
      Math.max(0, Math.floor((x / (rect.width - labelOffset)) * DAYS)),
    );
    const wrapRect = wrap.getBoundingClientRect();
    rawX.set(e.clientX - wrapRect.left + 18);
    rawY.set(e.clientY - wrapRect.top - 10);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setHotCol(col);
      if (openedByHover.current) setOpenDay(col);
    });
  };

  const toggleDay = (day: number, e: React.MouseEvent) => {
    if (openDay === day && openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.getBoundingClientRect();
    const b = e.currentTarget.getBoundingClientRect();
    const x = b.right - w.left + 14;
    const y = b.top - w.top - 10;
    if (openDay === null) {
      rawX.jump(x);
      rawY.jump(y);
    } else {
      rawX.set(x);
      rawY.set(y);
    }
    setOpenDay(openDay === day ? null : day);
  };

  const hoverDay = (e: React.PointerEvent, day: number) => {
    if (e.pointerType !== "mouse") return;
    if (openDay === null) {
      const wrap = wrapRef.current;
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        rawX.jump(e.clientX - r.left + 18);
        rawY.jump(e.clientY - r.top - 10);
      }
    }
    openedByHover.current = true;
    setOpenDay(day);
  };

  const morningItems = (day: number) =>
    ROWS.filter((r) => r.on.has(day) && r.time === "both").map(
      (r) => r.product,
    );
  const eveningItems = (day: number) =>
    ROWS.filter(
      (r) => r.on.has(day) && (r.time === "both" || r.time === "evening"),
    ).map((r) => r.product);

  return (
    <div ref={wrapRef} className="relative mt-18 max-w-2xl">
      <AnimatePresence>
        {openDay !== null && (
          <motion.div
            key="ritual-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            style={{ x: springX, y: springY }}
            className="pointer-events-none absolute top-0 left-0 z-10 w-64 -translate-y-full rounded-xl bg-day-surface p-4 text-sm text-day-ink ring-1 ring-black/5 shadow-[0_4px_12px_-4px_oklch(0_0_0/0.35)]"
            role="region"
            aria-label={`${labels.day} ${openDay + 1}`}
          >
            <p className="text-xs font-semibold tracking-[0.06em] text-day-subtle uppercase">
              {labels.day} {openDay + 1}
            </p>
            <div className="mt-3 grid gap-2.5">
              <div className="flex gap-2.5">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mt-0.5 shrink-0 text-[oklch(0.68_0.13_70)]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                </svg>
                <span className="sr-only">{labels.morning}:</span>
                <ul className="grid gap-1">
                  {(morningItems(openDay).length
                    ? morningItems(openDay)
                    : ["—"]
                  ).map((item) => (
                    <li key={item} className="text-[13px] leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2.5">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-[oklch(0.5_0.09_330)]"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
                <span className="sr-only">{labels.evening}:</span>
                <ul className="grid gap-1">
                  {(eveningItems(openDay).length
                    ? eveningItems(openDay)
                    : ["—"]
                  ).map((item) => (
                    <li key={item} className="text-[13px] leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={gridRef}
        onPointerMove={trackPointer}
        onPointerLeave={() => {
          setHotCol(null);
          if (openedByHover.current) {
            openedByHover.current = false;
            setOpenDay(null);
          }
        }}
        className="grid gap-6"
      >
        <div
          className="grid grid-cols-[10rem_1fr] items-center gap-4 max-[560px]:grid-cols-1 max-[560px]:gap-2"
          aria-hidden="true"
        >
          <span className="max-[560px]:hidden" />
          <span className="flex justify-between gap-1">
            {Array.from({ length: DAYS }, (_, day) => (
              <span
                key={day}
                className="w-[clamp(0.7rem,1.9vw,1.05rem)] text-center text-[10px] leading-none text-dusk-subtle"
              >
                {weekdays[day % 7]}
              </span>
            ))}
          </span>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[10rem_1fr] items-center gap-4 max-[560px]:grid-cols-1 max-[560px]:gap-2"
          >
            <span className="text-sm leading-tight">
              <span className="font-medium text-dusk-ink">
                {labels[row.key]}
              </span>
              <span className="block text-xs text-dusk-subtle">
                {row.product}
              </span>
            </span>
            <span className="flex justify-between gap-1">
              {Array.from({ length: DAYS }, (_, day) => {
                const dist = hotCol === null ? 99 : Math.abs(day - hotCol);
                const boost = Math.max(0, 1 - dist / 3);
                const on = row.on.has(day);
                return (
                  <button
                    key={day}
                    type="button"
                    tabIndex={row.key === "cream" ? 0 : -1}
                    aria-label={
                      row.key === "cream"
                        ? `${labels.day} ${day + 1}`
                        : undefined
                    }
                    aria-expanded={
                      row.key === "cream" ? openDay === day : undefined
                    }
                    onClick={(e) => toggleDay(day, e)}
                    onPointerEnter={(e) => hoverDay(e, day)}
                    className={`relative aspect-square w-[clamp(0.7rem,1.9vw,1.05rem)] cursor-pointer rounded-full transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] after:absolute after:-inset-2.5 after:content-[''] ${
                      on ? "bg-night-accent" : "bg-white/13"
                    }`}
                    style={{
                      transform: `scale(${1 + boost * 0.45})`,
                      transitionDelay: `${dist <= 3 ? dist * 28 : 0}ms`,
                      boxShadow:
                        on && boost > 0
                          ? `0 0 ${10 * boost}px oklch(0.72 0.14 14 / ${0.5 * boost})`
                          : "none",
                    }}
                  />
                );
              })}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-dusk-subtle">{labels.tapHint}</p>
    </div>
  );
}

import { useRef, useState } from "react";

export default function useStabilizedAction(delayMs = 600) {
  const [tick, setTick] = useState(0);
  const tRef = useRef(null);
  const trigger = () => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setTick(v => v + 1), delayMs);
  };
  return { tick, trigger };
}

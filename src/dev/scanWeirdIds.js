/*
import { explainCodepoints } from "../utils/ids";

export function scanWeirdIds(matchSkills) {
  let issues = 0;
  matchSkills.forEach((s) => {
    const ids = [
      s.target1, s.target2, s.target3, s.target4, s.target5,
      s.activator1, s.activator2, s.activator3, s.activator4, s.activator5,
    ].filter(Boolean);
    ids.forEach((id) => {
      const points = explainCodepoints(id);
      const hasWeird = points.some((p) =>
        /^(U\+00A0|U\+200[0-DF]|U\+202F|U\+205F|U\+3000|U\+FE0E|U\+FE0F|U\+FEFF)$/.test(p.cp)
      );
      if (hasWeird) {
        issues++;
        console.warn(`[WeirdID] ${s.name}:`, id, points);
      }
    });
  });
  if (issues === 0) {
    console.info("WeirdID scan: no issues detected.");
  } else {
    console.info(`WeirdID scan: ${issues} potential issues found.`);
  }
}
*/
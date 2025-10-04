// src/utils/profile.js

// utils(=src/utils) から data(=src/data) へは 1 つ上の階層
import profiles from "../data/characterProfiles.js";

export function formatBirthdayFromSerial(serialStr) {
  const n = Number(serialStr);
  if (!Number.isFinite(n) || n <= 0) return "";
  const base = new Date(Date.UTC(1899, 11, 30));
  const d = new Date(base.getTime() + n * 86400000);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${month}月${day}日`;
}
export function rootIdOf(versionId) {
  return String(versionId).split("-")[0];
}
export function getProfileByRootId(rootId) {
  const hit = profiles.find(p => rootIdOf(p.char_id) === rootId);
  if (!hit) return null;
  return {
    rootId,
    name: hit.base_name || "",
    nameEn: hit.base_name_alphabet || "",
    cv: hit.character_cv || "",
    birthdayText: formatBirthdayFromSerial(hit.birthday),
    height: hit.height || "",
    intro: hit.introduction || ""
  };
}

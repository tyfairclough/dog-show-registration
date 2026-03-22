/**
 * One-off: parse scripts/kc-breeds-page.html (download from KC A–Z) and print stats.
 * Run: node scripts/extract-kc-breeds.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "kc-breeds-page.html");
const html = fs.readFileSync(htmlPath, "utf8");
const re = /<strong class="m-breed-card__title">([^<]+)<\/strong>/g;
const breeds = [];
let m;
function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

while ((m = re.exec(html)) !== null) {
  breeds.push(decodeHtmlEntities(m[1].trim()));
}
const unique = [...new Set(breeds)];
unique.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

const outPath = path.join(__dirname, "..", "lib", "kennelClubBreeds.ts");
const lines = unique.map((b) => `  ${JSON.stringify(b)}`).join(",\n");
const file = `/**
 * Recognised pedigree breeds from The Royal Kennel Club (UK) Breeds A–Z.
 * Source page (downloaded for extraction): https://www.thekennelclub.org.uk/search/breeds-a-to-z/
 * Regenerate: save that page HTML as scripts/kc-breeds-page.html, then run node scripts/extract-kc-breeds.mjs
 */
export const KENNEL_CLUB_BREEDS: readonly string[] = [
${lines},
];

/** Full dropdown list: KC breeds, then non-pedigree options. */
export const DOG_BREED_OPTIONS: readonly string[] = [
  ...KENNEL_CLUB_BREEDS,
  "Mixed breed",
  "Other",
];
`;
fs.writeFileSync(outPath, file, "utf8");
console.log("wrote", outPath, "breeds", unique.length);

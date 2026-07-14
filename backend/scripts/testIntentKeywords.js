import { hasIntentSignal } from "../src/config/intentKeywords.js";

const cases = [
  ["C'est combien le sac ?", true],
  ["Vous avez ça en dispo ?", true],
  ["Le prix svp", true],
  ["Ça coûte combien la livraison ?", true],
  ["Je veux commander 2", true],
  ["Merci beaucoup, bonne journée", false],
  ["Ok je regarde", false],
  ["Vous êtes disponible demain ?", true], // accepted false positive — "disponible" also flags scheduling questions
];

let failures = 0;
for (const [text, expected] of cases) {
  const got = hasIntentSignal(text);
  const ok = got === expected;
  if (!ok) failures++;
  console.log(`${ok ? "OK" : "FAIL"}  "${text}" -> ${got} (attendu ${expected})`);
}

console.log(failures === 0 ? "\nTous les cas passent." : `\n${failures} cas en échec.`);

import { computeLeadScore } from "../src/services/leadScoring.js";

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(now - n * DAY_MS);

const hot = {
  contact: { lastMessageAt: daysAgo(0) },
  messages: [
    { direction: "inbound", timestamp: daysAgo(0), hasIntentSignal: true },
    { direction: "inbound", timestamp: daysAgo(2), hasIntentSignal: false },
    { direction: "inbound", timestamp: daysAgo(5), hasIntentSignal: false },
    { direction: "outbound", timestamp: daysAgo(1), hasIntentSignal: false },
  ],
};

const lukewarm = {
  contact: { lastMessageAt: daysAgo(4) },
  messages: [
    { direction: "inbound", timestamp: daysAgo(4), hasIntentSignal: false },
    { direction: "outbound", timestamp: daysAgo(3), hasIntentSignal: false },
  ],
};

const cold = {
  contact: { lastMessageAt: daysAgo(25) },
  messages: [{ direction: "inbound", timestamp: daysAgo(25), hasIntentSignal: false }],
};

const results = [
  ["hot", hot, "chaud"],
  ["lukewarm", lukewarm, ["tiede", "froid"]], // either is acceptable, just must rank below hot
  ["cold", cold, "froid"],
];

let failures = 0;
const scored = results.map(([name, { contact, messages }, expected]) => {
  const { score, label } = computeLeadScore(contact, messages);
  const expectedList = Array.isArray(expected) ? expected : [expected];
  const ok = expectedList.includes(label);
  if (!ok) failures++;
  console.log(`${ok ? "OK" : "FAIL"}  ${name} -> score=${score} label=${label} (attendu ${expectedList.join(" ou ")})`);
  return { name, score };
});

const ordered = [...scored].sort((a, b) => b.score - a.score).map((s) => s.name);
const orderOk = ordered[0] === "hot" && ordered[2] === "cold";
console.log(`${orderOk ? "OK" : "FAIL"}  ordre attendu hot > lukewarm > cold, obtenu: ${ordered.join(" > ")}`);
if (!orderOk) failures++;

console.log(failures === 0 ? "\nTous les cas passent." : `\n${failures} cas en échec.`);

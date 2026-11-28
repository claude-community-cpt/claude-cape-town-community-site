#!/usr/bin/env node
// Looks over the event files in src/content/events/ and reports:
//   - upcoming events that are missing something the site needs
//   - events that have ended and still carry "upcoming only" fields
//
//   node .claude/skills/add-event/check-events.mjs
//
// It changes nothing. It exits with 1 if anything needs attention.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "content", "events");
const now = new Date();

/** A top-level field's value, or a field nested one level down ("venue.name"). */
function field(front, path) {
  const [top, sub] = path.split(".");
  const clean = (v) => v.replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
  if (!sub) {
    const m = front.match(new RegExp(`^${top}:[ \\t]*(\\S.*)$`, "m"));
    return m ? clean(m[1]) : undefined;
  }
  const block = front.match(new RegExp(`^${top}:[ \\t]*\\n((?:[ \\t]+.*\\n?)+)`, "m"));
  const m = block?.[1].match(new RegExp(`^[ \\t]+${sub}:[ \\t]*(\\S.*)$`, "m"));
  return m ? clean(m[1]) : undefined;
}

/** Same rule as endOf() in src/lib.ts: the end, or midnight in Cape Town after the start. */
function endOf(start, end) {
  if (end) return new Date(end);
  const midnight = new Date(start);
  midnight.setUTCHours(21, 59, 59);
  return midnight;
}

const upcoming = [];
const past = [];
const problems = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  const text = readFileSync(join(dir, file), "utf8");
  const parts = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!parts) {
    problems.push(`${file}: no top section between --- lines`);
    continue;
  }
  const [, front, body] = parts;
  const say = (msg) => problems.push(`${file}: ${msg}`);
  const start = field(front, "start");
  const end = field(front, "end");

  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(file)) say("file name should be YYYY-MM-DD-short-name.md, lower case with hyphens");
  if (!start || Number.isNaN(new Date(start).getTime())) {
    say("start is missing or is not a date");
    continue;
  }
  for (const [name, value] of [["start", start], ["end", end]]) {
    if (value && !value.endsWith("+02:00")) say(`${name} should end with +02:00 (Cape Town time)`);
  }
  if (!file.startsWith(start.slice(0, 10))) say(`file name date does not match start (${start.slice(0, 10)})`);
  if (end && new Date(end) <= new Date(start)) say("end is not after start");
  if (field(front, "draft") === "true") continue;

  if (endOf(start, end) >= now) {
    upcoming.push(file);
    if (!field(front, "luma.url")) say("upcoming event has no Luma link (luma.url)");
    if (!field(front, "summary")) say("upcoming event has no summary");
    if (!field(front, "venue.name")) say("upcoming event has no venue name");
    if (!body.trim()) say("upcoming event has no description under the second ---");
  } else {
    past.push(file);
    if (field(front, "status")) say(`event has ended; remove status ("${field(front, "status")}")`);
    if (field(front, "luma.label")) say(`event has ended; remove luma.label ("${field(front, "luma.label")}")`);
  }
}

console.log(`Upcoming (${upcoming.length}): ${upcoming.join(", ") || "none"}`);
console.log(`Past (${past.length}): ${past.join(", ") || "none"}`);
if (problems.length) {
  console.log(`\nNeeds attention:\n${problems.map((p) => `- ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("\nNothing needs attention.");

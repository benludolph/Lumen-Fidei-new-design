/**
 * split_narrator_audio.js
 *
 * Splits a narrator audio file into per-message clips based on a chat flow JSON.
 *
 * Usage:
 *   node split_narrator_audio.js [audioFile] [scriptJson]
 *
 * Defaults:
 *   audioFile  → SacredHeartMeditation.mp3
 *   scriptJson → script.json
 *
 * Output: ./output/{stepId}_{messageIndex}.mp3
 *
 * Requires: OPENAI_API_KEY in environment
 */

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);

// ─── Config ──────────────────────────────────────────────────────────────────

const AUDIO_FILE = process.argv[2] || "SacredHeartMeditation.mp3";
const SCRIPT_FILE = process.argv[3] || "script.json";
const OUTPUT_DIR = path.join(__dirname, "output");

// How many chars to use when fuzzy-matching a message to a transcript segment
const MATCH_PREFIX_LEN = 25;
// How many extra segments to look ahead when building a clip (in case one message spans multiple segments)
const MAX_LOOKAHEAD = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Given the transcript segments and a message text, find the best-matching
 * start segment index (searching forward from `fromIdx`).
 * Returns the segment index or -1 if not found.
 */
function findStartSegment(segments, messageText, fromIdx) {
  const needle = normalize(messageText).slice(0, MATCH_PREFIX_LEN);
  const needleWords = needle.split(" ").filter(Boolean);

  for (let i = fromIdx; i < segments.length; i++) {
    const segText = normalize(segments[i].text);
    // Check if at least the first 3 words of the needle appear in this segment
    const checkWords = needleWords.slice(0, Math.min(3, needleWords.length));
    if (checkWords.every(w => segText.includes(w))) {
      return i;
    }
  }
  return -1;
}

/**
 * Given a start segment, accumulate segments until we've covered enough of
 * the message text. Returns the index of the last segment to include.
 */
function findEndSegment(segments, messageText, startIdx) {
  const msgWords = normalize(messageText).split(" ").filter(Boolean);
  let combined = "";
  let endIdx = startIdx;

  for (let i = startIdx; i < Math.min(startIdx + MAX_LOOKAHEAD, segments.length); i++) {
    combined += " " + normalize(segments[i].text);
    endIdx = i;
    // Stop once we've covered ≥75% of the message words
    const covered = msgWords.filter(w => combined.includes(w)).length;
    if (covered >= msgWords.length * 0.75) break;
  }

  return endIdx;
}

/**
 * Cut a slice from the source audio file using ffmpeg.
 */
function cutAudio(inputPath, outputPath, startSec, endSec) {
  return new Promise((resolve, reject) => {
    const duration = endSec - startSec;
    if (duration <= 0) return reject(new Error(`Invalid range: ${startSec} → ${endSec}`));

    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(duration)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate inputs
  if (!fs.existsSync(AUDIO_FILE)) {
    console.error(`\n❌  Audio file not found: ${AUDIO_FILE}`);
    console.error(`    Place your audio file in the project root and run:`);
    console.error(`    node split_narrator_audio.js <audioFile> <scriptJson>\n`);
    process.exit(1);
  }
  if (!fs.existsSync(SCRIPT_FILE)) {
    console.error(`\n❌  Script JSON not found: ${SCRIPT_FILE}`);
    console.error(`    Place your script.json in the project root.\n`);
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error(`\n❌  OPENAI_API_KEY is not set in the environment.\n`);
    process.exit(1);
  }

  // Load script
  const script = JSON.parse(fs.readFileSync(SCRIPT_FILE, "utf-8"));
  const steps = script.steps || [];

  // Collect all narrator messages
  const allMessages = [];
  for (const step of steps) {
    if (step.type !== "narrator") continue;
    const rawMsgs = [
      ...(step.content ? [step.content] : []),
      ...(Array.isArray(step.messages)
        ? step.messages.map(m => (typeof m === "string" ? m : m.text || ""))
        : []),
    ].filter(Boolean);
    rawMsgs.forEach((text, idx) => {
      allMessages.push({ stepId: step.id || `step_${steps.indexOf(step)}`, msgIdx: idx, text });
    });
  }

  if (allMessages.length === 0) {
    console.error(`\n❌  No narrator messages found in ${SCRIPT_FILE}.`);
    console.error(`    Make sure steps have type: "narrator" with messages.\n`);
    process.exit(1);
  }

  console.log(`\n📄  Found ${allMessages.length} narrator messages across ${steps.filter(s => s.type === "narrator").length} narrator steps.`);
  console.log(`🎙️   Transcribing ${AUDIO_FILE} with OpenAI gpt-4o-transcribe …\n`);

  // Transcribe
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(AUDIO_FILE),
    model: "gpt-4o-transcribe",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments = transcription.segments || [];
  if (segments.length === 0) {
    console.error(`\n❌  Transcription returned no segments. Cannot match timestamps.\n`);
    process.exit(1);
  }

  console.log(`✅  Transcription complete — ${segments.length} segments found.\n`);

  // Show transcript overview
  console.log("── Transcript segments ──────────────────────────────────────");
  segments.forEach((seg, i) => {
    console.log(`  [${String(i).padStart(3)}] ${seg.start.toFixed(2)}s → ${seg.end.toFixed(2)}s  "${seg.text.trim()}"`);
  });
  console.log("─────────────────────────────────────────────────────────────\n");

  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Match and cut
  const created = [];
  const skipped = [];
  let segCursor = 0;

  for (const { stepId, msgIdx, text } of allMessages) {
    const outFile = path.join(OUTPUT_DIR, `${stepId}_${msgIdx}.mp3`);
    const label = `${stepId}[${msgIdx}]`;

    const startIdx = findStartSegment(segments, text, segCursor);
    if (startIdx === -1) {
      console.warn(`  ⚠️  SKIP  ${label}  —  no match for: "${text.slice(0, 50)}"`);
      skipped.push({ label, text });
      continue;
    }

    const endIdx = findEndSegment(segments, text, startIdx);
    const startSec = segments[startIdx].start;
    const endSec = segments[endIdx].end;

    console.log(`  ✂️   ${label}  ${startSec.toFixed(2)}s → ${endSec.toFixed(2)}s  →  ${path.basename(outFile)}`);

    try {
      await cutAudio(AUDIO_FILE, outFile, startSec, endSec);
      created.push(outFile);
      segCursor = endIdx; // advance cursor so next search starts here
    } catch (err) {
      console.warn(`  ⚠️  FAIL  ${label}  —  ffmpeg error: ${err.message}`);
      skipped.push({ label, text, error: err.message });
    }
  }

  // Summary
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log(`✅  Created ${created.length} file(s):`);
  created.forEach(f => console.log(`    ${f}`));

  if (skipped.length > 0) {
    console.log(`\n⚠️   Skipped ${skipped.length} message(s):`);
    skipped.forEach(({ label, text }) => console.log(`    ${label}: "${text.slice(0, 60)}"`));
    console.log(`\n    Tip: check that the script text matches the spoken audio closely.`);
  }

  console.log(`\nDone. Files are in: ${OUTPUT_DIR}\n`);
}

main().catch(err => {
  console.error("\n💥  Unexpected error:", err.message);
  process.exit(1);
});

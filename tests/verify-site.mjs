import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const lesson = await readFile(path.join(root, "p01-a7m4k2", "index.html"), "utf8");
const styles = await readFile(path.join(root, "assets", "styles.css"), "utf8");

const requiredDriveIds = [
  "1EdlGzsad7Rked-R3vJ_tM9zJnkodaNiV",
  "16HZxI0xCxXOcnaFrHzKWbTF_gzgdRDR3",
  "1l8XZZOp3M2TgdpAPYlO8ArqTpJLqwkb6",
  "14dPaG56p748htwib5Wwj_VSu4mWUSu0L",
  "1BQegqoH18-kZR7AmSMMXzWfU1DeQPbZZ",
];

for (const driveId of requiredDriveIds) {
  assert.match(lesson, new RegExp(driveId), `Missing Drive asset ${driveId}`);
}

assert.match(lesson, /entry\.1077842338=OP1-L01/);
assert.match(lesson, /video quay màn hình bằng chính file PDF ở Bước 3/);
assert.match(lesson, /Khẩu hình đúng; phát đủ âm, rõ âm cuối \(âm đuôi\)/);
assert.match(lesson, /<meta charset="UTF-8"/);
assert.match(lesson, /<h1[^>]*>.*Aa.*Bb.*<\/h1>/s);
assert.equal((lesson.match(/<iframe/g) || []).length, 5);
assert.match(styles, /@media \(max-width: 560px\)/);
assert.doesNotMatch(lesson, /Google Sites/);
assert.doesNotMatch(lesson, /Oxford/i);
assert.doesNotMatch(lesson, /\bBé\b|\bbé\b/);

console.log("Phonics Lesson 01 static checks passed.");

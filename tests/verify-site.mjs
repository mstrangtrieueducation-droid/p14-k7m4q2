import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(await readFile(path.join(root, "content", "lessons.json"), "utf8"));
const styles = await readFile(path.join(root, "assets", "styles.css"), "utf8");
const appScript = await readFile(path.join(root, "assets", "app.js"), "utf8");
const sharedFormId = "1FAIpQLScBAmLa0utUwcdJ8frHTHXpfTE2zgsIF8hXthSxSd7KoqDANQ";

assert.equal(data.lessons.length, 49, "Expected every lesson folder currently present in Drive");
assert.deepEqual(
  Object.fromEntries([1, 2, 3, 4].map((level) => [level, data.lessons.filter((lesson) => lesson.level === level).length])),
  { 1: 13, 2: 14, 3: 16, 4: 6 },
);

const missingSourceFolders = [
  [1, 7],
  [2, 7],
  [3, 9],
];
for (const [level, lesson] of missingSourceFolders) {
  assert.equal(data.lessons.some((item) => item.level === level && item.lesson === lesson), false);
}

for (const item of data.lessons) {
  const html = await readFile(path.join(root, item.slug, "index.html"), "utf8");
  const formPattern = new RegExp(`entry\\.1077842338=${item.code}`);
  const googleVidsTeacher = item.files.find(
    (file) => file.mimeType === "application/vnd.google-apps.vid" && file.title.toLocaleLowerCase("vi").includes("dặn con"),
  );

  assert.match(html, /<meta charset="UTF-8"/);
  assert.match(html, new RegExp(`Phonics ${item.level}`));
  assert.match(html, new RegExp(`/d/e/${sharedFormId}/viewform`), `${item.code} points to the wrong Form`);
  assert.match(html, formPattern, `${item.code} is not prefilled in its Form URL`);
  assert.match(html, /quay màn hình/i);
  assert.match(html, /Khẩu hình đúng; phát đủ âm, rõ âm cuối \(âm đuôi\)/);
  assert.doesNotMatch(html, /Google Sites/);
  assert.doesNotMatch(html, /Oxford/i);
  assert.doesNotMatch(html, /\bBé\b|\bbé\b/);

  if (googleVidsTeacher) {
    assert.match(
      html,
      new RegExp(`https://docs\\.google\\.com/videos/d/${googleVidsTeacher.id}/play`),
      `${item.code} must prefer its processed Google Vids teacher video`,
    );
  }

  const checkedLogicalFiles = new Set();
  for (const file of item.files) {
    const logicalFileKey = file.title.replace(/\.[^.]+$/, "").toLocaleLowerCase("vi");
    if (checkedLogicalFiles.has(logicalFileKey)) continue;
    checkedLogicalFiles.add(logicalFileKey);

    if (file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/") || file.mimeType === "application/pdf" || file.mimeType === "application/vnd.google-apps.presentation" || file.mimeType === "application/vnd.google-apps.vid") {
      assert.match(html, new RegExp(file.id), `${item.code} is missing ${file.title}`);
    }
  }
}

assert.match(styles, /@media \(max-width: 560px\)/);
assert.match(styles, /\.audio-list/);
assert.match(styles, /\.hero__topic--compact/);
assert.match(styles, /\.media-help/);
assert.match(appScript, /addDriveFallbacks/);
assert.match(appScript, /Mở bằng Drive/);
assert.match(appScript, /Hãy đăng nhập Google rồi mở bằng Drive/);

console.log("All 49 Phonics lesson pages passed static checks.");

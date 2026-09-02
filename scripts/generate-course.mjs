import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(await readFile(path.join(root, "content", "lessons.json"), "utf8"));

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const fileStem = (title) => title.replace(/\.[^.]+$/, "");
const titleKey = (file) => file.title.toLocaleLowerCase("vi");
const googleVidsMimeType = "application/vnd.google-apps.vid";
const isGoogleVids = (file) => file.mimeType === googleVidsMimeType;
const isVideo = (file) => file.mimeType.startsWith("video/") || isGoogleVids(file);
const isTeacherVideo = (file) => isVideo(file) && titleKey(file).includes("dặn con");
const isParentVideo = (file) => isVideo(file) && titleKey(file).includes("bố mẹ");
const isPracticeVideo = (file) => isVideo(file) && !isTeacherVideo(file) && !isParentVideo(file);
const isAudio = (file) => file.mimeType.startsWith("audio/");
const isDocument = (file) =>
  file.mimeType === "application/pdf" || file.mimeType === "application/vnd.google-apps.presentation";

const practiceLabel = (file) =>
  fileStem(file.title)
    .replace(/^(?:unit|u)[_\s-]*\d+[_\s-]*/i, "")
    .trim();

const displayFileTitle = (file) =>
  fileStem(file.title)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const embedUrl = (file) =>
  isGoogleVids(file)
    ? `https://docs.google.com/videos/d/${file.id}/play`
    : file.mimeType === "application/vnd.google-apps.presentation"
    ? `https://docs.google.com/presentation/d/${file.id}/preview`
    : `https://drive.google.com/file/d/${file.id}/preview`;

const formUrl = (lesson) =>
  `${data.formBaseUrl}?usp=pp_url&entry.${data.formEntryId}=${encodeURIComponent(lesson.code)}`;

const mediaBlock = (file, title, document = false) => `
          <div class="media-block">
            <div class="${document ? "document-frame" : "media-frame"}" data-fullscreen-frame>
              <iframe
                src="${escapeHtml(embedUrl(file))}"
                title="${escapeHtml(title)}"
                allow="autoplay; fullscreen"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
            <div class="media-actions">
              <button class="fullscreen-button" type="button" data-fullscreen="${escapeHtml(embedUrl(file))}">
                <i data-lucide="maximize" aria-hidden="true"></i>
                Toàn màn hình
              </button>
              ${document ? `<a class="outline-button" href="${escapeHtml(file.url)}" target="_blank" rel="noopener"><i data-lucide="external-link" aria-hidden="true"></i>Mở file riêng</a>` : ""}
            </div>
          </div>`;

const renderPracticeSection = (file, index) => {
  const label = practiceLabel(file);
  const tone = index % 2 === 0 ? "a" : "b";
  const reverse = index % 2 === 1 ? " sound-grid--reverse" : "";
  const compact = label.length > 2 ? " sound-letter--compact" : "";
  return `
      <section class="sound-band sound-band--${tone}" aria-labelledby="practice-${index + 1}">
        <div class="section-inner sound-grid${reverse}">
          <div class="sound-card sound-card--${tone}">
            <span class="sound-letter${compact}" aria-hidden="true">${escapeHtml(label)}</span>
            <div>
              <p class="kicker">Bước 2 · Luyện âm ${index + 1}</p>
              <h2 id="practice-${index + 1}">Con luyện âm ${escapeHtml(label)}</h2>
              <p>Con nhìn khẩu hình, nghe thật kĩ rồi đọc to và rõ theo video mẫu. Chú ý phát đủ âm và rõ âm cuối.</p>
            </div>
          </div>
          ${mediaBlock(file, `Video luyện âm ${label}`)}
        </div>
      </section>`;
};

const renderAudioSection = (files) => {
  if (!files.length) return "";
  return `
      <section class="audio-band" aria-labelledby="audio-title">
        <div class="section-inner">
          <div class="section-heading section-heading--center">
            <span class="section-icon section-icon--yellow"><i data-lucide="headphones" aria-hidden="true"></i></span>
            <p class="kicker">Bước 3 · Nghe và đọc theo</p>
            <h2 id="audio-title">Story &amp; Song</h2>
            <p class="section-lead">Con nghe nhiều lần, theo dõi phần tương ứng trong file học và bắt chước cách phát âm, ngữ điệu giống hệt bản mẫu.</p>
          </div>
          <div class="audio-list">
            ${files.map((file) => `
              <article class="audio-item">
                <div class="audio-item__title"><i data-lucide="volume-2" aria-hidden="true"></i><strong>${escapeHtml(displayFileTitle(file))}</strong></div>
                <div class="audio-frame" data-fullscreen-frame>
                  <iframe src="${escapeHtml(embedUrl(file))}" title="${escapeHtml(displayFileTitle(file))}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe>
                </div>
                <button class="fullscreen-button" type="button" data-fullscreen="${escapeHtml(embedUrl(file))}"><i data-lucide="maximize" aria-hidden="true"></i>Toàn màn hình</button>
              </article>`).join("")}
          </div>
        </div>
      </section>`;
};

const renderLesson = (lesson) => {
  const teacherVideos = lesson.files.filter(isTeacherVideo);
  const teacher = teacherVideos.find(isGoogleVids) || teacherVideos[0];
  const parent = lesson.files.find(isParentVideo);
  const practice = lesson.files.filter(isPracticeVideo);
  const audio = lesson.files.filter(isAudio);
  const document = lesson.files.find(isDocument);
  const topic = practice.map(practiceLabel).join(" · ") || "Luyện âm";
  const compactTopic = topic.length > 18 ? " hero__topic--compact" : "";
  const lessonNumber = String(lesson.lesson).padStart(2, "0");

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#10183f" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="Phonics ${lesson.level} - Lesson ${lessonNumber}: ${escapeHtml(topic)}. Xem mẫu, luyện âm, đọc với file và nộp bài." />
    <title>Phonics ${lesson.level} - Lesson ${lessonNumber} | ${escapeHtml(topic)}</title>
    <link rel="stylesheet" href="../assets/styles.css" />
    <script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js" defer></script>
    <script src="../assets/app.js" defer></script>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar__inner">
        <img class="brand-logo" src="../assets/logo.png" alt="Ms. Trang Trieu Education" width="76" height="76" />
        <div>
          <p class="brand-name">Ms. Trang Trieu Education</p>
          <p class="series">Phonics ${lesson.level}</p>
          <p class="lesson-label">Lesson ${lessonNumber}</p>
        </div>
        <span class="lesson-badge" aria-label="Bài học số ${lesson.lesson}">${lessonNumber}</span>
      </div>
    </header>

    <main>
      <section class="hero hero--generic" aria-labelledby="lesson-title">
        <img class="hero__image" src="../assets/phonics-generic-banner.png" alt="Các bạn nhỏ cùng học âm trong lớp học" />
        <div class="hero__veil" aria-hidden="true"></div>
        <div class="hero__content">
          <p class="hero__eyebrow">Phonics ${lesson.level} · Lesson ${lessonNumber}</p>
          <h1 class="${compactTopic.trim()}" id="lesson-title">${escapeHtml(topic)}</h1>
          <p>Nghe rõ · Nhìn hình · Đọc to</p>
          <a class="hero__start" href="#lesson-start"><i data-lucide="play" aria-hidden="true"></i>Bắt đầu học</a>
        </div>
      </section>

      <section class="steps-band" aria-labelledby="steps-title">
        <div class="section-inner">
          <div class="section-heading section-heading--center"><p class="kicker">Cách học</p><h2 id="steps-title">Con học theo 4 bước</h2></div>
          <ol class="steps">
            <li><span class="step-number">1</span><i data-lucide="circle-play" aria-hidden="true"></i><strong>Xem cô làm mẫu</strong></li>
            <li><span class="step-number">2</span><i data-lucide="volume-2" aria-hidden="true"></i><strong>Nghe và đọc to</strong></li>
            <li><span class="step-number">3</span><i data-lucide="images" aria-hidden="true"></i><strong>Luyện với file học</strong></li>
            <li><span class="step-number">4</span><i data-lucide="video" aria-hidden="true"></i><strong>Quay màn hình và nộp</strong></li>
          </ol>
          <p class="remember"><i data-lucide="sparkles" aria-hidden="true"></i>Con nhìn đúng hình, mở khẩu hình rõ và bắt chước cách đọc trong video mẫu nhé!</p>
        </div>
      </section>

      ${teacher ? `<section class="lesson-section teacher-section" id="lesson-start" aria-labelledby="teacher-title"><div class="section-inner lesson-grid"><div class="lesson-copy"><span class="section-icon section-icon--coral"><i data-lucide="graduation-cap" aria-hidden="true"></i></span><p class="kicker">Bước 1</p><h2 id="teacher-title">Cùng cô bắt đầu</h2><p>Con xem cô hướng dẫn trước, sau đó mới chuyển sang luyện từng âm.</p></div>${mediaBlock(teacher, `Cô hướng dẫn Phonics ${lesson.level} Lesson ${lessonNumber}`)}</div></section>` : ""}

      ${practice.map(renderPracticeSection).join("\n")}

      ${renderAudioSection(audio)}

      ${document ? `<section class="lesson-section picture-section" aria-labelledby="picture-title"><div class="section-inner lesson-grid lesson-grid--wide-copy"><div class="lesson-copy"><span class="section-icon section-icon--yellow"><i data-lucide="file-text" aria-hidden="true"></i></span><p class="kicker">Bước 3</p><h2 id="picture-title">Con luyện đọc với file học</h2><p>Con dùng chính file này để luyện đọc và quay màn hình trả bài.</p><div class="recording-guide" aria-label="Các bước quay màn hình trả bài"><h3>Con quay bài như sau</h3><ol><li>Mở file bằng nút <strong>Toàn màn hình</strong>.</li><li>Bật chức năng <strong>quay màn hình</strong> trên thiết bị.</li><li>Chỉ vào từng hình và đọc to, rõ theo đúng thứ tự.</li><li>Dừng quay, kiểm tra video có đủ hình và tiếng rồi bấm <strong>Nộp bài cho cô</strong>.</li></ol><p><strong>Yêu cầu:</strong> Khẩu hình đúng; phát đủ âm, rõ âm cuối (âm đuôi); đọc to, rõ; bắt chước cách phát âm, trọng âm và ngữ điệu giống hệt video mẫu.</p></div></div>${mediaBlock(document, `File luyện đọc Phonics ${lesson.level} Lesson ${lessonNumber}`, true)}</div></section>` : ""}

      ${parent ? `<section class="parent-band" aria-labelledby="parent-title"><div class="section-inner lesson-grid"><div class="lesson-copy"><span class="section-icon section-icon--green"><i data-lucide="heart-handshake" aria-hidden="true"></i></span><p class="kicker">Dành cho bố mẹ</p><h2 id="parent-title">Đồng hành cùng con</h2><p>Bố mẹ xem phần cô hướng dẫn để giúp con ôn ngắn, đều và vui mỗi ngày.</p></div>${mediaBlock(parent, "Cô hướng dẫn bố mẹ đồng hành cùng con")}</div></section>` : ""}

      <section class="submit-band" aria-labelledby="submit-title">
        <div class="section-inner submit-inner">
          <span class="submit-star" aria-hidden="true"><i data-lucide="star"></i></span>
          <div><p class="kicker">Bước 4</p><h2 id="submit-title">Con đã sẵn sàng!</h2><p>Con nộp <strong>video quay màn hình bằng chính file học ở Bước 3</strong>. Hãy kiểm tra video có đủ hình và tiếng trước khi gửi.</p><div class="submit-meta"><span><i data-lucide="tag" aria-hidden="true"></i>Mã bài: <strong>${lesson.code}</strong></span><span><i data-lucide="calendar-clock" aria-hidden="true"></i>Trước buổi học kế tiếp</span></div></div>
          <a class="submit-button" href="${escapeHtml(formUrl(lesson))}" target="_blank" rel="noopener"><i data-lucide="send" aria-hidden="true"></i>Nộp bài cho cô</a>
        </div>
      </section>
    </main>

    <footer><img src="../assets/logo.png" alt="" width="42" height="42" /><span>Ms. Trang Trieu Education</span></footer>
  </body>
</html>\n`;
};

let generated = 0;
for (const lesson of data.lessons) {
  if (lesson.level === 1 && lesson.lesson === 1) continue;
  const outputDir = path.join(root, lesson.slug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), renderLesson(lesson), "utf8");
  generated += 1;
}

const links = data.lessons
  .map((lesson) => `Phonics ${lesson.level} - Lesson ${String(lesson.lesson).padStart(2, "0")}: https://mstrangtrieueducation-droid.github.io/p14-k7m4q2/${lesson.slug}/`)
  .join("\n");
await writeFile(path.join(root, "content", "teacher-links.txt"), `${links}\n`, "utf8");

console.log(`Generated ${generated} lesson pages; preserved the approved Lesson 01 page.`);

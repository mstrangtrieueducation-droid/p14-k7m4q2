const refreshIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
  }
};

const driveOpenUrl = (source) => {
  const driveFile = source.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveFile) {
    return `https://drive.google.com/file/d/${driveFile[1]}/view`;
  }

  const googleVids = source.match(/docs\.google\.com\/videos\/d\/([^/]+)/);
  if (googleVids) {
    return `https://docs.google.com/videos/d/${googleVids[1]}/play`;
  }

  return source;
};

const addDriveFallbacks = () => {
  document.querySelectorAll(".media-block").forEach((block) => {
    const iframe = block.querySelector(".media-frame iframe");
    if (!iframe || block.querySelector(".drive-open-button")) return;

    let actions = block.querySelector(".media-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "media-actions";
      const fullscreenButton = block.querySelector(".fullscreen-button");
      if (fullscreenButton) actions.append(fullscreenButton);
      block.append(actions);
    }

    const openButton = document.createElement("a");
    openButton.className = "outline-button drive-open-button";
    openButton.href = driveOpenUrl(iframe.src);
    openButton.target = "_blank";
    openButton.rel = "noopener";
    openButton.innerHTML = '<i data-lucide="external-link" aria-hidden="true"></i>Mở bằng Drive';
    actions.append(openButton);
  });
};

const openFullscreen = async (button) => {
  const frame = button.closest(".media-block")?.querySelector("[data-fullscreen-frame]");

  try {
    if (frame?.requestFullscreen) {
      await frame.requestFullscreen();
      return;
    }

    if (frame?.webkitRequestFullscreen) {
      frame.webkitRequestFullscreen();
      return;
    }
  } catch {
    // Mobile browsers may reject iframe fullscreen; opening the Drive preview is the reliable fallback.
  }

  window.open(button.dataset.fullscreen, "_blank", "noopener,noreferrer");
};

document.addEventListener("DOMContentLoaded", () => {
  addDriveFallbacks();
  refreshIcons();

  document.querySelectorAll("[data-fullscreen]").forEach((button) => {
    button.addEventListener("click", () => openFullscreen(button));
  });
});

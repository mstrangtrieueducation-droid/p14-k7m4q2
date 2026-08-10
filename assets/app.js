const refreshIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 2.2 } });
  }
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
  refreshIcons();

  document.querySelectorAll("[data-fullscreen]").forEach((button) => {
    button.addEventListener("click", () => openFullscreen(button));
  });
});

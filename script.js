const savedTheme = window.localStorage.getItem("steven-theme");
const preferredTheme =
  savedTheme ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
document.body.dataset.theme = preferredTheme;

const themeButton = document.querySelector("[data-theme-toggle]");
const setTheme = (theme) => {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.body.dataset.theme = isDark ? "dark" : "light";
  window.localStorage.setItem("steven-theme", isDark ? "dark" : "light");
  if (themeButton) {
    themeButton.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
  }
};
setTheme(preferredTheme);
themeButton?.addEventListener("click", () => {
  document.documentElement.classList.add("theme-transitioning");
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 460);
});

const dashboard = document.querySelector(".site-shell");
const dashboardButton = document.querySelector(".dashboard-toggle");
const menuButton = document.querySelector(".menu-toggle");
const directory = document.querySelector(".directory");

dashboardButton.addEventListener("click", () => {
  const isOpen = dashboardButton.getAttribute("aria-expanded") === "true";
  dashboardButton.setAttribute("aria-expanded", String(!isOpen));
  dashboardButton.setAttribute(
    "aria-label",
    isOpen ? "Show dashboard" : "Hide dashboard",
  );
  dashboard.classList.toggle("dashboard-hidden", isOpen);
});

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Open pages menu" : "Close pages menu",
  );
  menuButton.querySelector(".menu-icon").textContent = isOpen ? "+" : "−";
  directory.classList.toggle("is-open", !isOpen);
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const image = carousel.querySelector(".carousel-image");
  const imageTrigger = carousel.querySelector(".carousel-image-trigger");
  const status = carousel.querySelector(".carousel-status");
  const imageDirectory = carousel.dataset.imageDirectory;
  const imageExtension = carousel.dataset.imageExtension || "png";
  const initialImage = image.getAttribute("src");
  let images = [initialImage];
  let current = 0;
  let lightbox;
  let discoveryPromise;

  const imageExists = (src) =>
    new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = src;
    });

  const updateImageDetails = () => {
    image.src = images[current];
    image.alt = `Project screenshot ${current + 1} of ${images.length}`;
    status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
  };

  const refreshThumbnails = () => {
    if (!lightbox) return;
    const thumbnails = lightbox.querySelector(".lightbox-thumbnails");
    thumbnails.replaceChildren();
    images.forEach((src, index) => {
      const thumbnail = document.createElement("button");
      thumbnail.className = "lightbox-thumbnail";
      thumbnail.type = "button";
      thumbnail.setAttribute("aria-label", `Show screenshot ${index + 1}`);
      thumbnail.innerHTML = `<img src="${src}" alt="" />`;
      thumbnail.addEventListener("click", () => showImage(index, true));
      thumbnails.append(thumbnail);
    });
  };

  const discoverImages = async () => {
    for (let index = 1; index < 100; index += 1) {
      const src = `${imageDirectory}${index}.${imageExtension}`;
      if (!(await imageExists(src))) break;
      images.push(src);
    }
    updateImageDetails();
    refreshThumbnails();
  };

  const createLightbox = () => {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Project screenshot viewer");
    lightbox.innerHTML = `
      <button class="lightbox-button lightbox-close" type="button" aria-label="Close image viewer">×</button>
      <div class="lightbox-content">
        <button class="lightbox-button lightbox-previous" type="button" aria-label="Previous screenshot">←</button>
        <div class="lightbox-image-wrap"><img class="lightbox-image" alt="" /></div>
        <button class="lightbox-button lightbox-next" type="button" aria-label="Next screenshot">→</button>
      </div>
      <div class="lightbox-thumbnails" aria-label="Choose screenshot"></div>
    `;
    document.body.append(lightbox);
    refreshThumbnails();
    lightbox
      .querySelector(".lightbox-close")
      .addEventListener("click", closeLightbox);
    lightbox
      .querySelector(".lightbox-previous")
      .addEventListener("click", () => showImage(current - 1, true));
    lightbox
      .querySelector(".lightbox-next")
      .addEventListener("click", () => showImage(current + 1, true));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  };

  const openLightbox = async () => {
    await discoveryPromise;
    if (!lightbox) createLightbox();
    lightbox.classList.add("is-open");
    document.body.classList.add("lightbox-open");
    showImage(current, true);
    lightbox.querySelector(".lightbox-close").focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    imageTrigger.focus();
  };

  function showImage(nextIndex, updateLightbox = false) {
    current = (nextIndex + images.length) % images.length;
    image.style.opacity = "0";
    window.setTimeout(() => {
      updateImageDetails();
      image.style.opacity = "1";
    }, 120);
    if (updateLightbox && lightbox) {
      lightbox.querySelector(".lightbox-image").src = images[current];
      lightbox.querySelector(".lightbox-image").alt =
        `Project screenshot ${current + 1} of ${images.length}`;
      lightbox
        .querySelectorAll(".lightbox-thumbnail")
        .forEach((thumbnail, index) => {
          thumbnail.classList.toggle("is-selected", index === current);
        });
    }
  }

  carousel
    .querySelector(".carousel-previous")
    .addEventListener("click", () => showImage(current - 1));
  carousel
    .querySelector(".carousel-next")
    .addEventListener("click", () => showImage(current + 1));
  imageTrigger.addEventListener("click", openLightbox);
  document.addEventListener("keydown", (event) => {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showImage(current - 1, true);
    if (event.key === "ArrowRight") showImage(current + 1, true);
  });
  discoveryPromise = discoverImages();
});

const audioPlayer = document.querySelector("[data-audio-player]");

document.querySelectorAll(".collection-section").forEach((section) => {
  const grid = section.querySelector(".collection-grid");
  const cards = [...section.querySelectorAll(".hardware-card")];
  const count = cards.length;
  const countLabel = section.querySelector(".collection-heading span");
  if (countLabel) countLabel.textContent = String(count).padStart(2, "0");

  if (!grid || count <= 3) return;

  const carousel = document.createElement("div");
  carousel.className = "hardware-carousel";
  carousel.innerHTML = `
    <button class="carousel-button hardware-previous" type="button" aria-label="Previous hardware item">←</button>
    <div class="hardware-carousel-viewport"><div class="hardware-carousel-track"></div></div>
    <button class="carousel-button hardware-next" type="button" aria-label="Next hardware item">→</button>
    <p class="hardware-carousel-status" aria-live="polite">01 / ${String(count).padStart(2, "0")}</p>
  `;
  const viewport = carousel.querySelector(".hardware-carousel-viewport");
  const track = carousel.querySelector(".hardware-carousel-track");
  const status = carousel.querySelector(".hardware-carousel-status");
  const previous = carousel.querySelector(".hardware-previous");
  const next = carousel.querySelector(".hardware-next");
  let current = 0;

  cards.forEach((card) => track.append(card));
  grid.replaceWith(carousel);

  const showCard = (index) => {
    const visibleCards =
      Number.parseInt(
        window
          .getComputedStyle(viewport)
          .getPropertyValue("--hardware-visible"),
        10,
      ) || 3;
    const lastStart = Math.max(0, count - visibleCards);
    current = (index + lastStart + 1) % (lastStart + 1);
    track.style.transform = `translateX(-${current * (100 / visibleCards)}%)`;
    status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(lastStart + 1).padStart(2, "0")}`;
  };

  previous.addEventListener("click", () => showCard(current - 1));
  next.addEventListener("click", () => showCard(current + 1));
  window.addEventListener("resize", () => showCard(current));
  showCard(0);
});

if (audioPlayer) {
  const audio = audioPlayer.querySelector("[data-audio-element]");
  const tracks = [
    ...audioPlayer.parentElement.querySelectorAll("[data-track]"),
  ];
  const title = audioPlayer.querySelector("[data-track-title]");
  const cover = audioPlayer.querySelector("[data-track-cover]");
  const nowExplicit = audioPlayer.querySelector("[data-now-explicit]");
  const date = audioPlayer.querySelector("[data-track-date]");
  const position = audioPlayer.querySelector("[data-track-position]");
  const progress = audioPlayer.querySelector("[data-progress]");
  const currentTime = audioPlayer.querySelector("[data-current-time]");
  const duration = audioPlayer.querySelector("[data-duration]");
  const playButton = audioPlayer.querySelector("[data-play]");
  const volume = audioPlayer.querySelector("[data-volume]");
  const message = audioPlayer.querySelector("[data-player-message]");
  const lyrics = audioPlayer.querySelector("[data-lyrics]");
  let currentTrack = 0;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const updateProgress = () => {
    currentTime.textContent = formatTime(audio.currentTime);
    duration.textContent = formatTime(audio.duration);
    progress.max = Number.isFinite(audio.duration) ? audio.duration : 0;
    progress.value = audio.currentTime || 0;
  };

  const selectTrack = (index, shouldPlay = false) => {
    currentTrack = (index + tracks.length) % tracks.length;
    const track = tracks[currentTrack];
    audio.pause();
    audio.src = new URL(track.dataset.src, window.location.href).href;
    audio.load();
    title.textContent = track.dataset.title;
    nowExplicit.hidden = track.dataset.explicit !== "true";
    if (track.dataset.cover) {
      cover.src = new URL(track.dataset.cover, window.location.href).href;
      cover.alt = `${track.dataset.title} cover`;
      cover.hidden = false;
    } else {
      cover.hidden = true;
    }
    date.textContent = track.dataset.date;
    position.textContent = `${String(currentTrack + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
    lyrics.textContent =
      track.querySelector(".track-lyrics-source")?.textContent.trim() ||
      "Lyrics have not been added yet.";
    tracks.forEach((item, index) =>
      item.classList.toggle("is-selected", index === currentTrack),
    );
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    progress.value = 0;
    progress.max = 0;
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "Play");
    message.textContent = `Ready to play ${track.dataset.title}.`;
    message.classList.remove("is-ready");
    if (shouldPlay) audio.play().catch(() => {});
  };

  tracks.forEach((track, index) => {
    track.addEventListener("click", () => selectTrack(index));
  });
  audioPlayer
    .querySelector("[data-track-previous]")
    .addEventListener("click", () => selectTrack(currentTrack - 1));
  audioPlayer
    .querySelector("[data-track-next]")
    .addEventListener("click", () => selectTrack(currentTrack + 1));
  playButton.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {
        message.textContent = "This track could not be played yet.";
      });
    } else {
      audio.pause();
    }
  });
  audioPlayer.querySelectorAll("[data-seek]").forEach((button) => {
    button.addEventListener("click", () => {
      audio.currentTime = Math.max(
        0,
        Math.min(
          audio.duration || 0,
          audio.currentTime + Number(button.dataset.seek),
        ),
      );
    });
  });
  progress.addEventListener("input", () => {
    audio.currentTime = Number(progress.value);
  });
  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
  });
  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", () => {
    playButton.textContent = "Ⅱ";
    playButton.setAttribute("aria-label", "Pause");
    message.classList.add("is-ready");
  });
  audio.addEventListener("canplay", () => {
    message.textContent = `Ready to play ${tracks[currentTrack].dataset.title}.`;
    message.classList.add("is-ready");
  });
  audio.addEventListener("pause", () => {
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "Play");
  });
  audio.addEventListener("ended", () => selectTrack(currentTrack + 1, true));
  audio.addEventListener("error", () => {
    message.textContent = `The track could not be decoded. Check that ${tracks[currentTrack].dataset.src} is a playable MP3.`;
    message.classList.remove("is-ready");
  });
  selectTrack(0);
}

const errorField = document.querySelector("[data-error-field]");

document.querySelectorAll("[data-discord-trigger]").forEach((trigger) => {
  const bubble = trigger.querySelector("[data-discord-bubble]");
  let hideTimer;

  trigger.addEventListener("click", () => {
    window.clearTimeout(hideTimer);
    trigger.classList.remove("is-shaking");
    bubble.classList.remove("is-visible");
    window.requestAnimationFrame(() => {
      trigger.classList.add("is-shaking");
      bubble.classList.add("is-visible");
    });
    hideTimer = window.setTimeout(() => {
      bubble.classList.remove("is-visible");
      trigger.classList.remove("is-shaking");
    }, 5000);
  });
});

if (errorField) {
  const sound = document.querySelector("[data-error-sound]");
  const count = 18;
  for (let index = 0; index < count; index += 1) {
    const target = document.createElement("button");
    target.className = "floating-404";
    target.type = "button";
    target.textContent = "404";
    target.setAttribute("aria-label", "Dismiss 404");
    target.style.left = `${8 + Math.random() * 84}%`;
    target.style.top = `${8 + Math.random() * 84}%`;
    target.style.animation = `float-404 ${4 + Math.random() * 5}s ease-in-out ${Math.random() * -5}s infinite alternate`;
    target.addEventListener("click", () => {
      sound.currentTime = 0;
      sound.play().catch(() => {});
      target.classList.add("is-collected");
    });
    errorField.append(target);
  }
}

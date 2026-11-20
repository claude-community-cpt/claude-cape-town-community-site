// A small surprise: click a sticker and it spins.
//
// A sticker with moods (see Sticker.astro) changes as it is clicked: the first
// click tickles it into its second picture, more clicks spin it into its last
// one, and it calms down again after a few seconds left alone.
const CALM_AFTER_MS = 6000;

function play(sticker: HTMLElement, animation: "is-spinning" | "is-tickled") {
  sticker.classList.remove("is-spinning", "is-tickled");
  void sticker.offsetWidth; // restart the animation if it is already running
  sticker.classList.add(animation);
}

function show(sticker: HTMLElement, mood: number) {
  sticker.dataset.mood = String(mood);
  sticker.querySelectorAll("img").forEach((img, i) => img.classList.toggle("is-shown", i === mood));
}

for (const sticker of document.querySelectorAll<HTMLElement>("[data-spin]")) {
  if (sticker.dataset.bound) continue;
  sticker.dataset.bound = "true";
  const moods = sticker.dataset.mood === undefined ? 0 : sticker.querySelectorAll("img").length;
  let calm: number | undefined;

  sticker.addEventListener("click", () => {
    if (moods === 0) return play(sticker, "is-spinning");
    const mood = Number(sticker.dataset.mood);
    if (mood === 0) {
      show(sticker, 1);
      play(sticker, "is-tickled");
    } else {
      show(sticker, moods - 1);
      play(sticker, "is-spinning");
    }
    window.clearTimeout(calm);
    calm = window.setTimeout(() => show(sticker, 0), CALM_AFTER_MS);
  });
  sticker.addEventListener("animationend", () => sticker.classList.remove("is-spinning", "is-tickled"));
}

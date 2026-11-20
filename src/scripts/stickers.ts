// A small surprise: click a sticker and it spins.
for (const sticker of document.querySelectorAll<HTMLElement>("[data-spin]")) {
  sticker.addEventListener("click", () => {
    sticker.classList.remove("is-spinning");
    void sticker.offsetWidth; // restart the animation if it is already running
    sticker.classList.add("is-spinning");
  });
  sticker.addEventListener("animationend", () => sticker.classList.remove("is-spinning"));
}

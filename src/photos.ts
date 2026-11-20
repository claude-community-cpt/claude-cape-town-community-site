// Photos shown on the site live in src/assets/gallery/<folder>/, one folder
// per event. They are found at build time and listed in file-name order.
import type { ImageMetadata } from "astro";

const files = import.meta.glob<{ default: ImageMetadata }>("./assets/gallery/*/*.{jpg,jpeg,png,webp}", { eager: true });

export function photosIn(folder: string) {
  return Object.entries(files)
    .filter(([path]) => path.includes(`/gallery/${folder}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, mod]) => ({ name: path.split("/").pop()!, image: mod.default }));
}

# Zoom background videos

The videos on the Downloads page (`public/downloads/`) are drawn by
`scene.html`, a 1920 by 1080 copy of the home page scene in which every moment
of a 40 second loop can be drawn exactly. `render.cjs` photographs each frame
in a browser and hands them to `ffmpeg` to make the video.

You only need this to change the videos. It needs `ffmpeg` installed.

```bash
node scripts/zoom-background/render.cjs light public/downloads/claude-cape-town-zoom-day.mp4
node scripts/zoom-background/render.cjs dark public/downloads/claude-cape-town-zoom-night.mp4
```

Each takes a couple of minutes. To look at one moment without rendering, open
`scene.html?theme=dark&t=12` in a browser (`t` is the time in seconds).

Keep the files small: every version stays in the repository's history for
good. If you change the scene, update the pictures in `src/assets/downloads/`
and the sizes in `src/pages/downloads.astro` too.

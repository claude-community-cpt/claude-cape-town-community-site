const { chromium } = require('playwright');
const { spawn } = require('child_process');
const [theme, out] = process.argv.slice(2);
const FPS = 30, T = 40, N = FPS * T;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(`file://${__dirname}/scene.html?theme=${theme}`);
  await p.waitForLoadState('load');
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '23', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-r', String(FPS), '-g', '60', '-movflags', '+faststart', '-an', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < N; i++) {
    await p.evaluate((t) => window.render(t), i / FPS);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
})();

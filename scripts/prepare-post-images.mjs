import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const root = resolve(import.meta.dirname, "..");
const output = join(root, "public/assets/post-images");
await mkdir(output, { recursive: true });
const manifest = {};
let before = 0, after = 0, optimized = 0;
async function walk(dir) {
 for (const entry of await readdir(dir, {withFileTypes: true})) {
  const file = join(dir, entry.name);
  if (entry.isDirectory()) { await walk(file); continue; }
  if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(file)) continue;
  const bytes = await readFile(file);
  const metadata = await sharp(bytes, {animated: true}).metadata();
  const width = metadata.width, height = metadata.pageHeight || metadata.height;
  const url = '/' + file.slice(join(root, 'public').length + 1).replaceAll('\\', '/');
  const item = {src: url, width, height};
  before += bytes.length;
  let size = bytes.length;
  if (bytes.length > 100 * 1024) {
   const hash = createHash('sha256').update(bytes).update('webp-1600-q82-v1').digest('hex').slice(0, 20);
   const name = hash + '.webp', destination = join(output, name);
   try { await stat(destination); } catch {
    await sharp(bytes, {animated: true}).resize({width: 1600, withoutEnlargement: true}).webp({quality: 82, effort: 5, loop: metadata.loop, delay: metadata.delay}).toFile(destination);
   }
   const candidate = await stat(destination);
   if (candidate.size < bytes.length * 0.95) {
    const m = await sharp(destination, {animated:true}).metadata();
    if ((m.pages || 1) !== (metadata.pages || 1) || JSON.stringify(m.delay) !== JSON.stringify(metadata.delay) || m.loop !== metadata.loop) { console.warn('Keeping original animation: ' + url); after += bytes.length; manifest[url] = item; continue; }
    Object.assign(item, {src: '/assets/post-images/' + name, width: m.width, height: m.pageHeight || m.height});
    size = candidate.size; optimized++;
   }
  }
  after += size; manifest[url] = item;
 }
}
await walk(join(root, 'public/images/posts'));
await writeFile(join(root, 'src/config/postImageManifest.json'), JSON.stringify(manifest, null, "\t") + "\n");
console.log(JSON.stringify({images: Object.keys(manifest).length, optimized, before, after}));

import type { CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const publicRoot = path.resolve("public");
const animationCache = new Map<string, Promise<boolean>>();
async function isAnimated(src: string) {
	if (/\.gif(?:$|[?#])/i.test(src)) return true;
	if (!/\.(webp|avif|png)(?:$|[?#])/i.test(src) || !src.startsWith("/"))
		return false;
	if (!animationCache.has(src))
		animationCache.set(
			src,
			(async () => {
				try {
					const file = path.resolve(publicRoot, "." + src.split(/[?#]/)[0]);
					if (!file.startsWith(publicRoot + path.sep)) return false;
					const meta = await sharp(file).metadata();
					return (meta.pages || 1) > 1;
				} catch {
					return false;
				}
			})(),
		);
	return animationCache.get(src)!;
}
function isUsable(src: string) {
	if (/^https?:\/\//i.test(src)) return true;
	if (!src.startsWith("/")) return false;
	const file = path.resolve(publicRoot, "." + src.split(/[?#]/)[0]);
	return file.startsWith(publicRoot + path.sep) && fs.existsSync(file);
}
export async function getRecordCover(post: CollectionEntry<"posts">) {
	const media: string[] = [];
	if (post.data.image) media.push(post.data.image);
	if (!post.data.password && !post.data.hideHomeContent) {
		const body = post.body || "";
		for (const match of body.matchAll(
			/!\[[^\]]*\]\(\s*(\/?[^\s)]+)(?:\s+[^)]*)?\)/g,
		))
			media.push(match[1]);
		for (const match of body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi))
			media.push(match[1]);
	}
	const candidates = [...new Set(media)].filter(isUsable);
	for (const src of candidates) if (await isAnimated(src)) return src;
	return candidates[0] || "/images/home/summer-shade.webp";
}

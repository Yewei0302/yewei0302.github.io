import { getSortedPosts, getSortedPostsList } from "../../utils/content-utils";
import {
	getPostPublicDescription,
	shouldHidePostHomeContent,
} from "../../utils/post-card-content";
export async function GET() {
	const [posts, list] = await Promise.all([
		getSortedPosts(),
		getSortedPostsList(),
	]);
	const urls = new Map(list.map((post) => [post.id, post.url]));
	const documents = posts
		.filter((post) => !post.data.draft)
		.map((post) => ({
			url: urls.get(post.id),
			title: post.data.title,
			description: getPostPublicDescription(post.data),
			tags: post.data.tags,
			category: post.data.category || "",
			text: shouldHidePostHomeContent(post.data)
				? ""
				: (post.body || "")
						.replace(/<[^>]*>/g, " ")
						.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
						.replace(/[#*_`>]/g, " ")
						.replace(/\s+/g, " ")
						.trim(),
		}));
	return new Response(JSON.stringify(documents), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

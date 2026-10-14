<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { navigateToPage } from "@utils/navigation-utils";
import { url } from "@utils/url-utils";
import { onDestroy, onMount } from "svelte";

import type { SearchResult } from "@/global";

let keywordDesktop = $state("");
let keywordMobile = $state("");
let result: SearchResult[] = $state([]);
let pagefindLoaded = false;
let initialized = $state(false);
let isDesktopSearchExpanded = $state(false);
let debounceTimer: ReturnType<typeof setTimeout>;
let windowJustFocused = false;
let focusTimer: ReturnType<typeof setTimeout>;
let blurTimer: ReturnType<typeof setTimeout>;

interface SearchDocument {url:string;title:string;description:string;tags:string[];category:string;text:string}
let documentRequest: Promise<SearchDocument[]> | undefined;
let searchVersion = 0;
function escapeExcerpt(text:string){return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
async function searchDocuments(keyword:string):Promise<SearchResult[]>{
 if(!documentRequest)documentRequest=fetch(url('/api/search-posts.json')).then(response=>{if(!response.ok)throw new Error('Search data unavailable');return response.json();}).catch(error=>{documentRequest=undefined;throw error;});
 const documents=await documentRequest;
 const terms=keyword.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return documents.map(doc=>{const title=doc.title.toLocaleLowerCase();const summary=(doc.description+' '+doc.category+' '+doc.tags.join(' ')).toLocaleLowerCase();const body=doc.text.toLocaleLowerCase();return {doc,score:terms.every(term=>(title+' '+summary+' '+body).includes(term))?terms.reduce((score,term)=>score+(title.includes(term)?3:summary.includes(term)?2:1),0):0};}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,20).map(({doc})=>({url:doc.url,meta:{title:doc.title},excerpt:escapeExcerpt(doc.description||doc.text.slice(0,140))}));
}

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
	if (
		!panel?.classList.contains("float-panel-closed") &&
		import.meta.env.PROD && typeof window.loadPagefind === "function"
	) {
		window.loadPagefind();
	}
};

const toggleDesktopSearch = () => {
	// 如果窗口刚获得焦点，不自动展开搜索框
	if (windowJustFocused) {
		return;
	}
	isDesktopSearchExpanded = !isDesktopSearchExpanded;
	if (isDesktopSearchExpanded) {
		if (import.meta.env.PROD && typeof window.loadPagefind === "function") {
			window.loadPagefind();
		}
		setTimeout(() => {
			const input = document.getElementById(
				"search-input-desktop",
			) as HTMLInputElement;
			input?.focus();
		}, 0);
	}
};

const collapseDesktopSearch = () => {
	if (!keywordDesktop) {
		isDesktopSearchExpanded = false;
	}
};

const handleBlur = () => {
	// 延迟处理以允许搜索结果的点击事件先于折叠逻辑执行
	blurTimer = setTimeout(() => {
		isDesktopSearchExpanded = false;
		// 仅隐藏面板并折叠，保留搜索关键词和结果以便下次展开时查看
		setPanelVisibility(false, true);
	}, 200);
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) {
		return;
	}
	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

const closeSearchPanel = (): void => {
    searchVersion++;
	const panel = document.getElementById("search-panel");
	if (panel) {
		panel.classList.add("float-panel-closed");
	}
	// 清空搜索关键词和结果
	keywordDesktop = "";
	keywordMobile = "";
	result = [];
};

const handleResultClick = (event: Event, url: string): void => {
	event.preventDefault();
	closeSearchPanel();
	navigateToPage(url);
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
    const version = ++searchVersion;
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}
	if (!initialized) {
		return;
	}
	try {
		let searchResults: SearchResult[] = [];
		if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
			const response = await window.pagefind.search(keyword);
			searchResults = await Promise.all(
				response.results.map((item) => item.data()),
			);
		} else {
            searchResults = await searchDocuments(keyword);
        }
        if (!searchResults.length) searchResults = await searchDocuments(keyword);
        if (version !== searchVersion) return;
		result = searchResults;
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		if (version !== searchVersion) return;
        console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	}
};

onMount(() => {
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		console.log("Pagefind status on init:", pagefindLoaded);
	};
	const cleanupCallbacks: (() => void)[] = [];
	if (import.meta.env.DEV) {
		console.log(
			"Development search uses real article content.",
		);
		initializeSearch();
	} else {
		const handlePagefindReady = () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		};
		const handlePagefindError = () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch();
		};

		document.addEventListener("pagefindready", handlePagefindReady);
		document.addEventListener("pagefindloaderror", handlePagefindError);

		// Fallback in case events are not caught or pagefind is already loaded by the time this script runs
		setTimeout(() => {
			if (!initialized) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000);

		cleanupCallbacks.push(
			() => document.removeEventListener("pagefindready", handlePagefindReady),
			() =>
				document.removeEventListener("pagefindloaderror", handlePagefindError),
		);
	}

	// 监听窗口焦点事件，防止切换窗口时自动展开搜索框
	const handleFocus = () => {
		windowJustFocused = true;
		clearTimeout(focusTimer);
		focusTimer = setTimeout(() => {
			windowJustFocused = false;
		}, 500); // 500ms 后才允许 mouseenter 触发展开
	};

	window.addEventListener("focus", handleFocus);

	return () => {
		window.removeEventListener("focus", handleFocus);
		for (const cb of cleanupCallbacks) {
			cb();
		}
	};
});

$effect(() => {
	if (initialized) {
		const keyword = keywordDesktop || keywordMobile;
		const isDesktop = !!keywordDesktop || isDesktopSearchExpanded;

		clearTimeout(debounceTimer);
		if (keyword) {
			debounceTimer = setTimeout(() => {
				search(keyword, isDesktop);
			}, 300);
		} else {
			result = [];
			setPanelVisibility(false, isDesktop);
		}
	}
});

$effect(() => {
	if (typeof document !== "undefined") {
		const navbar = document.getElementById("navbar");
		if (isDesktopSearchExpanded) {
			navbar?.classList.add("is-searching");
		} else {
			navbar?.classList.remove("is-searching");
		}
	}
});

onDestroy(() => {
	if (typeof document !== "undefined") {
		const navbar = document.getElementById("navbar");
		navbar?.classList.remove("is-searching");
	}
	clearTimeout(debounceTimer);
	clearTimeout(focusTimer);
});
</script>

<!-- search bar for desktop view (collapsed by default) -->
<div class="hidden lg:block relative w-24 h-11 shrink-0">
	<button
		id="search-bar"
		class="flex transition-all items-center h-11 rounded-lg absolute right-0 top-0 shrink-0 border-0 bg-transparent cursor-pointer
            {isDesktopSearchExpanded
			? 'bg-black/4 hover:bg-black/6 focus-within:bg-black/6 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10'
			: 'btn-plain active:scale-90'}
            {isDesktopSearchExpanded ? 'w-48' : 'w-24'}"
		aria-label="搜索文章"
		onmouseenter={() => {
			if (!isDesktopSearchExpanded) {
				toggleDesktopSearch();
			}
		}}
		onmouseleave={collapseDesktopSearch}
		onclick={() => {
			if (!isDesktopSearchExpanded) toggleDesktopSearch();
			const input = document.getElementById(
				"search-input-desktop",
			) as HTMLInputElement;
			input?.focus();
		}}
	>
		<Icon
			icon="material-symbols:search"
			class="absolute text-[1.25rem] pointer-events-none {isDesktopSearchExpanded
				? 'left-3'
				: 'left-3'} transition top-1/2 -translate-y-1/2 {isDesktopSearchExpanded
				? 'text-black/30 dark:text-white/30'
				: ''}"
		></Icon>
		{#if !isDesktopSearchExpanded}<span class="absolute left-10 whitespace-nowrap text-sm font-medium">搜索</span>{/if}
		<input
			id="search-input-desktop"
			placeholder={i18n(I18nKey.search)}
			bind:value={keywordDesktop}
			onfocus={() => {
				keywordMobile = "";
                clearTimeout(blurTimer);
				if (!isDesktopSearchExpanded) {
					toggleDesktopSearch();
				}
				search(keywordDesktop, true);
			}}
			onblur={handleBlur}
			class="transition-all pl-10 text-sm bg-transparent outline-0
                h-full {isDesktopSearchExpanded
				? 'w-36'
				: 'w-0'} text-black/50 dark:text-white/50"
		/>
	</button>
</div>

<!-- toggle btn for phone/tablet view -->
<button
	onclick={togglePanel}
	aria-label="搜索文章"
	id="search-switch"
	class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-90"
>
	<Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div
	id="search-panel"
	class="float-panel float-panel-closed absolute md:w-120 top-20 left-4 md:left-[unset] right-4 z-50 search-panel shadow-2xl rounded-2xl p-2"
>
	<!-- search bar inside panel for phone/tablet -->
	<div
		id="search-bar-inside"
		class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/4 hover:bg-black/6 focus-within:bg-black/6
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  "
	>
		<Icon
			icon="material-symbols:search"
			class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"
		></Icon>
		<input
			placeholder={i18n(I18nKey.search)}
			bind:value={keywordMobile}
            onfocus={() => { keywordDesktop = ""; }}
			class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
		/>
	</div>
	<!-- search results -->
	{#each result as item}
		<a
			href={item.url}
			onclick={(e) => handleResultClick(e, item.url)}
			class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
       rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active)"
		>
			<div
				class="transition text-90 inline-flex font-bold group-hover:text-(--primary)"
			>
				{item.meta.title}<Icon
					icon="fa7-solid:chevron-right"
					class="transition text-[0.75rem] translate-x-1 my-auto text-(--primary)"
				></Icon>
			</div>
			<div class="transition text-sm text-50">
				{@html item.excerpt}
			</div>
		</a>
	{/each}
</div>

<style>
	input:focus {
		outline: 0;
	}
	:global(.search-panel) {
		max-height: calc(100vh - 100px);
		overflow-y: auto;
	}
</style>

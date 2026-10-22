export const blogSections = [
	{
		slug: "projects",
		name: "项目展示",
		symbol: "⚙",
		description: "已完成的实验、成果动图与实现记录",
		color: "blue",
	},
	{
		slug: "electrical-design",
		name: "电气设计",
		symbol: "⏚",
		description: "电路图、元件选型与 EPLAN 学习",
		color: "blue",
	},
	{
		slug: "plc",
		name: "PLC",
		symbol: "⌘",
		description: "编程基础、控制逻辑与通信实践",
		color: "blue",
	},
	{
		slug: "hmi",
		name: "上位机",
		symbol: "▤",
		description: "HMI、WinCC、报警、趋势与数据管理",
		color: "blue",
	},
	{
		slug: "vision-robotics",
		name: "视觉与机器人",
		symbol: "◎",
		description: "机器视觉、机器人与运动控制的学习记录",
		color: "blue",
	},
	{
		slug: "knowledge",
		name: "知识库",
		symbol: "✦",
		description: "学习随笔、资料研读与常用知识索引",
		color: "blue",
	},
];
export function matchesSection(
	post: { id: string; data: { category?: string | null; tags?: string[] } },
	slug: string,
) {
	const category = post.data.category || "";
	const tags = post.data.tags || [];
	if (slug === "projects") return category === "PLC练习项目";
	if (slug === "electrical-design") return /EPLAN|电路|电气设计/.test(category);
	if (slug === "plc") return category.startsWith("PLC");
	if (slug === "hmi")
		return tags.some((tag) => /^(HMI|WinCC|SCADA|上位机)$/i.test(tag));
	if (slug === "vision-robotics")
		return (
			/视觉|机器人/.test(category) ||
			tags.some((tag) => /视觉|机器人/.test(tag))
		);
	if (slug === "knowledge")
		return (
			["学习随笔", "文章与期刊研读", "技能与证书"].includes(category) ||
			tags.includes("知识库")
		);
	return false;
}

export const learningRoadmaps: Record<
	string,
	{ title: string; detail: string }[]
> = {
	"electrical-design": [
		{
			title: "电路识读与元件基础",
			detail:
				"先学习常用电气符号、继电器与接触器控制，练习读懂启停、自锁和互锁电路。",
		},
		{
			title: "选型与保护设计",
			detail:
				"围绕电机负载，逐步学习电源、断路器、接触器、线缆与接地保护的选型思路。",
		},
		{
			title: "EPLAN 项目练习",
			detail:
				"从一个电机控制小项目开始，练习原理图、端子排、线号与元件清单，再整理设计和检查记录。",
		},
	],
	"vision-robotics": [
		{
			title: "视觉成像与图像处理",
			detail:
				"先理解相机、镜头、光源与标定，再练习图像采集、阈值分割、定位和尺寸测量。",
		},
		{
			title: "机器人基础与运动控制",
			detail: "学习坐标系、示教、轨迹与基础运动指令，用仿真练习简单搬运流程。",
		},
		{
			title: "视觉与 PLC 联动",
			detail:
				"尝试将识别结果传给 PLC，逐步完成握手信号、定位分拣和异常处理的小项目。",
		},
	],
};
export function getLearningRoadmap(slug: string) {
	return (
		learningRoadmaps[slug] || [
			{
				title: "梳理基础",
				detail: "从这个方向的基本概念和常用工具开始，整理需要解决的问题。",
			},
			{
				title: "完成小练习",
				detail: "选一个范围明确的小任务，记录实现过程和验证结果。",
			},
			{
				title: "整理与复盘",
				detail: "将截图、成果和踩坑整理成文章，再逐步扩展到完整项目。",
			},
		]
	);
}

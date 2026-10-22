import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "/avatar.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "叶工",
	bio: "记录自动化学习与项目实践",
	typewriter: {
		enable: false, // 固定显示个人介绍
		speed: 80, // 打字速度（毫秒）
	},
	links: [],
};

---
title: D11｜EPLAN 3D 连接点与单线布线验证
published: 2026-11-10
author: 叶工
category: 电气设计
lang: zh-CN
tags: [EPLAN, Pro Panel, 3D连接点, 布线]
description: 给三极断路器定义六个 3D 连接点，验证测试宏回插，再用一根线排查并验证布线路径。
draft: false
---

上一课我已经把自制的断路器 3D 宏装上导轨。这次我继续用 A9F74316 做练习，目标是让 EPLAN 从多线原理图找到三维端点，并生成一根可核对的走线。

## 先验收一根线

我最后用断路器 Q1 的 1 号进线口接到 UT 4 端子，布线管理器显示 **已放置，0.452 m**。这是本次练习路径的计算长度。

![布线管理器显示测试线已放置，长度为 0.452 m](/images/posts/d11-eplan-3d-routing/result.png)

## 正视图对齐，为什么斜视图却悬空

我先在宏项目里用图形方式建立 1 号连接点。本地连接点表已出现记录，正视看也对齐了，但旋转视角后，箭头根部明显离开了端子。我保留朝 +Y 的方向，用侧视检查进线口深度，重新定位箭头根部。

![第一次定义的连接点在斜视图中悬空](/images/posts/d11-eplan-3d-routing/offset.png)

我用同样的方法完成了六点。上排 1、3、5 朝 +Y，下排 2、4、6 朝 −Y，横向间距 18 mm。表格里的六个点使用同一深度 Z = 40 mm。我用正视检查横向位置，再用侧视检查深度与方向。

![六点本地连接点排列样式](/images/posts/d11-eplan-3d-routing/points.png)

## 回插测试宏，对齐原理图端点

我把模型另存为 `LAB_A9F74316_3D_TEST.ema`，从插入中心回插到普通项目，六个点和方向都带了过来。随后我让原理图和 3D 放置使用相同的完整设备标识符 `=D5+AP-Q1`。

![普通项目中回插后的六个连接点](/images/posts/d11-eplan-3d-routing/reinsert.png)

对端我选了 UT 4（`PXC.3044102`）。一开始我在布局空间树里找 X1，那里显示的是安装板、导轨和已放置对象。切到 3D 安装布局导航器后，我才找到原理图里的 X1:1，并完成放置。连接导航器显示的完整连接为 `=D5+AP-Q1:1 ↔ =D5+AP-X1:1:2`，X1 后的第一个 1 是端子编号，最后的 2 是接线侧。

![导航器里的 X1 端子及其部件](/images/posts/d11-eplan-3d-routing/terminal.png)

## 两端都有了，为什么仍无法布线

第一次执行布线时，管理器已列出这根线的两端，但报 `026114`，提示未找到布线路径。导轨提供器件安装位置，我还需要给导线建立可用的布线路径。补上路径后，我只对这一行重新布线，再核对 3D 走线和管理器里的长度。

![第一次布线失败，检查编号 026114](/images/posts/d11-eplan-3d-routing/failure.png)

![补上路径后的 3D 走线](/images/posts/d11-eplan-3d-routing/route.png)

这次我验证了本地连接点能随宏回插，以及一根连接能从原理图走到 3D。把本地连接点整理成部件库可复用的连接点排列样式，留作后续练习。

[上一课 D10](/posts/d10-eplan-3d-rail-macro/) · [EPLAN 2026 官方布线说明](https://www.eplan.help/en-us/Infoportal/Content/Plattform/2026/Content/htm/routinggui_h_verlegen.htm)


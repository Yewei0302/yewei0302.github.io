---
title: D12｜EPLAN 连接点排列样式归库与三极布线
published: 2026-11-11
author: 叶工
category: 电气设计
lang: zh-CN
tags: [EPLAN, Pro Panel, 部件库, 连接点排列样式, 布线]
description: 将三极断路器的六个本地连接点存入部件库，分配给练习零部件，并对照两次 3D 走线结果。
draft: false
---

上一课我用一根测试线验证了自制 3D 宏的接线点。这次我把六个本地连接点存进部件库，再用上下两组端子验证三极断路器的走线。

![三极断路器与上下端子排之间的直角走线](/images/posts/d12-eplan-connection-point-pattern/final-routing.png)

## 把六个本地连接点存进部件库

我在 3D 布局空间里选中断路器本体，右键执行「生成连接点排列样式」。EPLAN 在 `WKT_Parts` 中生成一条样式，我把它命名为 `LAB_A9F74316_CP`。

![在布局空间右键生成连接点排列样式](/images/posts/d12-eplan-connection-point-pattern/generate.png)

我打开新样式的「连接点」页核对数据。上排是 1、3、5，Y 坐标为 83 mm，方向为 +Y。下排是 2、4、6，Y 坐标为 12 mm，方向为 −Y。两排的 X 坐标都是 8.60、26.60、44.60 mm，Z 坐标都是 40 mm。这组坐标对应这次自制宏的几何基准。

![部件库中保存的六个连接点](/images/posts/d12-eplan-connection-point-pattern/six-points.png)

## 在零部件记录里分配样式

我最初一直选着 `LAB_A9F74316_CP`，右侧只能看到样式自身的属性。切到练习零部件 `LAB.A9F74316` 后，我在「属性」页的「数据」分组找到「连接点排列样式」，点数值栏的选择按钮，选中 `LAB_A9F74316_CP`。这次 X、Y 偏移都设为 0.00 mm。

![练习零部件已填写连接点排列样式](/images/posts/d12-eplan-connection-point-pattern/assignment.png)

复用时，图形宏要和这组坐标配套。要单独确认部件库供点，可以在新放置件上查看「连接点排列样式」，检查本地选项关闭时是否仍有六个点。本次截图记录了部件的样式分配和最终走线，未记录这个选项在新放置件上的状态。

## 从弯线到直角走线

第一次从正面看，导线在横向错开的端子排与断路器之间呈 S 形。端子方向和横向位移都影响曲线形状，单凭外观只能看出它像自由布线。要确认导线实际走过哪些路径段，可以查看布线连接属性里的「布线路径」。

![第一次查看时，导线在端子排和断路器之间呈弧线](/images/posts/d12-eplan-connection-point-pattern/curved-routing.png)

最终截图里，上下各三根导线都从端子沿竖直方向伸出，再经水平段转到断路器。这次练习完成了样式生成、部件分配和三极走线的图形核对。

[上一课 D11](/posts/d11-eplan-3d-routing/) · [EPLAN 2026 官方帮助｜将本地连接点排列样式转入部件管理](https://www.eplan.help/en-us/Infoportal/Content/Plattform/2026/Content/htm/cabinetgui_h_anschlussbildnachartvw.htm)


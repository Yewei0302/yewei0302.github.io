---
title: D9｜同一份 EPLAN 窗口宏的多线与 2D 安装板布局
published: 2026-11-10
author: 叶工
category: 电气设计
lang: zh-CN
tags: [EPLAN, 电气设计, 窗口宏, DXF, 2D安装板布局]
description: 用厂家正视 DXF 和已有三极原理图生成同一份 EMA，验证表达类型、页面比例与图形分组。
draft: false
---

这次我想让一个断路器宏有两种画法。在多线页放三极原理图，在安装板布局页放厂家正视线稿。我沿用已有的 `LAB_QF_3P` 多线图，另做一份 2D 布局表达，最后都存到 `LAB_A9F74316.ema`。

## 按 1:1 导入厂家正视线稿

我先按施耐德产品页的本体尺寸画了一个 **54 × 85 mm** 的参照矩形。第一次导入 DXF，EPLAN 自动给出 **2.89** 的缩放比例。我改用 **1:1**，水平和垂直系数都是 **1**。导入窗口此时显示整个 CAD 图形边界为 **53.10 × 95.40 mm**。

![DXF 导入选择 1:1](/images/posts/d9-eplan-2d-layout-macro/import-scale.png)

并排对照时，线稿上下还有凸出的轮廓。我把厂家标注的本体尺寸和 DXF 的整体边界分别记录，保留了原比例的正视线稿作为布局图形。插入普通项目后，我按相同范围复核了尺寸。 [施耐德 A9F74316 产品尺寸](https://eshop.se.com/sg/miniature-circuit-breaker-mcb-acti9-ic60n-3p-16a-c-curve-6000a-iec-en-60898-1-10ka-iec-en-60947-2-a9f74316.html)

![厂家线稿与本体参照矩形并排](/images/posts/d9-eplan-2d-layout-macro/outline-comparison.png)

## 同名宏，两种表达都用 A

我给三极原理图和正视线稿分别加宏边框，文件名都填 `LAB_A9F74316.ema`。原理图选「多线」，线稿选「安装板布局」，两边的变量都用 A。生成后，插入中心在同一个文件下列出两种表达。

![同一窗口宏下的多线与安装板布局表达](/images/posts/d9-eplan-2d-layout-macro/representations.png)

我在普通项目分别插入。多线页显示 `-Q1` 和六个连接点，布局页显示厂家正视线稿。本次是从「窗口宏/符号宏」插入，验收到图形、功能和尺寸。部件绑定及通过设备导航器放置留作后续验证。

![多线 A 插入后的三极功能](/images/posts/d9-eplan-2d-layout-macro/multiline.png)

![安装板布局 A 插入后的正视线稿](/images/posts/d9-eplan-2d-layout-macro/layout.png)

## 图框容纳范围和线段分组

线稿按原尺寸插进来后，在图框里占的空间比我预想的大。我调整了目标安装板布局页的「比例」，让同一图框能表示更大的实际布局范围。页面比例改变的是图形相对图框的大小，器件尺寸仍按实际测量值记录。 [EPLAN 页面比例说明](https://eplan.help/en-us/Infoportal/Content/Plattform/2.9/Content/htm/gededitgui_k_seitenmassstab.htm)

接着我发现，插入后的外壳线可以单独点选。DXF 进来是一组线条对象，宏边框决定哪些对象一起保存。要整只选中，可以给已有实例逐只成组。源宏也可以在生成前用「组合宏边框和它包含的对象」，生成后用单击外壳线的方式检查是否整只高亮。两只器件贴得近时，我会先确认选区只覆盖一只。 [EPLAN 2026 宏生成前的分组设置](https://www.eplan.help/zh-CN/Infoportal/Content/Plattform/2026/Content/htm/macrosgui_d_makrosvorbereiten.htm)

![点击外壳时单独选中了 DXF 的一条线](/images/posts/d9-eplan-2d-layout-macro/individual-line.png)

## 第五课知识补记

| 元素 | 在这次练习里的用途 |
| --- | --- |
| 线条 | 厂家 DXF 表达正视外形，按 1:1 导入和复测。 |
| 图片 | 可以给部件配置产品照片，供插入中心预览。本次图纸采用线稿。 |
| 文本 | 用来标明型号或说明。需要随设备变化的标识可通过属性排列显示。 |
| 部件放置 | 在普通项目的 2D 布局中承载设备标识和部件引用，可从布局导航器放置已有原理图设备。 |

我原本试过把商品照片直接插进多线图，但图片没有显示，后来决定把照片留给零部件资料。最终验证的是**多线 A 与安装板布局 A**。两种表达各自从同一份 EMA 取出需要的内容。

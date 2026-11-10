---
title: D10｜从厂家 STEP 到 EPLAN 3D 导轨试装
published: 2026-11-10
author: 叶工
category: 电气设计
lang: zh-CN
tags: [EPLAN, Pro Panel, STEP, 3D图形宏, 安装导轨]
description: 导入三极断路器 STEP，定义放置区域和基准点，生成 3D 宏后到普通项目试装，并和厂家宏对照。
draft: false
---

上一课我用正视 DXF 做了 2D 布局。这次沿用施耐德 A9F74316，改用厂家 STEP 简化模型，验证自己生成的 3D 宏能否在普通项目里按预期放到 DIN 导轨上。

## 先把放置数据做进源宏

导入 STEP 后，我从手柄辨认正面，再转到背面和侧面找导轨卡槽。第一次试放时，斜视图看起来像是导轨穿进了壳体。当时仅凭这个角度无法判断折边是正常咬合还是发生穿插。我决定回到宏项目，把放置数据先定义好，再生成宏去普通项目验收。

![导入的厂家 STEP 简化模型](/images/posts/d10-eplan-3d-rail-macro/step.png)

![第一次试放时，从斜视角难以判断折边与壳体的关系](/images/posts/d10-eplan-3d-rail-macro/first-fit.png)

我在源布局空间从背部选定放置区域，再用对象捕捉设置基准点。放置区域决定模型以哪个面及深度贴到目标安装面，基准点决定放置时鼠标抓住哪里。图中的绿色平面和橙色方框分别对应这两项。

![源布局空间里的绿色放置区域和橙色基准点](/images/posts/d10-eplan-3d-rail-macro/placement.png)

我用「主数据 → 宏 → 创建」框选断路器，保存为 LAB_A9F74316_3D.ema，表达类型为「3D 安装布局」，变量为 A。试装用的安装板和导轨另放在普通项目。 [EPLAN 2026 创建 3D 宏](https://www.eplan.help/zh-cn/Infoportal/Content/Plattform/2026/Content/htm/cabinetgui_h_3dmakroerstellen.htm)

![以 3D 安装布局表达保存窗口宏](/images/posts/d10-eplan-3d-rail-macro/save-macro.png)

## 到普通项目检查导轨贴合

我在 D5_部件学习下新建「断路器导轨试装」布局空间，放入安装板和 MWP.TS35-15-200 导轨，再插入自制宏。端视图里，手柄朝外，导轨折边位于背部卡槽处，图中没有明显的壳体穿插。这张图是本次机械放置验收的依据。

![沿导轨长度方向查看自制断路器宏的贴合](/images/posts/d10-eplan-3d-rail-macro/rail-fit.png)

随后我把 A9F75320 的厂家宏放到同一根导轨上，并打开两只对象的「部件放置」属性核对实际来源。

| 对照对象 | 放置属性中的宏 |
| --- | --- |
| 厂家部件 A9F75320 | SE_ACTI9_IC60_3POLE_3D.ema |
| 自制 A9F74316 窗口宏 | LAB_A9F74316_3D.ema |

![同一根导轨上的厂家宏与自制宏](/images/posts/d10-eplan-3d-rail-macro/comparison.png)

![厂家部件放置属性中的宏路径](/images/posts/d10-eplan-3d-rail-macro/factory-property.png)

![自制窗口宏的放置属性与文件名](/images/posts/d10-eplan-3d-rail-macro/lab-property.png)

## 第六课知识补记

- **放置区域、基准点和安装点。** 放置区域用于本体与目标面的定位。基准点用于插入时抓取。安装点则可为附件提供定位位置。
- **连接点与钻孔排列样式。** 录入前先对齐坐标原点和轴向。连接点样式对应接线位置，钻孔样式对应加工位置，分别对照厂家端子资料和安装图。本次验收到导轨试装，端子空间坐标、钻孔和布线留待实操。
- **案例阅读。** 指南附录里的 PDU、模块和阀岛可以用来练习辨认设备归属、接口及图面属性。D7 已用断路器和接触器验证过模块的子件映射，本课增加的是 3D 放置的证据。
- **系列化复用。** 两个型号如果有相同的机械外形和安装接口，可以继续核对是否适合共用图形宏。订货号和电气参数按各自部件维护。本次截图验证了两份不同的宏同轨试装，两个订货号指向同一份宏的测试仍待完成。

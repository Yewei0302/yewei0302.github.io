---
title: D7｜EPLAN 部件组与模块：从设备分配到 BOM 分解
published: 2026-11-09
author: 叶工
category: 电气设计
lang: zh-CN
tags: [EPLAN, 电气设计, 部件组, 模块, BOM]
description: 实测断路器与附件的部件组、断路器与接触器的模块映射，以及部件汇总表的分解前后差异。
draft: false
---

上一课做完三极窗口宏，这次我继续用这段图，分别建了一条部件组和一条模块。两次都用部件汇总表核对数量，模块还多了一步，要看每个子件是否自动分到了对应设备。

## 部件组：断路器和辅助触点各一件

我在 WKT_Parts 里新建了 `LAB_QF_3P_SET`，产品分组设为「电气工程 → 安全设备 → 断路器」。设置前树里显示两级「未定义」，选定分类后记录就归到了断路器分支。

我最后用的是 `SE.A9F75320` 三极断路器和 `SE.A9A26904` iOF 辅助触点，各一件。辅助触点从 Data Portal 导入后，再按完整订货号加进部件组。

分配整组给 `-Q1` 时，冲突窗口提示覆盖连接点代号。部件组前三条断路器模板分别是 1–2、3–4、5–6，第四条是 iOF 转换触点。图里的 Q3 则把三极画成一个六连接点功能。我把连接点代号那一行改为「保留」，确认结果里六个代号都在，再保存整组引用。这一步验证了报表所需的部件分配，设备选择的逐项模板匹配留待另做。

![保留图纸上原有的六个连接点代号](/images/posts/d7-eplan-assembly-module/terminal-conflict.png)

第一次我手动新建了一张「部件汇总表（自动式）」页，只看到了空表。后来从「生成报表」选择部件汇总表，才把项目里的部件数据填进去。

| 部件组报表设置 | 实测结果 |
| --- | --- |
| 不分解 | LAB_QF_3P_SET × 1 |
| 分解 | SE.A9F75320 × 1、SE.A9A26904 × 1 |

![部件组不分解时只显示组编号，数量一套](/images/posts/d7-eplan-assembly-module/assembly-whole.png)

![部件组分解后断路器与辅助触点各一件](/images/posts/d7-eplan-assembly-module/assembly-expanded.png)

## 模块：用设备标识符 ID 分配两台设备

我用 `LAB_QF_KM_MODULE.ema` 保存回路图，模块编号设为 `LAB_QF_KM_MOD`。图里有断路器 Q1、接触器 K1 的线圈和三极主触点。线圈是主功能，主触点和线圈归到同一个接触器。

第一次从插入中心按「设备」放置模块，黑盒有模块编号，断路器和线圈的部件页却都是空的。我回源图把蓝色黑盒拉大，圈住断路器、线圈和触点，再用外层红色宏边框圈住整套内容。我也重新核对了源图的「设备标识符 ID」字段。断路器用 `QF`，接触器线圈和主触点用 `KM`，模块表的两行用相同的 ID 对应各自的部件。

![红色宏边框内的蓝色黑盒圈住全部设备](/images/posts/d7-eplan-assembly-module/module-box.png)

![模块表的 QF 和 KM 对应断路器与接触器](/images/posts/d7-eplan-assembly-module/module-mapping.png)

重新生成宏并插入后，我打开三处部件属性。黑盒是 `LAB_QF_KM_MOD × 1`，断路器是 `SE.A9F75320 × 1`，接触器线圈是 `SE.LC1D09BD × 1`。图上也带出了断路器的 20 A 和线圈的 24 V DC。

![重新插入的模块带出了断路器和线圈的参数](/images/posts/d7-eplan-assembly-module/module-inserted.png)

| 模块报表设置 | 实测结果 |
| --- | --- |
| 不分解 | LAB_QF_KM_MOD × 1 |
| 分解 | SE.A9F75320 × 1、SE.LC1D09BD × 1 |

![模块不分解时显示模块编号，数量一套](/images/posts/d7-eplan-assembly-module/module-whole.png)

![模块分解后断路器和接触器各一件](/images/posts/d7-eplan-assembly-module/module-expanded.png)

我以后核对模块会先打开设备属性，看子件到底分到了哪里，再看汇总表的分解规则。这样遇到报表只显示一套时，可以用设备属性和报表设置分别查证。

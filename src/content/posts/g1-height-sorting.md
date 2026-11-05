---
author: 叶工
category: PLC练习项目
title: "G1｜箱体高度自动分拣系统：LAD 控制与 Factory I/O 联调"
description: 使用LAD完成箱体高度识别、三出口分拣、工位互锁与自动循环，记录Factory I/O联调与单箱停住问题的排查；HMI留待后续完善。
published: 2026-11-05
lang: zh-CN
tags: [PLC, S7-1500, LAD, Factory I/O, PLCSIM Advanced, 分拣, 顺序控制]
draft: false
---

本次使用 TIA Portal V19、S7-1500、PLCSIM Advanced 和 Factory I/O，完成箱体高度识别及三出口分拣。控制程序采用 LAD，先跑通现场动作与循环，HMI 留到后续完善。

## 实际运行效果

经过现场布局和程序调整，系统已经跑通自动进料、箱体识别、对应工位推料及后续进料循环。下面保留实际运行录屏；文件原名为“轴定位.gif”，内容为本次箱体分拣场景。

![箱体分拣运行](/images/posts/g1-height-sorting/g1-running.webp)

## 分拣场景

![分拣场景](/images/posts/g1-height-sorting/scene.png)

主输送线串联三个推料工位，各工位配置独立的出口输送带。入口通过不同高度的传感器采集箱体特征。

## 高度识别与类别保存

![高度识别与类别保存](/images/posts/g1-height-sorting/classification.png)

识别过程中先记录低箱，再根据中、高层检测信号升级类别。箱子离开检测区后保留结果，供下游工位判断。

## 推料动作与工位互锁

![推料动作与工位互锁](/images/posts/g1-height-sorting/push.png)

高、中、低箱分别使用独立步骤变量。推出和缩回期间停止对应工位的主输送带，缩回到位后恢复输送。

## Factory I/O 驱动与 I/O 映射

![Factory I/O 驱动与 I/O 映射](/images/posts/g1-height-sorting/mapping.png)

通过 S7-PLCSIM 驱动连接 G1_PLC 实例，将场景传感器和执行器逐项映射到 PLC 输入、输出地址。

## 启停与在线监控

![启停与在线监控](/images/posts/g1-height-sorting/watch.png)

通过监控表检查启动自锁、停止输出和推杆原位反馈，再进行箱体分拣联调。

## 从单箱测试到自动循环

最初单箱调试时，上一箱的类别和步骤没有自动释放，导致第二箱无法继续处理。后续调整了进料与本箱完成后的状态衔接，改为自动循环。过程截图记录搭建与联调阶段，最终运行效果以顶部动图为准。

本阶段尚未加入 HMI。最终程序细节以调整后的博图工程为准。

网页动图采用高清动画 WebP，保留原片全部106帧、7.02秒时序与循环设置；原始GIF完整保存在源码的`media-originals/g1-height-sorting/g1-running.gif`中。

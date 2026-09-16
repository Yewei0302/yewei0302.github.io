---
title: C1进阶｜S7-1500 GRAPH交通灯顺控：步骤、转换条件与LAD外围控制
published: 2026-09-16
description: 在已完成的LAD状态机基础上，使用TIA Portal GRAPH重构红绿黄正常顺控，并以LAD完成夜间闪烁、急停和防自动重启。
image: ''
tags:
  - 西门子PLC
  - S7-1500
  - GRAPH
  - LAD
  - 顺序控制
  - TIA Portal
  - PLCSIM
category: PLC项目练习
draft: false
lang: zh-CN
---

## 项目定位

上一篇C1使用纯LAD梯形图，通过`iStepNo = 10/20/30`、TON和MOVE指令实现交通灯状态机。本篇保留相同的I/O和控制要求，但把正常红绿黄流程改为TIA Portal的GRAPH顺控器，再用一个LAD外围控制FB处理启停、夜间闪烁、急停与最终输出。

[上一篇：C1｜S7-1500 LAD交通灯状态机](/posts/plc-projects/c1_lad交通灯状态机/)

| 对比项 | 上一篇LAD版 | 本篇GRAPH版 |
|---|---|---|
| 步骤记录 | `iStepNo`整数变量 | GRAPH步骤激活状态 |
| 计时方式 | 每步一个TON | 使用`Step.T`步骤时间 |
| 步骤切换 | 比较 + MOVE | GRAPH转换条件 |
| 正常流程 | 多个LAD程序段 | 图形化顺控图 |
| 夜间与急停 | 同一个LAD FB | 独立LAD外围控制FB |

> 本项目仍为纯软件仿真。文中“急停”是普通PLC程序逻辑；真实设备必须配合安全继电器、安全PLC或符合要求的硬接线。

## 一、项目环境与目标

| 项目 | 配置 |
|---|---|
| 编程软件 | TIA Portal |
| PLC | S7-1500 CPU 1511-1 PN，固件V2.9 |
| 仿真软件 | 标准版S7-PLCSIM |
| 编程语言 | GRAPH + LAD |
| GRAPH块 | `FB_C1_TrafficLightSeq` / `DB_C1_TrafficLightSeq` |
| 外围控制块 | `FB_C1_TrafficLightPeripheral` / `DB_C1_TrafficLightPeripheral` |
| 正常循环 | 红灯5秒 → 绿灯5秒 → 黄灯2秒 |
| 夜间模式 | 只有黄灯按500 ms半周期闪烁 |
| 急停 | 三灯立即熄灭，解除后不自动重启 |

I/O地址与LAD版保持一致，便于对照测试：

| 地址 | 变量 | 作用 |
|---|---|---|
| I0.0 | `xSystemEnableCmd` | 系统运行允许 |
| I0.1 | `xNightModeSel` | 夜间模式选择 |
| I0.2 | `xEmergencyStopSts` | 急停状态 |
| Q0.0 | `xRedLightOut` | 红灯输出 |
| Q0.1 | `xGreenLightOut` | 绿灯输出 |
| Q0.2 | `xYellowLightOut` | 黄灯输出 |

CPU 1511-1 PN本体没有集成数字量I/O，所以编译时出现“所组态的硬件中没有所用到的输入或输出”警告。本项目通过PLCSIM直接修改I0.0～I0.2并监视Q0.0～Q0.2，不影响测试。

## 二、程序架构

程序被拆成两个功能块：

```text
FB_C1_TrafficLightSeq（GRAPH）
└─ 只负责Init、红灯、绿灯、黄灯步骤及转换条件

FB_C1_TrafficLightPeripheral（LAD）
├─ 启动上升沿与运行状态锁存
├─ 夜间黄灯闪烁
├─ 急停和GRAPH初始化命令
└─ 红、绿、黄灯最终输出联锁
```

这种分层后，GRAPH可以专注于“顺序”，LAD可以专注于“模式与安全联锁”。

## 三、GRAPH顺控器设计

### 1. 步骤结构

顺控器共设置四个步骤：

| 步骤 | 名称 | 作用 |
|---|---|---|
| S1 | `Init` | 初始化并等待启动条件 |
| S2 | `RedLight` | 红灯步骤，运行5秒 |
| S3 | `GreenLight` | 绿灯步骤，运行5秒 |
| S4 | `YellowLight` | 黄灯步骤，运行2秒 |

T4不是回到Init，而是跳转到S2，因此正常运行时会持续执行“红 → 绿 → 黄 → 红”。

![GRAPH步骤结构](/images/posts/c1-graph-traffic-light/01-graph-sequence.png)

### 2. 转换条件

| 转换 | 条件 | 说明 |
|---|---|---|
| T1 `StartToRed` | 运行允许 AND 非夜间 AND 非急停 | Init进入红灯步骤 |
| T2 `RedToGreen` | `RedLight.T >= tRedTimeSP` | 红灯到时进入绿灯 |
| T3 `GreenToYellow` | `GreenLight.T >= tGreenTimeSP` | 绿灯到时进入黄灯 |
| T4 `YellowToRed` | `YellowLight.T >= tYellowTimeSP` | 黄灯到时返回红灯 |

![GRAPH转换条件](/images/posts/c1-graph-traffic-light/02-transition-conditions.png)

GRAPH步骤自带运行时间`.T`，因此不需要像LAD版那样为红、绿、黄分别建立TON。这是本次重构最重要的区别。

### 3. 步骤动作

四个步骤都使用`N`限定符：步骤激活时对应状态为TRUE，离开步骤后自动恢复FALSE。

| 步骤 | 动作变量 |
|---|---|
| Init | `xInitStepActiveSts` |
| RedLight | `xRedStepActiveSts` |
| GreenLight | `xGreenStepActiveSts` |
| YellowLight | `xYellowStepActiveSts` |

![GRAPH步骤动作](/images/posts/c1-graph-traffic-light/03-step-actions.png)

GRAPH只输出“当前是哪一步”，不直接写Q0.0～Q0.2。最终灯光输出交给外围控制FB，避免多处同时写同一输出。

## 四、LAD外围控制FB

`FB_C1_TrafficLightPeripheral`的输入包含三个外部命令、三个GRAPH步骤状态和闪烁时间；输出包含系统运行状态、GRAPH初始化命令和三路灯光命令。

![LAD外围控制FB接口](/images/posts/c1-graph-traffic-light/04-peripheral-interface.png)

### 1. 启动、停止与防自动重启

I0.0先经过`R_TRIG`产生上升沿，再置位`xSystemRunningSts`。当I0.0断开或急停触发时，运行状态被复位。

![启动上升沿与运行锁存](/images/posts/c1-graph-traffic-light/05-start-latch.png)

急停解除后，如果I0.0仍为TRUE，由于没有新的上升沿，系统保持停止。必须将I0.0先切回FALSE，再切到TRUE才能重新启动。

当系统停止、进入夜间模式或急停触发时，`xGraphInitCmd`为TRUE，通过GRAPH块的`INIT_SQ`将顺控器送回Init步骤。

![停止复位与GRAPH初始化命令](/images/posts/c1-graph-traffic-light/06-stop-init.png)

### 2. 夜间黄灯闪烁

夜间闪烁没有放入GRAPH，而是保留在LAD外围控制中。两个TON分别完成熄灭阶段和点亮阶段的500 ms计时：

```text
xNightBlinkSts = FALSE
→ tonBlinkOnDelay计时
→ 置位xNightBlinkSts
→ 黄灯点亮
→ tonBlinkOffDelay计时
→ 复位xNightBlinkSts
→ 黄灯熄灭
```

![夜间闪烁复位与熄灭阶段](/images/posts/c1-graph-traffic-light/07-night-blink-a.png)

![夜间闪烁点亮阶段](/images/posts/c1-graph-traffic-light/08-night-blink-b.png)

### 3. 最终输出联锁

灯光命令不只取决于GRAPH步骤，还必须同时满足系统运行、模式和急停条件：

```text
红灯 = 运行 AND 非夜间 AND 非急停 AND 红灯步骤激活
绿灯 = 运行 AND 非夜间 AND 非急停 AND 绿灯步骤激活
黄灯 = 运行 AND 非急停 AND
       （正常模式下黄灯步骤激活 OR 夜间模式下闪烁状态）
```

![GRAPH红灯步骤输出控制](/images/posts/c1-graph-traffic-light/09-output-red.png)

![GRAPH绿灯与正常/夜间黄灯输出控制](/images/posts/c1-graph-traffic-light/10-output-green-yellow.png)

## 五、OB1互连

OB1中先调用GRAPH顺控FB，再调用LAD外围控制FB。

GRAPH调用的两个关键连接为：

- `INIT_SQ := DB_C1_TrafficLightPeripheral.xGraphInitCmd`
- `xSystemEnableCmd := DB_C1_TrafficLightPeripheral.xSystemRunningSts`

![OB1调用GRAPH顺控FB](/images/posts/c1-graph-traffic-light/11-ob1-graph-call.png)

外围控制FB读取GRAPH背景数据块中的红、绿、黄步骤状态，然后把最终命令连接到Q0.0～Q0.2。

![OB1调用LAD外围控制FB](/images/posts/c1-graph-traffic-light/12-ob1-peripheral-call.png)

两个FB之间存在一个PLC扫描周期的状态传递延迟，但对秒级交通灯顺控没有实际影响。急停发生时，外围控制FB仍会在当前扫描周期直接封锁三路输出。

## 六、PLCSIM功能验证

本次将正常循环、夜间模式、急停和恢复过程录制在同一段动图中。

![GRAPH版交通灯全功能测试](/images/posts/c1-graph-traffic-light/13-final-demo.gif)

验证结果：

- I0.0产生上升沿后，红灯、绿灯、黄灯按5秒、5秒、2秒循环；
- 任意时刻只有一盏交通灯输出为TRUE；
- 夜间模式下红灯和绿灯熄灭，黄灯按500 ms半周期闪烁；
- 退出夜间模式后，GRAPH从红灯步骤重新开始；
- 急停触发时三路输出立即变为FALSE；
- 急停解除后系统不自动重启，必须重新产生运行允许上升沿；
- 程序编译0错误，仅有CPU未配置实体I/O模块的常规警告。

## 七、两种实现方式的选择

LAD步序号状态机和GRAPH并不是谁完全替代谁。

- 步骤较少、项目要求全部使用LAD、需要自由处理特殊跳转时，`iStepNo + MOVE + TON`仍然很实用。
- 步骤较多、工艺流程需要频繁查看与调试时，GRAPH更直观。
- 对于实际项目，可以像本篇一样组合使用：GRAPH管理工艺步骤，LAD处理启停、联锁、模式切换和最终输出。

## 总结

这次并不是简单重复C1，而是用另一种程序结构重构同一控制任务。通过对比，可以清楚看到：LAD状态机需要程序员自己管理步序号、定时器和跳转；GRAPH则把这些内容直接变成“步骤—转换—动作”图。

本次重点收获：

1. 掌握GRAPH步骤、转换条件和`N`限定符；
2. 掌握使用`Step.T`完成步骤计时；
3. 理解`INIT_SQ`如何在停止、夜间和急停时复位顺控器；
4. 学会将GRAPH工艺顺控与LAD外围联锁分层；
5. 完成正常循环、夜间闪烁、急停和防自动重启的联合仿真。

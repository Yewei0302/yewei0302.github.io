---
title: C1｜S7-1500 LAD交通灯状态机：步序循环、夜间闪烁与急停
published: 2026-09-15
description: 使用TIA Portal、S7-1500和标准PLCSIM，以LAD梯形图完成红绿黄步序循环、夜间黄灯闪烁、急停处理和防自动重启。
image: ''
tags:
  - 西门子PLC
  - S7-1500
  - LAD
  - 状态机
  - 顺序控制
  - TIA Portal
  - PLCSIM
category: PLC项目练习
draft: false
lang: zh-CN
---

## 项目说明

完成B2、B3恒温PID项目后，学习路线从单回路控制进入顺序控制。本次C1项目使用LAD梯形图编写一个交通灯状态机，实现红、绿、黄三步定时循环，并加入夜间黄灯闪烁、急停和防止急停解除后自动重启。

交通灯本身并不复杂，真正需要掌握的是：如何把一个完整工艺拆成步骤、如何记录当前步骤，以及如何根据转换条件进入下一步。这套结构后续可以迁移到输送、灌装、包装等非标自动化流程。

> 本项目全部使用软件仿真。文中的急停是普通PLC程序逻辑，真实设备的急停必须配合安全继电器、安全PLC或符合要求的硬接线。

## 一、项目环境

| 项目 | 配置 |
|---|---|
| 编程软件 | TIA Portal |
| PLC | S7-1500 CPU 1511-1 PN，固件V2.9 |
| 仿真软件 | 标准版S7-PLCSIM |
| 编程语言 | LAD梯形图 |
| 核心方法 | 步序号 + 比较指令 + MOVE + TON |
| 项目名称 | C1_TrafficLight_StateMachine |
| 控制块 | FB_C1_TrafficLightCtrl |

CPU 1511-1 PN本体没有集成数字量I/O，因此编译时出现“所组态的硬件中没有所用到的输入或输出”警告。本项目使用PLCSIM操作I0.0～I0.2并监视Q0.0～Q0.2，不影响纯软件仿真。

## 二、控制目标

项目包含三种运行情况：

| 运行情况 | 控制结果 |
|---|---|
| 正常模式 | 红灯5秒 → 绿灯5秒 → 黄灯2秒 → 返回红灯 |
| 夜间模式 | 红灯、绿灯熄灭，黄灯每500 ms切换一次亮灭状态 |
| 急停 | 三盏灯立即熄灭，运行状态和正常步序复位 |

I/O分配如下：

| 地址 | 变量名 | 含义 |
|---|---|---|
| I0.0 | `xSystemEnableCmd` | 系统运行允许开关 |
| I0.1 | `xNightModeSel` | 夜间闪烁模式选择 |
| I0.2 | `xEmergencyStopSts` | 急停状态，1表示触发 |
| Q0.0 | `xRedLightOut` | 红灯实际输出 |
| Q0.1 | `xGreenLightOut` | 绿灯实际输出 |
| Q0.2 | `xYellowLightOut` | 黄灯实际输出 |

## 三、状态机原理

本项目使用`iStepNo`记录当前状态：

| iStepNo | 当前状态 | 执行动作 |
|---:|---|---|
| 0 | 停止/初始化 | 三盏灯熄灭，等待启动 |
| 10 | 红灯步骤 | 红灯亮，红灯TON计时 |
| 20 | 绿灯步骤 | 绿灯亮，绿灯TON计时 |
| 30 | 黄灯步骤 | 黄灯亮，黄灯TON计时 |

使用10、20、30而不是1、2、3，是为了以后方便插入新的步骤。例如，需要在红灯和绿灯之间增加准备步骤时，可以直接使用15。

正常步序关系为：

```text
iStepNo = 0
    ↓ 系统启动
iStepNo = 10（红灯5秒）
    ↓ 红灯计时完成
iStepNo = 20（绿灯5秒）
    ↓ 绿灯计时完成
iStepNo = 30（黄灯2秒）
    ↓ 黄灯计时完成
iStepNo = 10，开始下一轮
```

每个TON只在自己的步骤中运行。步序切换后，原步骤的启动条件变为FALSE，对应TON自动复位。

## 四、FB接口设计

`FB_C1_TrafficLightCtrl`的输入包含运行允许、夜间模式、急停以及四个时间设定值；输出包含运行状态、三盏灯的命令和当前步序号。变量继续采用数据类型小写前缀，并填写中文注释。

![FB接口变量](/images/posts/c1-traffic-light/01-fb-interface.png)

主要参数：

| 变量名 | 类型 | 默认值 | 作用 |
|---|---|---:|---|
| `tRedTimeSP` | Time | T#5s | 红灯运行时间 |
| `tGreenTimeSP` | Time | T#5s | 绿灯运行时间 |
| `tYellowTimeSP` | Time | T#2s | 黄灯运行时间 |
| `tBlinkTimeSP` | Time | T#500ms | 黄灯闪烁半周期 |
| `xNightBlinkSts` | Bool | false | 当前夜间闪烁阶段 |
| `iStepNo` | Int | 0 | 当前步序号 |

## 五、启动、停止与急停处理

运行允许命令先经过`R_TRIG`上升沿检测，再置位`xSystemRunningSts`。系统运行允许关闭或急停触发时，立即复位运行状态。

![启动停止及急停逻辑](/images/posts/c1-traffic-light/02-start-stop-estop.png)

这里没有直接使用运行开关的电平启动系统，而是使用上升沿，目的是防止急停解除后自动重启：

```text
正常启动：I0.0由0变1 → 产生上升沿 → 系统运行
急停触发：运行状态复位
急停解除：I0.0仍为1，但没有新上升沿 → 系统保持停止
重新启动：I0.0先回到0，再切换到1
```

控制优先级为：

```text
急停（最高）→ 夜间模式 → 正常循环 → 停止等待
```

## 六、正常步序控制

系统停止或进入夜间模式时，MOVE指令把0写入`iStepNo`。系统运行、未选择夜间模式且当前步序为0时，再把10写入`iStepNo`，从红灯步骤开始。

步序10使用`tonRedStep`计时，完成后将步序切换为20：

![步序初始化及红灯步骤](/images/posts/c1-traffic-light/03-step-red.png)

步序20使用`tonGreenStep`计时，完成后切换为30；步序30使用`tonYellowStep`计时，完成后重新写入10：

![绿灯和黄灯步骤](/images/posts/c1-traffic-light/04-step-green-yellow.png)

三步逻辑结构相同：

```text
判断当前步序
→ 启动本步骤TON
→ TON.Q变为TRUE
→ MOVE写入下一步序号
```

这样编写的优点是每个步骤的动作和转换条件清晰。以后扩展复杂流程时，只需要继续增加步序和转换条件。

## 七、夜间黄灯闪烁

进入夜间模式后，正常步序复位为0。两个TON分别负责熄灭阶段和点亮阶段：

```text
xNightBlinkSts = FALSE
→ 熄灭计时500 ms
→ 置位xNightBlinkSts
→ 黄灯点亮
→ 点亮计时500 ms
→ 复位xNightBlinkSts
→ 黄灯熄灭并重复循环
```

![夜间黄灯闪烁逻辑](/images/posts/c1-traffic-light/05-night-blink.png)

退出夜间模式、系统停止或急停触发时，`xNightBlinkSts`都会被复位，避免再次进入夜间模式时继承上一次的闪烁状态。

## 八、灯光输出控制

三个输出命令统一放在状态机之后生成：

```text
红灯：运行 AND 非夜间 AND 非急停 AND iStepNo=10
绿灯：运行 AND 非夜间 AND 非急停 AND iStepNo=20
黄灯：运行 AND 非急停 AND
      （正常模式下iStepNo=30 OR 夜间模式下xNightBlinkSts）
```

![红绿黄输出控制](/images/posts/c1-traffic-light/06-output-control.png)

这种写法把“步序如何跳转”和“当前步骤输出什么”分开，调试时更容易定位问题。

## 九、OB1调用

在`Main [OB1]`中周期调用`FB_C1_TrafficLightCtrl`，背景数据块为`DB_C1_TrafficLightCtrl`。输入连接I0.0～I0.2，时间参数连接常量，三个输出命令分别连接Q0.0～Q0.2。

![OB1调用及编译结果](/images/posts/c1-traffic-light/07-ob1-call.png)

程序编译结果为0错误。一个硬件I/O警告来自CPU未配置实体DI/DO模块，对本次PLCSIM测试没有影响。

## 十、仿真测试

### 测试一：正常循环

保持夜间模式和急停为FALSE，将`xSystemEnableCmd`从FALSE切换为TRUE。三盏灯按照红→绿→黄→红的顺序循环，任意时刻只有一盏灯点亮。

![正常循环测试](/images/posts/c1-traffic-light/08-test-normal.gif)

### 测试二：夜间模式

系统运行时将`xNightModeSel`切换为TRUE，正常步序回到0，红灯和绿灯熄灭，黄灯按照500 ms半周期闪烁。

![夜间模式测试](/images/posts/c1-traffic-light/09-test-night.gif)

### 测试三：急停与防自动重启

运行期间触发`xEmergencyStopSts`，三路输出立即变为FALSE。解除急停后，即使运行允许仍为TRUE，系统也不会自动启动；运行开关重新产生上升沿后才能再次运行。

![急停测试](/images/posts/c1-traffic-light/10-test-estop.gif)

## 十一、项目验收结果

- 红灯、绿灯、黄灯定时顺序正确；
- 步序10→20→30→10持续循环；
- 夜间模式下只闪烁黄灯；
- 退出夜间模式后从红灯步骤重新开始；
- 急停触发后三路输出立即关闭；
- 急停解除后不会自动重启；
- 程序段标题和变量均有中文注释；
- 全部控制逻辑使用LAD完成；
- PLCSIM三项测试通过。

## 总结

通过C1项目，我第一次用完整的LAD程序实现了步序状态机。与之前的单回路PID不同，本项目开始关注“设备现在处于哪一步、满足什么条件才能进入下一步，以及特殊模式如何覆盖正常流程”。

本次最大的收获是建立了顺序控制的基本框架：

```text
拆分工艺步骤
→ 给步骤编号
→ 定义每一步的动作
→ 定义转换条件
→ 处理停止、急停和特殊模式
→ 根据当前步骤统一生成输出
```

TIA Portal中的GRAPH是专门描述步序流程的工具，复杂流程会更加直观。本项目先完全使用LAD，是为了看清状态机底层逻辑；后续可以再用GRAPH复刻一次，对比两种实现方式。

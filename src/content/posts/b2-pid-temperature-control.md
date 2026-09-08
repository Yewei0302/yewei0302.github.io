---
author: 叶工
category: PLC项目练习
description: 在无实体硬件条件下，使用TIA Portal V19、S7-1500、PLCSIM与WinCC RT Advanced完成房间恒温PID闭环、安全联锁、趋势和报警系统。
draft: false
image: /images/posts/b2-room-temp-pid/51.webp
lang: zh-CN
published: 2026-09-08
tags:
- PLC
- PID
- S7-1500
- TIA Portal
- WinCC
- PLCSIM
title: B2房间恒温PID控制系统：S7-1500、PID_Compact与WinCC联合仿真
---

> 本笔记记录在纯仿真环境（无真实 PLC、加热器和温度传感器）下，基于 TIA Portal V19 + S7-PLCSIM + WinCC RT Advanced V17 完成一个房间恒温 PID 闭环控制项目的完整过程，包括程序设计、HMI 组态、报警系统、联调验收和项目归档。

## 运行演示动图

以下动图录制自 WinCC RT Advanced V17 运行画面（TIA Portal V19 + S7-1500 + S7-PLCSIM 联合仿真，无真实硬件，房间温度由 `FB_RoomTempSim` 仿真）。先看系统实际运行效果，再看具体实现。

![图 D-1　系统启动演示动图](/images/posts/b2-room-temp-pid/demo-start.gif)

**图 D-1　系统启动演示**：从冷启动初始状态（指示灯全灰、输出 `0.0%`）点击"系统启动"后，系统运行、加热允许指示灯点亮，PID 投入自动模式，加热器实际输出升至约 `60%`，房间实际温度沿趋势曲线平稳爬升并逼近 `55 ℃` 设定值，无明显超调。

![图 D-2　系统停止演示动图](/images/posts/b2-room-temp-pid/demo-stop.gif)

**图 D-2　系统停止演示**：在稳定运行状态（实际温度 `55.0 ℃`、输出 `60.0%`）点击"系统停止"后，系统运行与加热允许指示灯熄灭，加热器实际输出立即降为 `0.0%`；系统只有加热、无主动制冷，房间温度失去补偿后沿趋势曲线向环境温度缓慢回落。

## 1. 项目概述

### 1.1 项目目标

在 HMI 上设定目标温度（例如 55 ℃），由 PID_Compact 控制加热器，使模拟房间温度稳定在设定值；系统具备启停控制、安全联锁、报警记录和完整的人机界面。

### 1.2 软件及仿真环境

| 项目         | 配置                                                                                  |
|--------------|---------------------------------------------------------------------------------------|
| 编程软件     | TIA Portal V19                                                                        |
| PLC          | S7-1500 CPU 1511-1 PN（注意：不要使用 S7-1200，该系列 CPU 无法完成本项目的 PID 模拟） |
| PLC 仿真     | S7-PLCSIM 标准版                                                                      |
| HMI 运行系统 | WinCC RT Advanced V17                                                                 |
| 编程语言     | LAD 梯形图（不使用 SCL）                                                              |
| PID 控制器   | PID_Compact                                                                           |
| 被控对象     | 无真实硬件，使用 `FB_RoomTempSim` 模拟房间升温与散热                                  |

### 1.3 最终实现的功能

- PLC 启停控制
- PID 恒温控制
- 房间温度对象仿真
- 安全联锁（停止、超温、PID 错误切断加热输出）
- HMI 启停及复位按钮
- 五个状态指示灯（就绪、运行、加热允许、超温报警、PID 错误）
- 温度实时趋势
- HMI 离散量报警
- 报警确认、消失及历史缓冲记录
- 主画面与报警画面切换
- Runtime 退出按钮
- 冷启动验收
- `.zap19` 项目归档及重新打开验证

### 1.4 项目完成状态

项目已全部完成并通过测试，包括 25 ℃升温至 55 ℃闭环跟随测试、55 ℃降至 45 ℃设定值阶跃测试、超温联锁测试、报警全生命周期测试和冷启动验收。

------------------------------------------------------------------------

## 2. 控制系统工作原理

### 2.1 闭环控制流程

用户在 HMI 设置目标温度 → 启动恒温系统 → PID 比较设定温度与实际温度 → PID 输出 0.0%～100% 的加热控制量 → 温度仿真 FB 根据加热输出计算房间温度变化 → 温度接近设定值后 PID 自动减少输出。

系统停止后，加热输出归零，房间温度逐渐降向环境温度；超温时产生报警并禁止加热。

核心关系式：

``` text
温度偏差 = 设定温度 SP - 实际温度 PV
```

不同偏差下 PID 的动作：

| 设定温度/℃ | 实际温度/℃ | PID 动作           |
|------------|------------|--------------------|
| 55         | 25         | 输出较大，快速升温 |
| 55         | 50         | 逐渐减少输出       |
| 55         | 54.8       | 小幅调整           |
| 55         | 55         | 维持恒温           |
| 55         | 57         | 停止或大幅降低加热 |

![图 2-1　闭环控制的形成过程](/images/posts/b2-room-temp-pid/1.webp)

图 2-1　闭环控制的形成过程

这里最关键的是形成一个循环：

``` text
PID 输出影响房间温度
    ↓
房间温度反馈给 PID
    ↓
PID 再次调整输出
```

如果只调用 PID_Compact 而没有温度仿真模型，实际温度不会变化，闭环就无法完成。

### 2.2 为什么必须建立 FB_RoomTempSim

现实系统中的信号过程是：

``` text
PID 输出 → 加热器发热 → 房间温度变化 → 温度传感器反馈
```

本项目没有真实房间、加热器和传感器，因此用 `FB_RoomTempSim` 模拟这一过程：

``` text
rHeaterOutPct → FB_RoomTempSim → rRoomTempPV
```

### 2.3 房间温度计算原理

房间温度受两个作用影响。

**加热作用**：加热输出越大，升温越快。

``` text
加热升温速率 = 加热输出百分比 / 100 × 最大升温速率
```

**散热作用**：房间温度高于环境温度越多，散热越快。

``` text
散热速率 = （房间温度 - 环境温度）× 散热系数
```

例如：

``` text
房间温度 = 55 ℃
环境温度 = 25 ℃
散热系数 = 0.02
散热速率 = （55 - 25）× 0.02 = 0.6 ℃/s
```

**净温度变化速率**（原文"静温度变化速率"为错别字，已更正）：

``` text
净温度变化速率 = 加热升温速率 - 散热速率
```

考虑到 100 ms 的执行周期：

``` text
本周期温度变化量 = 净温度变化速率 × 0.1 s
```

最后：

``` text
新房间温度 = 上周期房间温度 + 本周期温度变化量
```

### 2.4 完整公式与单位说明

``` text
rHeatRate     = (rHeaterOutPct ÷ 100.0) × rHeaterGain
rHeatLossRate = (rRoomTempState - rAmbientTempPV) × rHeatLossGain
rTempChange   = (rHeatRate - rHeatLossRate) × rCycleTimeSec
rRoomTempState = rRoomTempState + rTempChange
```

各变量含义与单位：

| 变量             | 单位 | 说明                                                      |
|------------------|------|-----------------------------------------------------------|
| `rHeaterOutPct`  | %    | 加热输出百分比，0.0～100.0                                |
| `rHeaterGain`    | ℃/s  | 加热能力系数：100% 输出时的最大升温速率，数值越大升温越快 |
| `rRoomTempState` | ℃    | 房间温度内部状态（上一周期计算结果）                      |
| `rAmbientTempPV` | ℃    | 环境温度                                                  |
| `rHeatLossGain`  | 1/s  | 房间散热系数，数值越大降温越快                            |
| `rHeatRate`      | ℃/s  | 当前加热升温速率                                          |
| `rHeatLossRate`  | ℃/s  | 当前环境散热速率                                          |
| `rTempChange`    | ℃    | 本周期温度变化量                                          |
| `rCycleTimeSec`  | s    | 仿真计算周期，本项目为 0.1 s                              |

### 2.5 单加热、无主动制冷的特点

本系统只有加热器，没有制冷设备，因此温度只能上升或依靠自然散热下降。当设定值下调时，实际温度只能缓慢下降到新设定值附近；PID 在稳态时不会输出 0%，因为必须持续补偿房间向环境的散热（详见第 10 章）。

------------------------------------------------------------------------

## 3. 项目结构与程序块规划

| 块名称                     | 类型                    | 作用                                                 |
|----------------------------|-------------------------|------------------------------------------------------|
| `OB_Main`                  | OB1                     | 启停、报警、运行允许等主逻辑，负责"系统是否应该运行" |
| `OB_Cyclic100ms`           | 循环中断 OB30（100 ms） | 固定周期执行 PID 计算和温度变化计算                  |
| `FB_RoomTempSim`           | FB                      | 模拟房间升温、散热和温度变化                         |
| `DB_RoomTempSim_Inst`      | 实例 DB                 | 保存温度仿真 FB 的内部数据                           |
| `PID_RoomTempCtrl`         | PID_Compact             | 房间温度 PID 控制器                                  |
| `DB_PID_RoomTempCtrl_Inst` | 工艺实例 DB             | 保存 PID 参数和运行状态                              |
| `DB_B2_Control`            | 全局 DB                 | 保存 B2 项目的命令、状态和工艺数据                   |

> 说明：原始笔记中曾将仿真 FB 的实例 DB 写作 `FB_RoomTempSim_Inst`，项目截图中的实际名称为 `DB_RoomTempSim_Inst`，本文以截图为准。

固定周期非常重要：PID 参数和温度仿真都与时间有关，必须保证计算周期恒定，这也是 PID 必须放在循环中断 OB 中调用的原因。

创建循环中断 OB 的方法：项目树 → `PLC_1` → `程序块` → `添加新块`，类型选择 `Cyclic interrupt`，编号 30，循环时间 100 ms。

![图 3-1　添加循环中断 OB_Cyclic100ms（编号 30，循环时间 100 ms）](/images/posts/b2-room-temp-pid/16.webp)

图 3-1　添加循环中断 OB_Cyclic100ms（编号 30，循环时间 100 ms）

![图 3-2　OB_Cyclic100ms 编译完成，错误 0、警告 0](/images/posts/b2-room-temp-pid/18.webp)

图 3-2　OB_Cyclic100ms 编译完成，错误 0、警告 0

------------------------------------------------------------------------

## 4. 变量命名与最终变量表

### 4.1 命名规则

| 前缀           | 含义          | 示例                         |
|----------------|---------------|------------------------------|
| `x`            | BOOL          | `xSystemStartCmd`            |
| `r`            | REAL          | `rRoomTempPV`                |
| `i`            | Int           | `iPIDState`                  |
| `w`            | Word          | `wHMIAlarmTrigger`           |
| `dw`           | DWord         | `dwPIDErrorCode`             |
| `Cmd` 后缀     | 操作命令      | `xAlarmResetCmd`             |
| `Sts` 后缀     | 系统状态      | `xSystemRunningSts`          |
| `Alm` 后缀     | 报警          | `xRoomTempHighAlm`           |
| `SP`/`PV` 后缀 | 设定值/实际值 | `rRoomTempSP`、`rRoomTempPV` |

> 命令变量来自 PLCSIM 监控表或 HMI 按钮，不是现场实体按钮；如果是实体按钮，后缀可改用 `PB`。

以下错误写法已在整理时统一更正：

| 错误写法                    | 正确写法                  |
|-----------------------------|---------------------------|
| `xSystemStarCmd`            | `xSystemStartCmd`         |
| `xSystemRUNningSts`         | `xSystemRunningSts`       |
| `rHeatOutPct`               | `rHeaterOutPct`           |
| `DB_b2_Control`             | `DB_B2_Control`           |
| `wPIDErrorCode`（早期写法） | `dwPIDErrorCode`（DWord） |

### 4.2 最终全局 DB 变量表（DB_B2_Control）

下表以项目最终 `DB_B2_Control` 截图（图 4-3）为准，按类别整理。

**操作命令**

| 变量名                | 类型 | 起始值 | 中文注释                                     |
|-----------------------|------|--------|----------------------------------------------|
| `xSystemStartCmd`     | Bool | false  | 恒温系统启动命令，TRUE 时请求启动            |
| `xSystemStopCmd`      | Bool | false  | 恒温系统停止命令，TRUE 时请求停止            |
| `xAlarmResetCmd`      | Bool | false  | 报警复位命令，TRUE 时请求复位报警            |
| `xSimResetCmd`        | Bool | false  | 温度仿真复位命令，TRUE 时恢复初始温度        |
| `xPIDResetCmd`        | Bool | false  | PID 控制器复位命令，TRUE 时 PID 处于复位状态 |
| `xPIDModeActivateCmd` | Bool | false  | PID 模式激活命令，上升沿时激活目标模式       |
| `xPIDResetAckCmd`     | Bool | false  | PID 错误确认命令，上升沿时确认错误           |

**系统状态**

| 变量名              | 类型 | 起始值 | 中文注释                                  |
|---------------------|------|--------|-------------------------------------------|
| `xSystemRunningSts` | Bool | false  | 恒温系统运行状态，TRUE 时表示系统正在运行 |
| `xHeatingEnableSts` | Bool | false  | 加热允许状态，TRUE 时允许加热             |
| `xSystemReadySts`   | Bool | false  | 恒温系统就绪状态，TRUE 时允许启动         |

**温度变量**

| 变量名                    | 类型 | 起始值 | 中文注释                       |
|---------------------------|------|--------|--------------------------------|
| `rRoomTempSP`             | Real | 55.0   | 房间温度设定值，单位 ℃         |
| `rRoomTempPV`             | Real | 25.0   | 房间实际温度，单位 ℃           |
| `rAmbientTempPV`          | Real | 25.0   | 环境实际温度，单位 ℃           |
| `rInitialRoomTemp`        | Real | 25.0   | 房间仿真初始温度，单位 ℃       |
| `rRoomTempHighLimit`      | Real | 80.0   | 房间温度报警上限，单位 ℃       |
| `rRoomTempHighResetLimit` | Real | 75.0   | 房间温度高报警复位上限，单位 ℃ |

**PID 命令与状态**

| 变量名           | 类型  | 起始值 | 中文注释                            |
|------------------|-------|--------|-------------------------------------|
| `iPIDMode`       | Int   | 3      | PID 目标运行模式，3 表示自动模式    |
| `iPIDState`      | Int   | 0      | PID 控制器当前实际运行状态          |
| `xPIDErrorAlm`   | Bool  | false  | PID 控制器错误报警，TRUE 时存在错误 |
| `dwPIDErrorCode` | DWord | 16#0   | PID 控制器错误代码                  |

**PID 输出**

| 变量名              | 类型 | 起始值 | 中文注释                                  |
|---------------------|------|--------|-------------------------------------------|
| `rHeaterOutPct`     | Real | 0.0    | PID 计算的加热输出百分比，范围 0.0～100.0 |
| `rHeaterOutSafePct` | Real | 0.0    | 经过安全联锁后的加热输出，范围 0.0～100.0 |
| `rHeaterOutTestPct` | Real | 0.0    | 温度模型测试用加热输出，范围 0.0～100.0   |

**安全输出**

安全输出即 `rHeaterOutSafePct`，其取值逻辑见第 6 章。

**报警变量**

| 变量名             | 类型 | 起始值 | 中文注释           |
|--------------------|------|--------|--------------------|
| `xRoomTempHighAlm` | Bool | false  | 房间温度超上限报警 |

**HMI 报警触发字**

| 变量名             | 类型 | 起始值    | 中文注释                                                |
|--------------------|------|-----------|---------------------------------------------------------|
| `wHMIAlarmTrigger` | Word | W#16#0000 | HMI 离散量报警触发字，bit0 为超温报警，bit1 为 PID 错误 |

**温度仿真参数**

| 变量名          | 类型 | 起始值 | 中文注释                              |
|-----------------|------|--------|---------------------------------------|
| `rHeaterGain`   | Real | 1.0    | 加热能力系数，100% 输出时最大升温速率 |
| `rHeatLossGain` | Real | 0.02   | 房间散热系数                          |
| `rCycleTimeSec` | Real | 0.1    | 温度模型计算周期，单位秒              |

> 温度仿真参数以最终项目为准：`rHeaterGain = 1.0`、`rHeatLossGain = 0.02`、`rCycleTimeSec = 0.1`。原始笔记前期说明中出现的 `2.0` 和 `0.03` 为旧值，与最终项目不一致，已废弃，不再作为最终值保留。

![图 4-1　DB_B2_Control 初建时的仿真相关变量](/images/posts/b2-room-temp-pid/14.webp)

图 4-1　DB_B2_Control 初建时的仿真相关变量（`rHeaterGain = 1.0`、`rHeatLossGain = 0.02`、`rCycleTimeSec = 0.1`）

![图 4-2　DB_B2_Control 编译完成，错误 0、警告 0](/images/posts/b2-room-temp-pid/15.webp)

图 4-2　DB_B2_Control 编译完成，错误 0、警告 0

![图 4-3　项目最终完整的 DB_B2_Control 变量表](/images/posts/b2-room-temp-pid/33.webp)

图 4-3　项目最终完整的 DB_B2_Control 变量表（含 PID 相关变量；`wHMIAlarmTrigger` 为后期新增，不在本图中）

------------------------------------------------------------------------

## 5. 房间温度仿真 FB

### 5.1 为什么使用 FB 而不是 FC

温度仿真需要记住"上一周期的房间温度"，例如：

``` text
第一次计算：25.00 ℃
第二次计算：25.10 ℃
第三次计算：25.20 ℃
```

FB 可以通过静态变量（Static）保存上一周期的结果；FC 没有静态存储区，不适合直接保存这种内部状态。因此使用 `FB_RoomTempSim`，并创建对应的实例 DB `DB_RoomTempSim_Inst`。

### 5.2 创建 FB 与接口定义

项目树 → `PLC_1` → `程序块` → `添加新块`，类型选择 `函数块 FB`，名称 `FB_RoomTempSim`，语言 LAD。

![图 5-1　添加新块：创建 FB_RoomTempSim（LAD）](/images/posts/b2-room-temp-pid/2.webp)

图 5-1　添加新块：创建 FB_RoomTempSim（LAD）

![图 5-2　FB 接口区：Input 变量定义](/images/posts/b2-room-temp-pid/3.webp)

图 5-2　FB 接口区：Input 变量定义

![图 5-3　FB 接口区：Output、Static 与 Temp 变量定义](/images/posts/b2-room-temp-pid/4.webp)

图 5-3　FB 接口区：Output、Static 与 Temp 变量定义

接口区知识点：

``` text
Input  输入变量：由调用方传入
Output 输出变量：FB 计算结果输出给调用方
Static 静态变量：保存在实例 DB 中，FB 本次执行结束后数值不会消失
Temp   临时变量：只用于本次计算，不需要保存到下一周期
```

**Input**

| 名称               | 类型 | 说明                                         |
|--------------------|------|----------------------------------------------|
| `xSimResetCmd`     | BOOL | 仿真复位命令，TRUE 时恢复初始温度            |
| `rHeaterOutPct`    | REAL | 加热输出百分比，范围 0.0～100.0              |
| `rAmbientTempPV`   | REAL | 环境实际温度，单位 ℃                         |
| `rInitialRoomTemp` | REAL | 房间初始温度，单位 ℃                         |
| `rHeaterGain`      | REAL | 加热能力系数，表示 100% 输出时的最大升温速率 |
| `rHeatLossGain`    | REAL | 房间散热系数                                 |
| `rCycleTimeSec`    | REAL | 仿真计算周期，单位秒                         |

**Output**

| 名称          | 类型 | 说明                                         |
|---------------|------|----------------------------------------------|
| `rRoomTempPV` | REAL | 房间实际温度，单位 ℃，由温度仿真 FB 计算输出 |

**Static**

| 名称             | 类型 | 起始值 | 说明                                   |
|------------------|------|--------|----------------------------------------|
| `rRoomTempState` | REAL | 25.0   | 房间温度内部状态，用于保存上一周期温度 |

**Temp**

| 名称                   | 类型 | 说明                   |
|------------------------|------|------------------------|
| `rHeaterOutLimitedPct` | REAL | 限幅后的加热输出百分比 |
| `rHeatRate`            | REAL | 当前加热升温速率       |
| `rHeatLossRate`        | REAL | 当前环境散热速率       |
| `rNetTempRate`         | REAL | 当前净温度变化速率     |
| `rTempChange`          | REAL | 当前周期温度变化量     |

### 5.3 LAD 程序段设计

| 程序段 | 标题                   | 主要指令      |
|--------|------------------------|---------------|
| 1      | 温度仿真状态复位       | MOVE          |
| 2      | 加热输出百分比限幅     | LIMIT         |
| 3      | 计算加热升温速率       | DIV、MUL      |
| 4      | 计算房间环境散热速率   | SUB、MUL      |
| 5      | 计算净温度变化速率     | SUB           |
| 6      | 计算当前周期温度变化量 | MUL           |
| 7      | 更新房间温度内部状态   | 常闭触点、ADD |
| 8      | 输出房间实际温度       | MOVE          |

各程序段的实现：

![图 5-4　程序段 1：温度仿真状态复位（xSimResetCmd 为 TRUE 时将 rInitialRoomTemp 写入 rRoomTempState）](/images/posts/b2-room-temp-pid/5.webp)

图 5-4　程序段 1：温度仿真状态复位（`xSimResetCmd` 为 TRUE 时将 `rInitialRoomTemp` 写入 `rRoomTempState`）

![图 5-5　程序段 2：加热输出百分比限幅](/images/posts/b2-room-temp-pid/6.webp)

图 5-5　程序段 2：加热输出百分比限幅

![图 5-6　程序段 3：计算加热升温速率](/images/posts/b2-room-temp-pid/7.webp)

图 5-6　程序段 3：计算加热升温速率

![图 5-7　程序段 4：计算房间环境散热速率](/images/posts/b2-room-temp-pid/8.webp)

图 5-7　程序段 4：计算房间环境散热速率

![图 5-8　程序段 5：计算净温度变化速率](/images/posts/b2-room-temp-pid/9.webp)

图 5-8　程序段 5：计算净温度变化速率

![图 5-9　程序段 6：计算当前周期温度变化量](/images/posts/b2-room-temp-pid/10.webp)

图 5-9　程序段 6：计算当前周期温度变化量

![图 5-10　程序段 7：更新房间温度内部状态](/images/posts/b2-room-temp-pid/11.webp)

图 5-10　程序段 7：更新房间温度内部状态

![图 5-11　程序段 8：输出房间实际温度](/images/posts/b2-room-temp-pid/12.webp)

图 5-11　程序段 8：输出房间实际温度

![图 5-12　FB_RoomTempSim 编译完成，错误 0、警告 0](/images/posts/b2-room-temp-pid/13.webp)

图 5-12　FB_RoomTempSim 编译完成，错误 0、警告 0

![图 5-13　在 OB_Cyclic100ms 程序段 1 中调用 FB_RoomTempSim（实例 DB 为 DB_RoomTempSim_Inst）](/images/posts/b2-room-temp-pid/17.webp)

图 5-13　在 OB_Cyclic100ms 程序段 1 中调用 FB_RoomTempSim（实例 DB 为 `DB_RoomTempSim_Inst`）

### 5.4 100 ms 周期的意义

温度模型中的升温速率和散热速率都是"每秒变化量"，必须乘以计算周期才能得到每个周期的温度增量。周期必须固定，否则同样的 PID 输出会产生不同的温度变化速度，导致模型失真。因此 FB 的调用放在循环中断 `OB_Cyclic100ms` 中，周期固定为 0.1 s，与 `rCycleTimeSec = 0.1` 一致。

### 5.5 开环升温验证

FB 编写完成后，先在 PLCSIM 中做开环测试，验证温度模型本身正确。

![图 5-14　启动 S7-PLCSIM，下载 B2_RoomTempPID_S71500 项目](/images/posts/b2-room-temp-pid/19.webp)

图 5-14　启动 S7-PLCSIM，下载 `B2_RoomTempPID_S71500` 项目

![图 5-15　PLC 程序下载成功，错误 0、警告 0](/images/posts/b2-room-temp-pid/20.webp)

图 5-15　PLC 程序下载成功，错误 0、警告 0

测试步骤：

1.  在监控表中 `xSimResetCmd` 的"修改值"输入 `TRUE`，点击"立即修改"。
2.  确认 `rRoomTempPV` 变为 `25.0`。
3.  将 `xSimResetCmd` 改回 `FALSE`，再次点击"立即修改"。
4.  在 `rHeaterOutTestPct` 中输入 `100.0`，点击"立即修改"，观察 `rRoomTempPV`。

正常现象是温度从 `25.0 ℃` 连续上升。观察到升至约 `30 ℃` 后，把 `rHeaterOutTestPct` 改为 `0.0`，温度应逐渐下降并接近 `25 ℃`。

![图 5-16　开环升温与散热测试过程（GIF，演示在监控表中修改加热输出并观察温度变化）](/images/posts/b2-room-temp-pid/21.gif)

图 5-16　开环升温与散热测试过程（GIF，演示在监控表中修改 `rHeaterOutTestPct` 并观察 `rRoomTempPV` 的变化）

------------------------------------------------------------------------

## 6. 全局 DB 与安全联锁

### 6.1 安全联锁信号链

在正式接入 PID 之前，先用测试输出 `rHeaterOutTestPct` 建立"系统启停 + 安全联锁"逻辑：

``` text
测试/PID 输出
    ↓
系统运行 ＋ 无超温报警
    ↓
安全加热输出 rHeaterOutSafePct
    ↓
FB_RoomTempSim
```

对应的变量与逻辑关系：

**正常启动**（无超温报警）：

``` text
xSystemReadySts = TRUE
→ 按下 xSystemStartCmd
→ xSystemRunningSts = TRUE
→ xHeatingEnableSts = TRUE
```

**停止系统**：

``` text
xSystemStopCmd = TRUE
→ xSystemRunningSts = FALSE
→ xHeatingEnableSts = FALSE
→ rHeaterOutSafePct = 0.0
```

**超温时**：

``` text
rRoomTempPV ≥ rRoomTempHighLimit（80 ℃）
→ xRoomTempHighAlm = TRUE（置位锁存）
→ 系统停止
→ 禁止加热
→ rHeaterOutSafePct = 0.0
```

**报警复位**（温度已下降到复位限值以下，且操作员发出复位命令）：

``` text
rRoomTempPV ≤ rRoomTempHighResetLimit（75 ℃）
并且 xAlarmResetCmd = TRUE
→ xRoomTempHighAlm = FALSE
→ xSystemReadySts = TRUE
```

注意：报警复位后系统不会自动重新启动（`xSystemRunningSts` 仍为 FALSE），必须再次执行启动命令，这符合安全原则。

### 6.2 OB_Main 程序段实现

`OB_Main` 共 10 个程序段，本章覆盖程序段 1～8，程序段 9、10（HMI 报警触发字）见第 11 章。

![图 6-1　程序段 1：超温报警置位（锁存）](/images/posts/b2-room-temp-pid/22.webp)

图 6-1　程序段 1：超温报警置位（锁存）

![图 6-2　程序段 2：报警复位](/images/posts/b2-room-temp-pid/23.webp)

图 6-2　程序段 2：报警复位

![图 6-3　程序段 3：系统就绪判断（无超温报警且无 PID 错误时允许启动）](/images/posts/b2-room-temp-pid/24.webp)

图 6-3　程序段 3：系统就绪判断（无超温报警且无 PID 错误时允许启动）

![图 6-4　程序段 4：系统启动保持](/images/posts/b2-room-temp-pid/25.webp)

图 6-4　程序段 4：系统启动保持

![图 6-5　程序段 5：停止与报警复位运行状态](/images/posts/b2-room-temp-pid/26.webp)

图 6-5　程序段 5：停止与报警复位运行状态

![图 6-6　程序段 6：生成加热允许](/images/posts/b2-room-temp-pid/27.webp)

图 6-6　程序段 6：生成加热允许

![图 6-7　程序段 7：生成安全加热输出](/images/posts/b2-room-temp-pid/28.webp)

图 6-7　程序段 7：生成安全加热输出

![图 6-8　程序段 8：修改循环中断，统一 100 ms 执行周期](/images/posts/b2-room-temp-pid/29.webp)

图 6-8　程序段 8：修改循环中断，统一 100 ms 执行周期

**程序段 8：生成 PID 控制器复位请求**

在 `DB_B2_Control` 中增加变量：

| 变量名         | 类型 | 起始值 | 注释                                          |
|----------------|------|--------|-----------------------------------------------|
| `xPIDResetReq` | BOOL | TRUE   | PID 复位请求，系统停止或收到复位命令时为 TRUE |

注意区分两个变量：`xPIDResetCmd` 是操作员发出的复位命令；`xPIDResetReq` 是程序综合判断后的实际复位请求。

程序段 8 建立两个并联条件：上方 `xSystemRunningSts` 常闭触点，下方 `xPIDResetCmd` 常开触点，连接普通线圈 `xPIDResetReq`：

``` text
系统没有运行 OR 操作员发出 PID 复位命令
→ xPIDResetReq = TRUE
```

运行关系：

``` text
系统停止 → PID 复位并进入 State 0
系统启动 → Reset 由 TRUE 变 FALSE → PID 进入 Mode 3 自动模式
```

同时修改程序段 3 的系统就绪逻辑：原来只有 `NOT xRoomTempHighAlm`，现在增加 PID 错误的常闭触点：

``` text
NOT xRoomTempHighAlm AND NOT xPIDErrorAlm → xSystemReadySts
```

即超温报警或 PID 错误任何一个出现，系统都不允许运行。

### 6.3 两个加热输出变量的区别

- `rHeaterOutPct` 是 PID 原始计算输出，只反映 PID 想要多少加热量。
- `rHeaterOutSafePct` 是经过停止、超温和 PID 错误联锁后的最终执行输出。

``` text
系统运行 且 无报警：rHeaterOutSafePct = rHeaterOutPct
系统停止 或 存在报警：rHeaterOutSafePct = 0.0
```

发生停止、超温或 PID 错误时，`rHeaterOutSafePct` 一定被切断为 0，这才是现场加热器最终收到的命令。HMI 最终显示的应是 `rHeaterOutSafePct`，画面名称为"加热器实际输出"（见第 9 章）。

接入 PID 后的控制链条：

``` text
rRoomTempSP（设定温度）
    ↓
PID_RoomTempCtrl（PID_Compact）
    ↑ rRoomTempPV（实际温度反馈）
    ↓
rHeaterOutPct（PID 计算输出）
    ↓
安全联锁
    ↓
rHeaterOutSafePct
    ↓
FB_RoomTempSim
    ↓
新的 rRoomTempPV
```

### 6.4 安全联锁测试

测试使用监控表完成，四个场景均通过。

**a. 停止状态禁止加热**

设置：`xSystemStartCmd = FALSE`、`xSystemStopCmd = FALSE`、`rHeaterOutTestPct = 100.0`。

预期：`xSystemReadySts = TRUE`、`xSystemRunningSts = FALSE`、`xHeatingEnableSts = FALSE`、`rHeaterOutSafePct = 0.0`。

虽然测试输出为 100%，系统没有启动，安全输出必须是 0%。

![图 6-9　测试一：停止状态禁止加热（GIF，演示系统未启动时安全输出保持 0%）](/images/posts/b2-room-temp-pid/30.gif)

图 6-9　测试一：停止状态禁止加热（GIF，演示系统未启动时 `rHeaterOutSafePct` 保持 0%）

**b. 启动系统**

修改 `xSystemStartCmd = TRUE`，然后恢复 `FALSE`。

预期：`xSystemRunningSts = TRUE`、`xHeatingEnableSts = TRUE`、`rHeaterOutSafePct = 100.0`、`rRoomTempPV` 持续上升。启动命令恢复 FALSE 后，`xSystemRunningSts` 仍保持 TRUE（自保持）。

![图 6-10　测试二：启动系统（GIF，演示启动后运行状态自保持并开始升温）](/images/posts/b2-room-temp-pid/31.gif)

图 6-10　测试二：启动系统（GIF，演示启动后运行状态自保持并开始升温）

**c. 停止系统**

修改 `xSystemStopCmd = TRUE`，然后恢复 `FALSE`。

预期：`xSystemRunningSts = FALSE`、`xHeatingEnableSts = FALSE`、`rHeaterOutSafePct = 0.0`、`rRoomTempPV` 逐渐下降。

![图 6-11　测试三：停止系统（GIF，演示停止后输出归零、温度回落）](/images/posts/b2-room-temp-pid/32.gif)

图 6-11　测试三：停止系统（GIF，演示停止后输出归零、温度回落）

**d. 模拟超温报警与复位**

为了不用等到 80 ℃，临时设置 `rRoomTempHighLimit = 30.0`、`rRoomTempHighResetLimit = 28.0`。将温度仿真复位到 25 ℃ 后解除复位，再启动系统并保持测试输出 100%。

温度达到 30 ℃ 时预期：`xRoomTempHighAlm = TRUE`、`xSystemReadySts = FALSE`、`xSystemRunningSts = FALSE`、`xHeatingEnableSts = FALSE`、`rHeaterOutSafePct = 0.0`。

温度下降到 28 ℃ 以下后，报警仍应保持 TRUE（因为使用了置位线圈）。此时给 `xAlarmResetCmd` 一个 `TRUE → FALSE` 脉冲，预期：`xRoomTempHighAlm = FALSE`、`xSystemReadySts = TRUE`，但 `xSystemRunningSts = FALSE`，系统不会自动重启。

全部测试完成后，把报警限值恢复为 `rRoomTempHighLimit = 80.0`、`rRoomTempHighResetLimit = 75.0`。

------------------------------------------------------------------------

## 7. PID_Compact 配置

### 7.1 创建 PID 工艺对象

插入 PID_Compact 的路径：项目树 → `PLC_1` → `工艺对象` → `添加新对象` → `PID 控制` → `PID_Compact`。

创建实例数据块时选择"单实例"，名称填写 `DB_PID_RoomTempCtrl_Inst`。

在 `OB_Cyclic100ms` 中调用 PID_Compact，程序段前面不要放触点，让 PID 每 100 ms 无条件调用。

![图 7-1　OB_Cyclic100ms 中调用 PID_Compact（程序段 1：房间温度 PID 控制；程序段 2：调用房间温度对象仿真）](/images/posts/b2-room-temp-pid/34.webp)

图 7-1　OB_Cyclic100ms 中调用 PID_Compact（程序段 1：房间温度 PID 控制；程序段 2：调用房间温度对象仿真）

### 7.2 设定值、过程值与输出的连接

PID_Compact 的输入输出连接如下：

| PID_Compact 引脚 | 连接变量                            | 说明                   |
|------------------|-------------------------------------|------------------------|
| `Setpoint`       | `DB_B2_Control.rRoomTempSP`         | 温度设定值             |
| `Input`          | `DB_B2_Control.rRoomTempPV`         | 过程值（房间实际温度） |
| `Output`         | `DB_B2_Control.rHeaterOutPct`       | PID 计算输出           |
| `ErrorAck`       | `DB_B2_Control.xPIDResetAckCmd`     | 错误确认，上升沿有效   |
| `Reset`          | `DB_B2_Control.xPIDResetReq`        | 复位                   |
| `ModeActivate`   | `DB_B2_Control.xPIDModeActivateCmd` | 模式激活，上升沿有效   |
| `Mode`           | `DB_B2_Control.iPIDMode`            | 目标模式               |
| `State`          | `DB_B2_Control.iPIDState`           | 当前实际状态           |
| `Error`          | `DB_B2_Control.xPIDErrorAlm`        | 错误报警               |
| `ErrorBits`      | `DB_B2_Control.dwPIDErrorCode`      | 错误代码               |

![图 7-2　PID_Compact 组态：Input/Output 参数连接](/images/posts/b2-room-temp-pid/35.webp)

图 7-2　PID_Compact 组态：Input/Output 参数连接

### 7.3 控制器类型与 PID 参数

组态要点：

- 控制器类型：温度，单位 ℃。
- 未勾选"反转控制逻辑"。
- 勾选"CPU 重启后激活 Mode"，并将 Mode 设为手动模式（保证上电后 PID 不会立即投入自动）。
- 本项目先手动输入一组保守 PID 参数，再通过闭环测试微调。

![图 7-3　控制器类型：温度，CPU 重启后激活 Mode](/images/posts/b2-room-temp-pid/36.webp)

图 7-3　控制器类型：温度，CPU 重启后激活 Mode

![图 7-4　PID 参数（手动输入）：比例增益 2.0，积分时间 50.0 s，微分时间 0.0 s，采样时间 0.1 s，控制器结构 PID](/images/posts/b2-room-temp-pid/37.webp)

图 7-4　PID 参数（手动输入）：比例增益 2.0，积分时间 50.0 s，微分时间 0.0 s，采样时间 0.1 s，控制器结构 PID

### 7.4 自动模式激活：xPIDModeActivateCmd 与 iPIDState

`iPIDMode` 表示希望 PID 进入什么模式：

``` text
0 = 未激活
1 = 预调节
2 = 精确调节
3 = 自动模式
4 = 手动模式
```

本项目使用 `iPIDMode = 3`。

`iPIDMode = 3` 只是告诉 PID"目标是自动模式"，还需要给 `xPIDModeActivateCmd` 一个 `FALSE → TRUE` 的上升沿，PID 才会执行模式切换。西门子规定 `Mode = 3` 代表自动模式，并通过 `ModeActivate` 上升沿激活。

`iPIDState` 表示 PID 当前实际处于什么模式。正常自动控制时必须看到：

``` text
iPIDMode  = 3
iPIDState = 3
```

如果 `iPIDMode = 3` 而 `iPIDState = 0`，说明虽然目标模式是自动，但 PID 还没有真正激活。

操作方法：在监控表中给 `xPIDModeActivateCmd` 一个上升沿——输入 `TRUE` 并"立即修改"，等待监视值变为 TRUE 后，再改回 `FALSE`。

正确结果：

``` text
iPIDState        = 3
xPIDErrorAlm     = FALSE
dwPIDErrorCode   = 16#00000000
rHeaterOutPct    > 0.0
```

![图 7-5　监控表验证：iPIDMode = 3、iPIDState = 3、错误代码为 0，系统闭环运行中](/images/posts/b2-room-temp-pid/38.webp)

图 7-5　监控表验证：`iPIDMode = 3`、`iPIDState = 3`、`dwPIDErrorCode = 0`，系统闭环运行中

### 7.5 PID 复位

`xPIDResetReq` 在系统停止或操作员发出 PID 复位命令时为 TRUE，使 PID 进入复位（State 0）状态；系统启动后 `xPIDResetReq` 变为 FALSE，PID 才能在 `ModeActivate` 上升沿作用下进入自动模式。这样保证了"先复位、再启动"的顺序（程序段 8 见第 6 章）。

### 7.6 为什么必须在 OB_Cyclic100ms 中周期调用

PID_Compact 内部的积分、微分计算和抗饱和处理都与采样时间有关。放在普通 OB1 中调用时，扫描周期会随程序负荷波动，导致 PID 实际采样时间不恒定、控制效果变差；放在 100 ms 循环中断中调用，可以保证 PID 每 100 ms 精确执行一次，与组态的 `PID 算法采样时间 = 0.1 s` 一致。

------------------------------------------------------------------------

## 8. PLC 与 HMI 通信组态

### 8.1 添加 HMI 设备

项目树 → `设备和网络` → `添加新设备` → `PC 系统` → `WinCC RT Advanced`，版本选择 V17，设备名称 `HMI_B2_PC`。

![图 8-1　添加新设备 HMI_B2_PC（PC 系统 → WinCC RT Advanced V17）](/images/posts/b2-room-temp-pid/39.webp)

图 8-1　添加新设备 HMI_B2_PC（PC 系统 → WinCC RT Advanced V17）

### 8.2 添加 PC 通信接口

保持在设备视图，在右侧打开"硬件目录"，找到路径：`通信模块 → PROFINET/Ethernet → IE General`（常规 IE），将它拖到 PC 站中 `WinCC RT Advanced` 旁边的空槽位。

![图 8-2　在 PC 站中添加 IE general_1 通信模块](/images/posts/b2-room-temp-pid/40.webp)

图 8-2　在 PC 站中添加 IE general_1 通信模块

### 8.3 建立 PN/IE 网络

点击上方`网络视图`，应能同时看到 `PLC_1` 和 `HMI_B2_PC`。

找到两个设备上的绿色以太网接口（`PLC_1` 的 PN/IE 接口和 `IE general_1` 的绿色接口），用鼠标从 `IE general_1` 的绿色方框拖线到 `PLC_1` 的绿色 PN 接口。连接成功后，两台设备接入同一条网络 `PN/IE_1`。

![图 8-3　网络视图：PLC_1 与 HMI_B2_PC 接入 PN/IE_1 子网](/images/posts/b2-room-temp-pid/41.webp)

图 8-3　网络视图：PLC_1 与 HMI_B2_PC 接入 PN/IE_1 子网

### 8.4 设置 IP 地址

最终成功配置：

| 设备                          | IP 地址       | 子网掩码        |
|-------------------------------|---------------|-----------------|
| `PLC_1`                       | `192.168.0.1` | `255.255.255.0` |
| `IE general_1`（PC/HMI 接口） | `192.168.0.2` | `255.255.255.0` |

两台设备必须在同一网段，但 IP 不能相同；子网均为 `PN/IE_1`。

**设置 PLC 地址**：

1.  在网络视图中单击 `PLC_1` 下方的绿色接口方块。
2.  在下方巡视窗口中选择：`属性 → 常规 → PROFINET 接口 [X1] → 以太网地址`。
3.  在"IP 协议"区域选中`在项目中设置 IP 地址`。
4.  填写 IP 地址 `192.168.0.1`、子网掩码 `255.255.255.0`，子网保持 `PN/IE_1`。
5.  取消勾选`在设备中直接设定 PROFINET 设备名称`，保持`自动生成 PROFINET 设备名称`（原因见第 13 章）。

![图 8-4　PLC_1 PROFINET 接口以太网地址设置（图中为修改前的错误状态：设备名称选择了"在设备中直接设定"）](/images/posts/b2-room-temp-pid/42.webp)

图 8-4　PLC_1 PROFINET 接口以太网地址设置（图中为修改前的错误状态：勾选了"在设备中直接设定 PROFINET 设备名称"）

**设置 PC 地址**：

1.  单击 `HMI_B2_PC` 中 `CP IE` 下方的绿色接口。
2.  在下方属性中进入：`属性 → 常规 → IE general → 以太网地址`。
3.  填写 IP 地址 `192.168.0.2`、子网掩码 `255.255.255.0`、子网 `PN/IE_1`。

如果界面下方没有"属性"窗口，点击 TIA 底部的"属性"标签，或选择`视图 → 巡视窗口`。

![图 8-5　IE general_1 以太网地址设置：IP 192.168.0.2，自动生成 PROFINET 设备名称](/images/posts/b2-room-temp-pid/43.webp)

图 8-5　IE general_1 以太网地址设置：IP `192.168.0.2`，自动生成 PROFINET 设备名称

### 8.5 建立 HMI 连接

1.  回到`网络视图`，点击上方`连接`。
2.  在旁边的连接类型下拉框中选择`HMI 连接`。
3.  用鼠标从 PC 站中的 `HMI_RT_1 / WinCC RT Advanced` 拖到 `PLC_1`。

注意：这次不是拖绿色网口，而是从 WinCC 运行系统模块拖到 PLC。连接成功后会出现一条 HMI 连接线（虚线），名称改为 `HMI_Conn_PLC1`。可以双击连接线名称修改；如果不能修改，就在项目树的`HMI 连接`编辑器中改名。

命名含义：`HMI` 人机界面，`Conn` Connection 连接，`PLC1` 通信对象。

![图 8-6　建立 HMI 连接 HMI_Conn_PLC1（WinCC RT Advanced ↔ S7-1500）](/images/posts/b2-room-temp-pid/44.webp)

图 8-6　建立 HMI 连接 `HMI_Conn_PLC1`（WinCC RT Advanced ↔ S7-1500）

### 8.6 关于本机仿真的说明

- 本机 WinCC Runtime 仿真不需要将整个 PC Station 下载到 `192.168.0.2`。
- 正确做法是：在项目树中选中 `HMI_RT_1 [WinCC RT Advanced]`，先执行`编译 → 软件（全部重新编译）`，编译无错误后直接点击`开始仿真`，而不是"下载到设备"。

------------------------------------------------------------------------

## 9. HMI 主画面

> 本章界面均为 WinCC RT Advanced V17，属性位置可能与其他版本不同。

### 9.1 建立 HMI 变量表

项目树 → `HMI_B2_PC` → `HMI_RT_1` → `HMI 变量`，双击`添加新变量表`，名称 `HMI_B2_Tags`。

| HMI 变量名          | 连接的 PLC 变量                   | 用途                                 |
|---------------------|-----------------------------------|--------------------------------------|
| `xSystemStartCmd`   | `DB_B2_Control.xSystemStartCmd`   | 启动按钮、保持按钮                   |
| `xSystemStopCmd`    | `DB_B2_Control.xSystemStopCmd`    | 停止按钮、保持按钮                   |
| `xAlarmResetCmd`    | `DB_B2_Control.xAlarmResetCmd`    | 报警复位按钮、保持按钮               |
| `xSimResetCmd`      | `DB_B2_Control.xSimResetCmd`      | 仿真复位                             |
| `xPIDResetCmd`      | `DB_B2_Control.xPIDResetCmd`      | PID 复位按钮、保持按钮               |
| `xSystemReadySts`   | `DB_B2_Control.xSystemReadySts`   | 就绪指示                             |
| `xSystemRunningSts` | `DB_B2_Control.xSystemRunningSts` | 运行指示                             |
| `xHeatingEnableSts` | `DB_B2_Control.xHeatingEnableSts` | 加热允许指示                         |
| `xRoomTempHighAlm`  | `DB_B2_Control.xRoomTempHighAlm`  | 超温报警、超温报警灯                 |
| `xPIDErrorAlm`      | `DB_B2_Control.xPIDErrorAlm`      | PID 错误报警、PID 错误灯             |
| `iPIDState`         | `DB_B2_Control.iPIDState`         | PID 当前模式                         |
| `rRoomTempSP`       | `DB_B2_Control.rRoomTempSP`       | 温度设定值                           |
| `rRoomTempPV`       | `DB_B2_Control.rRoomTempPV`       | 实际温度、温度显示                   |
| `rHeaterOutPct`     | `DB_B2_Control.rHeaterOutPct`     | PID 输出                             |
| `rHeaterOutSafePct` | `DB_B2_Control.rHeaterOutSafePct` | 安全加热输出、加热器实际输出         |
| `wHMIAlarmTrigger`  | `DB_B2_Control.wHMIAlarmTrigger`  | HMI 离散量报警触发字（第 11 章新增） |

建立变量时：`连接`选择 `HMI_Conn_PLC1`，`访问模式`为符号访问，`PLC 变量`从 `DB_B2_Control` 中选择，`采集周期` 1 s。数据类型会根据 PLC 变量自动识别，不要手动输入绝对地址。

![图 9-1　HMI 变量表 HMI_B2_Tags](/images/posts/b2-room-temp-pid/45.webp)

图 9-1　HMI 变量表 `HMI_B2_Tags`（连接 HMI_Conn_PLC1，符号访问，采集周期 1 s）

### 9.2 新建主画面与布局规划

项目树 → `HMI_RT_1` → `画面`，双击`添加新画面`，名称 `Scr_B2_Overview`（Scr = Screen 画面，B2 = 项目编号，Overview = 总览）。

画面区域规划：

``` text
顶部：项目标题"B2 房间恒温PID控制系统"
左侧：操作按钮
中间：系统状态指示灯
右侧：温度和输出数据显示
底部：趋势曲线
```

![图 9-2　项目树：HMI_RT_1 的画面、HMI 变量与运行系统设置](/images/posts/b2-room-temp-pid/46.webp)

图 9-2　项目树：HMI_RT_1 的画面、HMI 变量与运行系统设置

### 9.3 四个操作按钮

| 按钮文字 | 连接变量          |
|----------|-------------------|
| 系统启动 | `xSystemStartCmd` |
| 系统停止 | `xSystemStopCmd`  |
| 报警复位 | `xAlarmResetCmd`  |
| PID 复位 | `xPIDResetCmd`    |

按钮采用 WinCC RT Advanced V17 中实际验证成功的点动方式：`属性 → 事件 → 按下`，添加系统函数`位处理 → 按下按钮时置位`（SetBitWhileKeyPressed），变量选择对应命令变量。

该函数在按住按钮时写入 TRUE，松开后自动恢复 FALSE，因此不需要另外设置"释放"事件，比单独配置"按下 SetBit、释放 ResetBit"更安全，也不会出现命令一直保持 TRUE 的问题。

![图 9-3　"系统启动"按钮事件配置：按下按钮时置位 xSystemStartCmd](/images/posts/b2-room-temp-pid/47.webp)

图 9-3　"系统启动"按钮事件配置：按下按钮时置位 `xSystemStartCmd`

### 9.4 三个数值显示框

| 显示名称       | HMI 变量            | 模式      | 格式     |
|----------------|---------------------|-----------|----------|
| 温度设定值     | `rRoomTempSP`       | 输入/输出 | 1 位小数 |
| 房间实际温度   | `rRoomTempPV`       | 输出      | 1 位小数 |
| 加热器实际输出 | `rHeaterOutSafePct` | 输出      | 1 位小数 |

注意两点：

1.  I/O 域本身没有"显示名称"，需要单独放置`文本`对象，与 I/O 域、单位文本（℃/℃/%）摆放在同一行：

``` text
温度设定值    [ 55.0 ] ℃
房间实际温度  [ 25.0 ] ℃
加热器实际输出 [ 60.0 ] %
```

2.  画面最初显示的是 `rHeaterOutPct`（名称"PID 加热输出"），项目后期已改为显示经过安全联锁的 `rHeaterOutSafePct`，名称改为"加热器实际输出"。原因见 6.3 节。

温度设定值的输入范围在 HMI 变量中设置：打开 `HMI 变量 → HMI_B2_Tags`，选中 `rRoomTempSP`，在下方`属性 → 限值`中设置`下限：常数 0.0`、`上限：常数 75.0`。如果变量表中看不到限值列，右键列标题 → `显示/隐藏 → 上限、下限`。WinCC Advanced 的输入范围由 HMI 变量限值控制，而不是给 I/O 域添加"显示名称"。

I/O 域连接变量的方法：选中 I/O 域 → `属性 → 常规` → 找到`变量 / 过程变量`，选择对应 HMI 变量，并设置`模式`（输入/输出 或 输出）与`显示格式`（一位小数）。

![图 9-4　主画面初版：四个按钮与三个数据区、单位](/images/posts/b2-room-temp-pid/48.webp)

图 9-4　主画面初版：四个按钮与三个数据区、单位

### 9.5 设置启动画面

本项目在 TIA Portal V19 + WinCC RT Advanced V17 中验证成功的方法：

1.  在项目树中右键画面 `Scr_B2_Overview`。
2.  选择`定义为启动画面`。

执行后项目树中该画面会出现启动画面标记，不需要再在其他地方设置。

> 说明：也可以通过 `HMI_RT_1 → 运行系统设置 → 常规 → 画面 → 启动画面` 选择启动画面，两种方法等效；本项目采用右键`定义为启动画面`的方式。

### 9.6 五个状态指示灯

从右侧工具箱选择`基本对象 → 圆`，在中间区域画一个小圆，旁边添加文本。选中圆形，进入`属性 → 动画 → 添加新动画 → 外观`，连接变量并设置颜色：

| 显示名称 | 变量                | 值 0         | 值 1         |
|----------|---------------------|--------------|--------------|
| 系统就绪 | `xSystemReadySts`   | 灰色、不闪烁 | 绿色、不闪烁 |
| 系统运行 | `xSystemRunningSts` | 灰色、不闪烁 | 绿色、不闪烁 |
| 加热允许 | `xHeatingEnableSts` | 灰色、不闪烁 | 橙色、不闪烁 |
| 超温报警 | `xRoomTempHighAlm`  | 灰色、不闪烁 | 红色、闪烁   |
| PID 错误 | `xPIDErrorAlm`      | 灰色、不闪烁 | 红色、闪烁   |

建议排列：

``` text
● 系统就绪   ● 系统运行   ● 加热允许
● 超温报警   ● PID 错误
```

正常运行时：系统就绪绿色、系统运行绿色、加热允许橙色、超温报警灰色、PID 错误灰色。

![图 9-5　状态灯外观动画：变量 xRoomTempHighAlm，值 0 灰色不闪烁，值 1 红色闪烁](/images/posts/b2-room-temp-pid/49.webp)

图 9-5　状态灯外观动画：变量 `xRoomTempHighAlm`，值 0 灰色不闪烁，值 1 红色闪烁

![图 9-6　复制生成其余状态灯，五个指示灯布局完成](/images/posts/b2-room-temp-pid/50.webp)

图 9-6　复制生成其余状态灯，五个指示灯布局完成

![图 9-7　主画面完整布局：按钮、状态灯、数据显示与标题](/images/posts/b2-room-temp-pid/51.webp)

图 9-7　主画面完整布局：按钮、状态灯、数据显示与标题

### 9.7 报警记录按钮与退出仿真按钮

**报警记录按钮**：在主画面放置普通按钮，文本`报警记录`，`属性 → 事件 → 单击 → 画面 → 激活屏幕`，参数`画面名称：Scr_B2_Alarms`、`对象名：0`（报警画面见第 11 章）。

**退出仿真按钮**：在主画面放置普通按钮，文本`退出仿真`，`属性 → 事件 → 单击`添加系统函数`停止系统运行`（即本版本对应的退出 Runtime 函数）。点击后 WinCC Runtime 画面关闭并自动返回 TIA Portal，虚拟机和 S7-PLCSIM 保持运行（背景见第 13 章）。

### 9.8 通信验证

完成 HMI 编译（目标：错误 0）后，启动 S7-PLCSIM 并下载 PLC 程序，确认 CPU 处于 RUN，再选中 `HMI_RT_1 [WinCC RT Advanced]` 点击`开始仿真`。

运行画面打开后先检查初始状态：

- 温度设定值显示正常（如 `55.0 ℃`）
- 房间实际温度显示正常数值
- 加热输出显示 `0.0%`
- "系统就绪"灯变成绿色
- 数值框没有显示 `####`

以上正常即说明 HMI 与 PLC 通信成功。

![图 9-8　HMI 与 PLC 通信正常：就绪灯绿色，设定值、实际温度、输出显示正确](/images/posts/b2-room-temp-pid/52.webp)

图 9-8　HMI 与 PLC 通信正常：就绪灯绿色，设定值、实际温度、输出显示正确

------------------------------------------------------------------------

## 10. 温度趋势

### 10.1 趋势视图组态

1.  退出 HMI 仿真，打开 `Scr_B2_Overview`。
2.  在右侧`工具箱`中找到`控件 → 趋势视图`（本项目画面中趋势标题为"房间温度实时趋势"）。
3.  将趋势视图拖到画面下方空白区域，横向铺满，不遮挡按钮和数据显示。

选中趋势视图，进入`属性 → 常规 → 趋势`，添加两条趋势：

| 趋势名称     | 数据源变量    | 趋势类型     | 颜色 |
|--------------|---------------|--------------|------|
| 温度设定值   | `rRoomTempSP` | 触发的实时值 | 蓝色 |
| 房间实际温度 | `rRoomTempPV` | 触发的实时值 | 绿色 |

坐标轴设置：

``` text
趋势值：100（约 100 个采样点）
Y 轴（左侧值轴，取消自动范围）：0 ～ 80 ℃
时间范围：约 1 分钟
```

注意选择的是 HMI 变量表中的变量（`HMI_B2_Tags.rRoomTempSP`、`HMI_B2_Tags.rRoomTempPV`），不要直接手动输入 PLC 地址。

> 关于趋势类型名称：本项目界面为 WinCC RT Advanced V17，下拉选项为`触发的实时值`、`实时位触发`、`触发的缓冲区位`、`数据记录`。其中`触发的实时值`按时间周期读取当前变量，适合温度趋势。早期笔记中"选择循环的实时趋势"的说法不适用于 V17，见第 13 章故障排查。

![图 10-1　趋势视图组态：两条趋势的名称、趋势值 100、趋势类型与变量来源](/images/posts/b2-room-temp-pid/59.webp)

图 10-1　趋势视图组态：两条趋势的名称、趋势值 100、趋势类型与变量来源

![图 10-2　趋势类型下拉选项（WinCC RT Advanced V17）：触发的实时值、触发的缓冲区位、触发的头时值补、实时位触发、数据记录](/images/posts/b2-room-temp-pid/60.webp)

图 10-2　趋势类型下拉选项（WinCC RT Advanced V17）

### 10.2 测试一：25 ℃ 升温至 55 ℃ 闭环跟随

点击`系统启动`后观察趋势：

- 蓝线（设定温度）稳定在 `55 ℃`
- 绿线（实际温度）从约 `25 ℃` 平稳上升
- 实际温度逐渐逼近设定值，无明显超调或振荡
- PID 输出稳定在约 `60%`

![图 10-3　升温跟随测试：实际温度从 25 ℃ 附近开始上升](/images/posts/b2-room-temp-pid/61.webp)

图 10-3　升温跟随测试：实际温度从 25 ℃ 附近开始上升

![图 10-4　升温跟随测试：温度持续逼近设定值](/images/posts/b2-room-temp-pid/62.webp)

图 10-4　升温跟随测试：温度持续逼近设定值

![图 10-5　升温跟随测试：实际温度达到 54.3 ℃，逐渐逼近 55 ℃ 设定值，PID 输出稳定](/images/posts/b2-room-temp-pid/63.webp)

图 10-5　升温跟随测试：实际温度达到 54.3 ℃，逐渐逼近 55 ℃ 设定值，PID 输出稳定

**为什么接近设定值以后 PID 输出不会降为零**：房间一直在向环境散热，散热速率与温差成正比。要维持 55 ℃ 恒温，加热器必须持续输出约 60% 来抵消这部分热损失；如果输出降为 0，房间温度会立刻开始下降。这也是"单加热、无制冷"系统的正常特性。

### 10.3 测试二：设定值由 55 ℃ 阶跃降至 45 ℃

系统保持运行，将温度设定值从 `55.0 ℃` 改成 `45.0 ℃`，观察趋势约 1～2 分钟。

预期现象：蓝线立即从 55 降到 45；PID 输出快速降低（本项目中从约 `60%` 降到约 `40%`，未降到 0）；由于系统只有加热、没有制冷，实际温度只能依靠自然散热缓慢下降；接近 45 ℃ 后，PID 重新给出一定加热输出以维持温度。

实际结果与预期一致：设定值蓝线立即降到 45 ℃，实际温度绿线从约 55 ℃ 开始缓慢下降，PID 输出降到约 40%。此时输出虽低于维持 52 ℃ 所需的量（房间因此降温），但接近 45 ℃ 后的约 40% 输出正好用于抵消房间散热。

![图 10-6　阶跃测试：设定值由 55 ℃ 降至 45 ℃，实际温度缓慢跟随下降](/images/posts/b2-room-temp-pid/64.webp)

图 10-6　阶跃测试：设定值由 55 ℃ 降至 45 ℃，实际温度缓慢跟随下降

------------------------------------------------------------------------

## 11. HMI 离散量报警

### 11.1 报警原理

``` text
PLC 报警变量变为 TRUE
    ↓
HMI 生成带时间和文本的报警记录
    ↓
报警视图显示"进入、确认、离开"
```

### 11.2 使用 Word 报警触发字（关键结论）

WinCC RT Advanced V17 的离散量报警**不能直接用 BOOL 变量触发**——直接选择 PLC 中的 BOOL 变量会提示"变量的数据类型不适用于此类报警"。因此本项目在 `DB_B2_Control` 中增加一个 Word 类型的报警触发字，用不同位代表不同报警：

| 变量名             | 类型 | 起始值    | 注释                 |
|--------------------|------|-----------|----------------------|
| `wHMIAlarmTrigger` | Word | W#16#0000 | HMI 离散量报警触发字 |

位分配：

| 位        | 存放内容                       |
|-----------|--------------------------------|
| Bit 0     | `xRoomTempHighAlm`（超温报警） |
| Bit 1     | `xPIDErrorAlm`（PID 错误）     |
| Bit 2～15 | 保留                           |

对应数值：

| 报警状态         | `wHMIAlarmTrigger` |
|------------------|--------------------|
| 无报警           | 0                  |
| 只有超温报警     | 1                  |
| 只有 PID 错误    | 2                  |
| 两个报警同时存在 | 3                  |

### 11.3 PLC 侧逻辑（OB_Main 程序段 9、10）

**程序段 9：生成 HMI 离散量报警触发字（超温）**

``` text
|----[ xRoomTempHighAlm ]----( wHMIAlarmTrigger.%X0 )----|
```

即 `"DB_B2_Control".xRoomTempHighAlm` 驱动 `"DB_B2_Control".wHMIAlarmTrigger.%X0`。

![图 11-1　程序段 9：xRoomTempHighAlm 驱动 wHMIAlarmTrigger.%X0](/images/posts/b2-room-temp-pid/68.webp)

图 11-1　程序段 9：`xRoomTempHighAlm` 驱动 `wHMIAlarmTrigger.%X0`

**程序段 10：生成 HMI 的 PID 错误触发位**

``` text
|----[ xPIDErrorAlm ]----( wHMIAlarmTrigger.%X1 )----|
```

即 `"DB_B2_Control".xPIDErrorAlm` 驱动 `"DB_B2_Control".wHMIAlarmTrigger.%X1`。

两个程序段只是把两个 BOOL 报警"装进"一个 WORD 变量让 HMI 读取，并不重新判断报警。`%X0`/`%X1` 表示 WORD 变量的第 0 位/第 1 位。完成后编译 PLC，目标错误 0。

### 11.4 HMI 变量

在 `HMI_B2_Tags` 新增：

| 项目     | 填写内容                                                |
|----------|---------------------------------------------------------|
| 名称     | `wHMIAlarmTrigger`                                      |
| 数据类型 | Word                                                    |
| 连接     | `HMI_Conn_PLC1`                                         |
| PLC 变量 | `DB_B2_Control.wHMIAlarmTrigger`                        |
| 访问模式 | 符号访问                                                |
| 采集周期 | 1 s                                                     |
| 注释     | HMI 离散量报警触发字，bit0 为超温报警，bit1 为 PID 错误 |

### 11.5 建立离散量报警

项目树 → `HMI_RT_1` → `HMI 报警` → `离散量报警`，点击第一行`<添加>`建立两条报警：

| 名称               | 报警文本                             | 报警类别 | 触发变量           | 触发位 |
|--------------------|--------------------------------------|----------|--------------------|--------|
| `Alm_RoomTempHigh` | 房间温度超过允许上限，系统已停止加热 | Errors   | `wHMIAlarmTrigger` | 0      |
| `Alm_PIDError`     | PID 控制器发生错误，请检查错误代码   | Errors   | `wHMIAlarmTrigger` | 1      |

填写注意：

- `ID` 让系统自动生成，不要手动修改。
- `触发变量` 通过下拉按钮从 `HMI_B2_Tags` 中选择 `wHMIAlarmTrigger`；不要选择 `iPIDState`，它是 PID 运行状态，不是报警触发字。
- `触发器地址` 自动生成（分别为 `.x0`、`.x1`）。
- `HMI 确认变量`、`HMI 确认位`、`HMI 确认地址`和`报表`暂时全部留空。

![图 11-2　离散量报警编辑器（V17 列布局）](/images/posts/b2-room-temp-pid/65.webp)

图 11-2　离散量报警编辑器（V17 列布局）

![图 11-3　两条报警的最终配置：触发变量 wHMIAlarmTrigger，触发位 0 和 1](/images/posts/b2-room-temp-pid/69.webp)

图 11-3　两条报警的最终配置：触发变量 `wHMIAlarmTrigger`，触发位 0 和 1

### 11.6 报警画面 Scr_B2_Alarms

项目树 → `HMI_RT_1` → `画面`，双击`添加新画面`，名称 `Scr_B2_Alarms`。不把报警列表塞进主画面（主画面已有趋势图），独立报警画面更符合工程项目结构。

画面布局：

``` text
顶部：标题"B2 房间恒温PID系统——报警记录"
右上角："返回主画面"按钮
中间及下方：报警视图
```

放置报警视图：工具箱 → `控件 → 报警视图`，拖到画面中下部，对象名称改为 `AlmView_B2`。

报警视图配置（选中 `AlmView_B2` → `属性`）：

| 属性页 | 设置                                                                                                                      |
|--------|---------------------------------------------------------------------------------------------------------------------------|
| 常规   | 显示内容选择`报警缓冲区`；报警类别仅勾选 `Errors`                                                                         |
| 列     | 显示：报警编号、时间、日期、报警状态、报警文本、报警类别、确认组；排序：按日期时间降序；`可诊断`和`PLC（出错位置）`不勾选 |
| 工具栏 | 勾选`确认`；`信息文本`、`报警循环`不勾选；工具栏样式：按钮                                                                |

其他类别（Warnings、System、Diagnosis events、Acknowledgement、No Acknowledgement）暂不勾选；不启用`删除报警`，避免误清空记录；也不选`报警记录`（需要另外建立报警日志）。

![图 11-4　报警视图常规属性：报警缓冲区，仅勾选 Errors](/images/posts/b2-room-temp-pid/70.webp)

图 11-4　报警视图常规属性：报警缓冲区，仅勾选 Errors

![图 11-5　报警视图"列"属性：显示列与排序设置](/images/posts/b2-room-temp-pid/71.webp)

图 11-5　报警视图"列"属性：显示列与排序设置

![图 11-6　报警视图"工具栏"属性：启用确认按钮](/images/posts/b2-room-temp-pid/72.webp)

图 11-6　报警视图"工具栏"属性：启用确认按钮

**返回主画面按钮**：在 `Scr_B2_Alarms` 放置普通按钮，文本`返回主画面`，`属性 → 事件 → 单击`添加函数`画面 → 激活屏幕`（ActivateScreen），`画面名称`设为 `Scr_B2_Overview`，`对象名`保持 0。该按钮不绑定任何 PLC 变量。

画面切换关系：

``` text
主画面"报警记录"  → Scr_B2_Alarms
报警画面"返回主画面" → Scr_B2_Overview
```

![图 11-7　"激活屏幕"函数选择](/images/posts/b2-room-temp-pid/73.webp)

图 11-7　"激活屏幕"函数选择

![图 11-8　"激活屏幕"参数：画面名称 Scr_B2_Overview，对象名 0](/images/posts/b2-room-temp-pid/74.webp)

图 11-8　"激活屏幕"参数：画面名称 `Scr_B2_Overview`，对象名 0

### 11.7 报警测试

测试方法：在 PLC 监控表中临时将 `rRoomTempHighLimit` 从原值改小（如 `20.0`），使当前房间温度高于上限，触发：

``` text
xRoomTempHighAlm = TRUE
wHMIAlarmTrigger = W#16#0001
```

进入 HMI `报警记录` 画面，报警列表出现"房间温度超过允许上限，系统已停止加热"。

**报警进入**：

![图 11-9　超温报警进入：状态 I，报警文本完整](/images/posts/b2-room-temp-pid/75.webp)

图 11-9　超温报警进入：状态 `I`，报警文本完整

**报警确认**：选中报警记录，点击工具栏带对勾的`确认`按钮。确认只改变 HMI 中该条报警的状态标记，不会清除 PLC 报警，也不会恢复系统运行。

![图 11-10　报警确认：新增 (I)A 记录，超温灯仍为红色，系统保持停止](/images/posts/b2-room-temp-pid/76.webp)

图 11-10　报警确认：新增 `(I)A` 记录，超温灯仍为红色，系统保持停止

![图 11-11　确认后的报警视图：I 与 (I)A 两条记录并存](/images/posts/b2-room-temp-pid/77.webp)

图 11-11　确认后的报警视图：`I` 与 `(I)A` 两条记录并存

**报警消失与复位**：将 `rRoomTempHighLimit` 恢复原值，确认 `rRoomTempPV ≤ rRoomTempHighResetLimit`，返回主画面单击一次`报警复位`。预期：超温报警灯变灰、系统就绪灯重新变绿、系统运行仍为灰色、加热允许仍为灰色、输出保持 0%。报警缓冲区保留原记录并新增"报警离开"状态。

![图 11-12　报警复位后的主画面：超温灯熄灭、就绪恢复绿色、系统仍停止、输出为 0，报警记录按钮与趋势正常](/images/posts/b2-room-temp-pid/78.webp)

图 11-12　报警复位后的主画面：超温灯熄灭、就绪恢复绿色、系统仍停止、输出为 0

![图 11-13　报警全生命周期记录：I（进入）、(I)A（已确认）、(IA)O（确认后离开）](/images/posts/b2-room-temp-pid/79.webp)

图 11-13　报警全生命周期记录：`I`（进入）、`(I)A`（已确认）、`(IA)O`（确认后离开）

报警状态标记含义：

| 状态    | 含义           |
|---------|----------------|
| `I`     | 报警进入       |
| `(I)A`  | 报警已确认     |
| `(IA)O` | 报警确认后离开 |

### 11.8 HMI 报警确认与 PLC 报警复位的区别

这两个是不同的动作，不能混淆：

``` text
HMI 报警确认：操作员表示已经看到报警（只改变 HMI 报警记录的状态）
PLC 报警复位：故障条件消失后，由 PLC 程序清除报警位
```

报警确认不会清除 PLC 的报警位，也不会让系统恢复运行；只有故障条件消失并执行 PLC 报警复位后，系统才重新就绪。

------------------------------------------------------------------------

## 12. 联合仿真与验收测试

本章汇总整台系统的联调与验收结果。测试环境：TIA Portal V19 + S7-PLCSIM + WinCC RT Advanced V17，PLC 与 HMI 通过 `HMI_Conn_PLC1` 通信。

### 12.1 验收测试记录

| 序号 | 测试项               | 测试条件                                         | 操作步骤                                  | 预期结果                                     | 实际结果                                                                                | 是否通过 |
|------|----------------------|--------------------------------------------------|-------------------------------------------|----------------------------------------------|-----------------------------------------------------------------------------------------|----------|
| 1    | 初始状态             | PLC RUN，HMI 仿真已启动，未做任何操作            | 观察 HMI 画面                             | 就绪灯绿色，运行/加热灯灰色，输出 0.0%       | 设定值、实际温度、输出显示正常，就绪灯绿色，无报警                                      | 通过     |
| 2    | 系统启动             | 系统就绪，无报警                                 | 单击一次`系统启动`                        | 运行灯绿色，加热允许灯橙色，输出上升         | 运行灯绿色、加热允许灯橙色，PID 输出从 0% 上升                                          | 通过     |
| 3    | PID 升温             | 系统运行中，设定值 55 ℃                          | 观察趋势约 1～2 分钟                      | 温度平稳上升并逼近 55 ℃，无明显超调          | 实际温度升至 38.9 ℃→54.3 ℃，输出稳定约 60%，无超调振荡                                  | 通过     |
| 4    | 系统停止             | 系统运行中                                       | 单击`系统停止`                            | 运行/加热灯变灰，输出降为 0.0%，温度回落     | 就绪保持绿色，运行、加热变灰，输出 0.0%，温度 43.2 ℃ 后逐渐下降                         | 通过     |
| 5    | 超温联锁             | 临时将 `rRoomTempHighLimit` 改小于当前温度       | 在监控表修改限值并观察                    | 超温报警灯红色闪烁，系统停止，安全输出 0.0%  | 超温灯红色闪烁，就绪/运行/加热全部关闭，输出 0.0%                                       | 通过     |
| 6    | 报警确认             | 报警存在                                         | 报警画面选中记录，点`确认`                | 状态由 I 变为 (I)A，PLC 报警不消失           | 新增 (I)A 记录，超温灯仍红色，系统仍停止                                                | 通过     |
| 7    | 报警条件消失         | 恢复 `rRoomTempHighLimit` 原值，温度低于复位限值 | 在监控表恢复限值                          | 报警条件解除，等待复位                       | 条件解除，缓冲区新增离开记录（复位后显示）                                              | 通过     |
| 8    | 报警复位             | 故障条件已消失                                   | 主画面单击`报警复位`                      | 超温灯熄灭，就绪恢复绿色，系统仍停止         | 与预期一致，输出保持 0.0%                                                               | 通过     |
| 9    | 55 ℃→45 ℃ 阶跃       | 系统运行中，温度稳定                             | 设定值改为 45.0 ℃                         | 蓝线立即下降，温度缓慢下降，输出降低后维持   | 设定值立即降为 45 ℃，输出降至约 40%，温度缓慢跟随                                       | 通过     |
| 10   | HMI 画面切换         | 系统任意状态                                     | 主画面点`报警记录`，再点`返回主画面`      | 双向切换正常                                 | 切换正常                                                                                | 通过     |
| 11   | Runtime 退出         | HMI 仿真运行中                                   | 单击`退出仿真`按钮                        | Runtime 关闭，返回 TIA Portal，PLCSIM 不关闭 | Runtime 关闭，虚拟机与 PLCSIM 保持运行                                                  | 通过     |
| 12   | 冷启动重新下载和运行 | 关闭 Runtime 与 PLCSIM 后重新启动                | 重新下载 PLC 程序，CPU RUN，启动 HMI 仿真 | 各功能正常，报警缓冲区可能清空               | 初始就绪灯绿色；启动、停止、趋势、画面切换均正常；缓冲区因 Runtime 重启清空（正常现象） | 通过     |

> 测试过程截图较多，正文中保留代表性结果图（图 9-8、图 10-3～图 10-6、图 11-9～图 11-13），联锁四项测试的动态过程见图 6-9～图 6-11 的 GIF。

### 12.2 闭环运行与停止的代表性画面

![图 12-1　闭环运行画面：就绪/运行绿色、加热允许橙色，设定 55.0 ℃，实际 38.9 ℃，输出 60.1%](/images/posts/b2-room-temp-pid/57.webp)

图 12-1　闭环运行画面：就绪/运行绿色、加热允许橙色，设定 `55.0 ℃`，实际 `38.9 ℃`，输出 `60.1%`

![图 12-2　系统停止画面：运行/加热变灰，就绪保持绿色，输出降为 0.0%，温度 43.2 ℃ 后逐渐回落](/images/posts/b2-room-temp-pid/58.webp)

图 12-2　系统停止画面：运行/加热变灰，就绪保持绿色，输出降为 `0.0%`，温度 `43.2 ℃` 后逐渐回落

启动与停止的完整运行演示动图见文首「运行演示动图」（图 D-1、图 D-2）。

### 12.3 冷启动验收要点

冷启动指关闭 WinCC Runtime 和当前 S7-PLCSIM 实例后，重新启动 S7-PLCSIM、重新下载完整 PLC 程序并启动 HMI 仿真，验证项目不依赖上一次的运行状态。冷启动后报警缓冲区可能被清空，这是正常的；报警的完整生命周期已在冷启动前验证通过，冷启动不再重复制造超温或 PID 错误。

------------------------------------------------------------------------

## 13. 常见问题与故障排查

本章集中记录项目中实际遇到的问题，均已在项目中验证解决。

### 13.1 HMI 仿真全屏后无法退出

- **现象**：进入 WinCC Runtime 仿真后无法退出全屏画面。
- **原因**：HMI 画面没有配置"退出运行系统"按钮。
- **解决方法**：临时可用 `Alt + F4`；若无反应，用 `Alt + Tab` 切回 TIA Portal 点击工具栏红色方块`停止仿真/停止运行系统`；仍无法退出时，用 `Ctrl + Shift + Esc` 打开任务管理器，结束 `SIMATIC WinCC Runtime Advanced` 进程。根本解决方法是在主画面增加`退出仿真`按钮，在`单击`事件中调用系统函数`停止系统运行`（见 9.7 节）。
- **验证结果**：点击`退出仿真`后 Runtime 画面关闭，自动返回 TIA Portal，虚拟机和 S7-PLCSIM 保持运行。

### 13.2 PROFINET 设备名称编译错误

- **现象**：编译 PLC 报错，错误 1、警告 2，信息为"'在设备中直接设置 PROFINET 设备名称'选项必须与在设…"，位置为 `PLC_1 → PROFINET 接口 → X1`。
- **原因**：IP 地址选择了"在项目中设置"，但 PROFINET 设备名称选择了"在设备中直接设置"，两种方式不一致。
- **解决方法**：`PLC_1 → 设备组态`，选中 CPU 绿色网口 `X1`，进入`属性 → 常规 → 以太网地址`，保持`在项目中设置 IP 地址`（192.168.0.1），取消勾选`在设备中直接设定 PROFINET 设备名称`，保持`自动生成 PROFINET 设备名称`，重新编译。两个黄色警告（CPU 未设置访问保护密码）可暂时忽略，目标结果为错误 0、警告 2。
- **验证结果**：修改后编译通过，PLC 下载成功（错误 0、警告 0）。

![图 13-1　项目树中出现编译错误标记](/images/posts/b2-room-temp-pid/53.webp)

图 13-1　项目树中出现编译错误标记

![图 13-2　编译错误信息：PROFINET 设备名称设置方式与 IP 设置方式不一致](/images/posts/b2-room-temp-pid/54.webp)

图 13-2　编译错误信息：PROFINET 设备名称设置方式与 IP 设置方式不一致

### 13.3 错误下载 PC Station

- **现象**：在线记录中出现"通过地址 IP=192.168.0.2 连接到 IE general_1 失败"，项目树上留下红色标记。
- **原因**：误选中 `HMI_B2_PC [SIMATIC PC station]` 执行了"下载到设备"。本项目做的是本机 WinCC Runtime 仿真，PC 站硬件组态不需要下载到 `192.168.0.2`。
- **解决方法**：改为选中 `HMI_RT_1 [WinCC RT Advanced]`，先`编译 → 软件（全部重新编译）`，编译无错误后直接`开始仿真`，不是"下载到设备"。项目树上的红色标记是下载失败残留的状态，不影响 HMI 仿真。
- **验证结果**：PLC 下载成功（错误 0、警告 0，已通过地址 IP=192.168.0.1 连接到 PLC_1），HMI 仿真正常启动。

![图 13-3　修改后重新下载，项目树仍残留下载失败留下的红色标记（不影响仿真）](/images/posts/b2-room-temp-pid/55.webp)

图 13-3　修改后重新下载，项目树仍残留下载失败留下的红色标记（不影响仿真）

![图 13-4　在线记录：IE general_1（192.168.0.2）连接失败与 PLC_1（192.168.0.1）下载成功的对比](/images/posts/b2-room-temp-pid/56.webp)

图 13-4　在线记录：IE general_1（192.168.0.2）连接失败与 PLC_1（192.168.0.1）下载成功的对比

### 13.4 HMI 无法直接使用 BOOL 报警变量

- **现象**：离散量报警的触发变量直接选择 PLC 中的 BOOL 变量（如 `xRoomTempHighAlm`、`xPIDErrorAlm`）时，提示"变量的数据类型不适用于此类报警"。
- **原因**：WinCC RT Advanced V17 的离散量报警需要 Word/Int 类型的"报警触发字"，再用不同位区分不同报警，不支持 BOOL 变量直接触发。
- **解决方法**：在 `DB_B2_Control` 中新增 Word 变量 `wHMIAlarmTrigger`，在 OB_Main 程序段 9、10 中把两个 BOOL 报警分别装入 bit0、bit1，HMI 报警改用该 Word 变量触发（完整方案见第 11 章）。
- **验证结果**：报警配置保存成功，超温报警进入、确认、离开全流程测试通过。

![图 13-5　选择 BOOL 变量作为触发变量时报错：变量的数据类型不适用于此类报警](/images/posts/b2-room-temp-pid/66.webp)

图 13-5　选择 BOOL 变量作为触发变量时报错：变量的数据类型不适用于此类报警

![图 13-6　触发变量列表中只有 Int 等类型变量可用，BOOL 变量无法选择](/images/posts/b2-room-temp-pid/67.webp)

图 13-6　触发变量列表中 BOOL 变量无法选择

### 13.5 WinCC V17 趋势类型名称不同

- **现象**：按其他版本资料选择"循环的实时趋势"时，在本项目 V17 界面中找不到该选项。
- **原因**：不同版本的趋势类型名称不同。本项目界面为 WinCC RT Advanced V17，实际选项为`触发的实时值`、`实时位触发`、`触发的缓冲区位`、`数据记录`。
- **解决方法**：两条曲线均选择`触发的实时值`（按时间周期读取当前变量，适合连续温度趋势），趋势值 100。
- **验证结果**：趋势连续显示正常，升温跟随与阶跃测试曲线完整。

### 13.6 HMI I/O 域属性位置与其他版本不同

- **现象**：按其他版本资料在 I/O 域上找不到"显示名称"等属性。
- **原因**：V17 中 I/O 域本身只负责显示或输入数值，不包含名称；数值说明需要单独放置`文本`对象。连接变量在`属性 → 常规 → 变量 / 过程变量`中设置。
- **解决方法**：每个数值框左侧放置文本对象，右侧放置单位文本（℃/%），三者同一行；输入范围通过 HMI 变量的`属性 → 限值`设置，而不是给 I/O 域添加属性。
- **验证结果**：三个数值框显示与输入均正常。

### 13.7 报警确认后 PLC 报警仍然存在

- **现象**：在报警视图点击确认后，主画面超温报警灯仍然为红色，系统仍未恢复。
- **原因**：HMI 报警确认只是操作员"已看到报警"的标记，不会清除 PLC 报警位，也不会恢复系统运行。
- **解决方法**：先在监控表恢复 `rRoomTempHighLimit` 原值使故障条件消失，再在主画面执行`报警复位`清除 PLC 报警位（区别见 11.8 节）。
- **验证结果**：复位后超温灯熄灭、就绪恢复绿色、系统保持停止，需重新启动。

### 13.8 报警缓冲区在 Runtime 重启后可能清空

- **现象**：冷启动重新下载并再次打开 Runtime 后，之前的报警缓冲记录不见了。
- **原因**：WinCC RT Advanced 的报警缓冲区保存在 Runtime 内存中，Runtime 重启后会被清空；如需长期保存须另外配置报警记录/日志。
- **解决方法**：本项目接受该行为，冷启动验收时不再重复报警测试；重要报警的长期存储留待后续项目用数据记录实现。
- **验证结果**：冷启动后报警视图为空属正常现象，报警功能本身正常。

### 13.9 趋势表格短暂出现

- **现象**：趋势下方表格的时间/数值列短暂显示 `########`。
- **原因**：光标对应的时间点还没有有效数据（或列宽不足），属于显示问题，不是通信故障。
- **解决方法**：等待数据刷新或适当加宽列。
- **验证结果**：后续截图中显示正常，不影响趋势功能。

------------------------------------------------------------------------

## 14. 项目归档与重新打开

### 14.1 生成归档文件

TIA Portal 项目应使用自带的`归档`功能生成 `.zap19` 文件，不要直接压缩项目文件夹。

操作步骤：

1.  关闭 WinCC Runtime 仿真，停止在线监控。
2.  保存项目（`Ctrl + S`）。
3.  点击顶部菜单：`项目 → 归档`（英文界面为 `Project → Archive`）。
4.  选择保存位置，建议新建文件夹 `B2_RoomTempPID项目归档`。
5.  归档文件名建议：`B2_RoomTempPID_S71500_V1.0_20260907`，TIA 自动生成 `B2_RoomTempPID_S71500_V1.0_20260907.zap19`。
6.  如出现"丢弃可恢复数据"等附加选项，保持默认。
7.  点击`归档`，等待完成。

> 说明：原始笔记中"项目 → 恢复"的说法不准确——归档用`项目 → 归档`；重新打开归档文件应使用`项目 → 打开`直接选择 `.zap19`（方法见下节）。

### 14.2 重新打开归档（本项目实测方法）

在本机 TIA Portal V19 中实际验证成功的打开方法：

1.  启动 TIA Portal V19。
2.  选择`项目 → 打开`。
3.  选择 `.zap19` 归档文件。
4.  选择一个新的恢复目录。
5.  等待恢复并打开项目。
6.  编译 PLC 和 HMI，检查错误为 0。

### 14.3 推荐归档资料结构

``` text
B2_RoomTempPID项目归档
├── 01_TIA项目
│   └── B2_RoomTempPID_S71500_V1.0_20260907.zap19
├── 02_程序截图
├── 03_HMI截图
├── 04_测试记录
├── 05_项目说明
└── 06_仿真视频
```

------------------------------------------------------------------------

## 15. 项目总结与下一阶段

### 15.1 本项目已掌握的能力

- PLC 结构化编程（OB/FB/DB 的分工与调用关系）
- FB 和实例 DB（静态变量保存周期之间的状态）
- 循环中断 OB（固定周期执行与时间相关的程序）
- PID 闭环控制（PID_Compact 组态、模式激活、状态监控）
- 被控对象仿真（用 FB 建立一阶热平衡模型补全闭环）
- 安全联锁（停止、超温、PID 错误三级切断，报警锁存与复位）
- HMI 变量、按钮、状态灯（点动命令、外观动画）
- 趋势和报警（实时趋势、Word 触发字离散量报警、缓冲区记录）
- PLC/HMI 联合仿真（网络组态、HMI 连接、联合调试）
- 项目归档（`.zap19` 归档与重新打开验证）

### 15.2 下一阶段可以衔接的方向

- 电机启停与正反转控制
- 变频器速度控制
- Factory I/O 联动仿真
- NX MCD 机械仿真
- 伺服定位与运动控制

------------------------------------------------------------------------

## 附录 A　待人工确认项

以下内容无法从现有项目截图中完全确认，整理时未做臆测，列出供后续核对：

1.  `xPIDResetCmd` 的完整注释（DB 截图中被截断为"TRUE 时 PID 处于手动…"，完整表述待核对）。
2.  HMI 变量表总数：截图标题栏显示 `HMI_B2_Tags [14]`，但表格中可见 15 行变量（含 `xSimResetCmd`），后期又新增 `wHMIAlarmTrigger`，最终总数待核对。
3.  报警缓冲区大小、报警记录（日志）等长期存储设置未在截图中出现，是否配置待确认。
4.  趋势"趋势值 100"的确切含义（推断为约 100 个采样点）。
5.  归档恢复时使用的目标目录名称。
6.  早期文字中出现、但未出现在最终 DB 截图中的变量：`rRoomTempLowLimit`、`xPIDActiveSts`、`rTempRiseRate`、`rTempLossRate`（其中后两者与 FB 临时变量 `rHeatRate`、`rHeatLossRate` 含义相同，疑为早期命名）。

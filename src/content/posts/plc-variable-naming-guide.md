---
title: 西门子PLC变量命名规范：从基础变量到PID项目
published: 2026-09-04
description: 建立一套适用于TIA Portal、S7-1200和S7-1500项目的变量、信号及程序块命名规则。
tags:
  - PLC
  - 变量命名
  - TIA Portal
  - S7-1200
  - S7-1500
category: PLC基础
draft: false
---

## 一、为什么要建立变量命名规则

PLC程序本身可能并不复杂，真正困难的是面对一个控制需求时，不知道：

- 需要建立哪些变量；
- 每个变量代表什么；
- 变量之间是什么关系；
- 哪些是命令，哪些是状态；
- 哪些来自现场，哪些由程序内部产生；
- 几个月后还能不能看懂自己的程序。

因此，变量命名的目的不是“把中文翻译成英文”，而是让变量名称直接表达它在控制系统中的作用。

本博客后续项目统一采用：

```text
数据类型前缀 + 控制对象 + 功能含义 + 必要的状态或单位后缀
```

例如：

```text
xSystemStartCmd
│    │       └── Cmd：命令
│    └────────── SystemStart：系统启动
└─────────────── x：BOOL类型
```

中文含义为：**系统启动命令**。

---

## 二、基本命名原则

### 1. 英文变量名配中文注释

程序变量使用英文，注释使用中文。

```text
xMotorStartCmd    电机启动命令
xMotorRunFbk      电机运行反馈
xMotorFaultAlm    电机故障报警
```

这样既方便工程交流，也能避免只看英文时不理解变量的真实用途。

### 2. 不使用没有含义的名称

不推荐：

```text
M1
Temp1
Data2
Flag3
Real1
Test
```

推荐：

```text
xConveyorStartCmd
rRoomTempPV
iPressureRawAI
xOverTempAlm
```

### 3. 变量名不直接使用PLC地址

不推荐：

```text
I0_0
Q0_1
MW10
DB20_Data
```

推荐：

```text
xStartPB
xMotorContactorDO
iRoomTempRawAI
rRoomTempPV
```

硬件地址可能调整，但变量的功能含义通常不会改变。

### 4. 同一个项目只使用一套规则

不能在同一个项目中同时出现：

```text
MotorStart
motor_start
MOTORSTART
Start_Motor
xMotorStartCmd
```

本博客统一使用：

```text
xMotorStartCmd
```

即：**小写数据类型前缀 + 大驼峰功能名称**。

---

## 三、常用数据类型前缀

| 前缀  | PLC数据类型     | 示例             | 中文含义       |
| ----- | --------------- | ---------------- | -------------- |
| `x`   | BOOL            | `xSystemReady`   | 系统就绪       |
| `by`  | BYTE            | `byDeviceStatus` | 设备状态字节   |
| `w`   | WORD            | `wAlarmWord`     | 报警状态字     |
| `dw`  | DWORD           | `dwStatusCode`   | 状态双字       |
| `i`   | INT             | `iRoomTempRawAI` | 温度原始模拟量 |
| `di`  | DINT            | `diTotalCount`   | 累计数量       |
| `ui`  | UINT            | `uiProductCount` | 无符号产品数量 |
| `r`   | REAL            | `rRoomTempPV`    | 房间实际温度   |
| `lr`  | LREAL           | `lrEnergyTotal`  | 能耗累计值     |
| `t`   | TIME            | `tStartDelay`    | 启动延时时间   |
| `dt`  | DTL             | `dtFaultTime`    | 故障发生时间   |
| `str` | STRING          | `strDeviceName`  | 设备名称       |
| `arr` | ARRAY           | `arrRoomTemp`    | 温度数据数组   |
| `st`  | STRUCT或UDT实例 | `stMotorData`    | 电机结构数据   |

初学阶段最常用的是：

```text
x    BOOL布尔量
i    INT整数
r    REAL浮点数
t    TIME时间
```

---

## 四、常用功能后缀

| 后缀    | 英文          | 中文含义     | 示例                |
| ------- | ------------- | ------------ | ------------------- |
| `Cmd`   | Command       | 控制命令     | `xMotorStartCmd`    |
| `Sts`   | Status        | 状态         | `xSystemRunningSts` |
| `Fbk`   | Feedback      | 现场反馈     | `xMotorRunFbk`      |
| `En`    | Enable        | 使能         | `xPIDEn`            |
| `Req`   | Request       | 请求         | `xResetReq`         |
| `Ack`   | Acknowledge   | 确认         | `xAlarmAck`         |
| `Rst`   | Reset         | 复位         | `xPIDRst`           |
| `Alm`   | Alarm         | 报警         | `xOverTempAlm`      |
| `Warn`  | Warning       | 警告         | `xTempHighWarn`     |
| `Err`   | Error         | 错误         | `xSensorErr`        |
| `Ready` | Ready         | 就绪         | `xSystemReady`      |
| `Busy`  | Busy          | 正在执行     | `xValveBusy`        |
| `Done`  | Done          | 执行完成     | `xHomingDone`       |
| `SP`    | Setpoint      | 设定值       | `rRoomTempSP`       |
| `PV`    | Process Value | 过程实际值   | `rRoomTempPV`       |
| `Out`   | Output        | 计算输出值   | `rHeaterOut`        |
| `Raw`   | Raw Value     | 未换算原始值 | `iRoomTempRawAI`    |
| `PB`    | Push Button   | 现场按钮     | `xStartPB`          |

### PB是什么意思

`PB`是`Push Button`的缩写，表示现场实体按钮。

```text
xStartPB    现场启动按钮
xStopPB     现场停止按钮
xResetPB    现场复位按钮
```

按钮输入和程序命令不能混为一谈：

```text
xStartPB          现场启动按钮输入
xSystemStartCmd   程序处理后的系统启动命令
```

---

## 五、数字量与模拟量信号命名

### 1. 数字量输入DI

```text
xStartPB
xStopPB
xMotorRunFbk
xMotorFaultFbk
xCylinderExtendLS
xSafetyDoorClosed
```

其中：

- `PB`：按钮；
- `Fbk`：反馈；
- `LS`：限位开关；
- `Closed`：关闭状态。

### 2. 数字量输出DO

```text
xMotorContactorDO
xValveExtendDO
xAlarmLampDO
xBuzzerDO
```

`DO`表示该变量最终连接PLC数字量输出点。

### 3. 模拟量输入AI

模拟量建议至少分成原始值和工程量：

```text
iRoomTempRawAI    PLC读取的原始数字量
rRoomTempPV       换算后的实际温度
```

不能让同一个变量同时表示原始数字量和实际工程量。

### 4. 模拟量输出AO

```text
rHeaterOutPct     加热输出百分比
iHeaterRawAO      转换后的模拟量输出原始值
```

信号转换关系为：

```text
PID输出百分比 → 模拟量原始值 → PLC模拟量输出通道
```

---

## 六、命令、状态和反馈的区别

以电机控制为例：

| 变量                | 含义                   | 来源                   |
| ------------------- | ---------------------- | ---------------------- |
| `xMotorStartCmd`    | 电机启动命令           | 控制程序               |
| `xMotorContactorDO` | 接触器输出             | PLC输出点              |
| `xMotorRunFbk`      | 电机运行反馈           | 接触器辅助触点或变频器 |
| `xMotorRunningSts`  | 程序综合判断的运行状态 | PLC内部逻辑            |
| `xMotorFaultAlm`    | 电机故障报警           | 报警逻辑               |

它们不能全部命名为`MotorRun`，因为五个变量承担的作用完全不同。

控制关系可以理解为：

```text
启动条件满足
    ↓
xMotorStartCmd
    ↓
xMotorContactorDO
    ↓
接触器或变频器动作
    ↓
xMotorRunFbk
    ↓
xMotorRunningSts
```

---

## 七、工程单位后缀

REAL变量最好在名称或注释中明确单位。

| 单位后缀 | 含义    | 示例              |
| -------- | ------- | ----------------- |
| `DegC`   | 摄氏度  | `rRoomTempDegC`   |
| `Pct`    | 百分比  | `rHeaterOutPct`   |
| `Bar`    | 压力    | `rAirPressureBar` |
| `Hz`     | 频率    | `rMotorFreqHz`    |
| `Rpm`    | 转速    | `rMotorSpeedRpm`  |
| `Mm`     | 毫米    | `rPositionMm`     |
| `Lpm`    | 升/分钟 | `rFlowLpm`        |

如果`PV`和`SP`的单位已经由所属对象明确，也可以使用：

```text
rRoomTempPV
rRoomTempSP
```

但必须在变量注释中写明单位为`℃`。

---

## 八、程序块命名规则

| 程序块     | 推荐名称                   | 作用           |
| ---------- | -------------------------- | -------------- |
| OB         | `OB_Main`                  | 主循环程序     |
| 循环中断OB | `OB_Cyclic100ms`           | 每100 ms执行   |
| FB         | `FB_MotorControl`          | 电机控制功能块 |
| FB         | `FB_TemperatureSimulation` | 温度对象仿真块 |
| FC         | `FC_ScaleAnalog`           | 模拟量转换函数 |
| DB         | `DB_Global`                | 全局数据       |
| DB         | `DB_TemperatureControl`    | 温度控制数据   |
| 实例DB     | `DB_MotorControl_M01`      | M01电机FB实例  |
| UDT        | `UDT_Motor`                | 电机数据结构   |
| UDT        | `UDT_Alarm`                | 报警数据结构   |

规则是：

```text
程序块类型 + 下划线 + 功能名称
```

例如：

```text
FB_TemperatureSimulation
DB_TemperatureSimulation
```

变量名内部一般不使用下划线，程序块名称可以保留下划线，以便快速识别块类型。

---

## 九、中文注释应该写什么

好的注释不只是重复变量名称，还应该补充来源、单位或动作条件。

不推荐：

```text
rRoomTempPV    房间温度
```

推荐：

```text
rRoomTempPV    房间实际温度，单位℃，由温度仿真FB输出
rRoomTempSP    房间温度设定值，单位℃，由HMI设置
rHeaterOutPct  PID加热输出，范围0.0～100.0%
xOverTempAlm   超温报警，实际温度高于上限时置位
xPIDEn         PID控制器使能，自动模式且系统运行时有效
```

注释至少回答一个问题：

- 信号来自哪里？
- 信号送到哪里？
- 有效范围是多少？
- 工程单位是什么？
- TRUE代表什么？
- 在什么条件下动作？

---

## 十、B2恒温PID项目变量示例

### 1. 控制变量

| 变量名              | 类型 | 中文注释          |
| ------------------- | ---- | ----------------- |
| `xSystemStartCmd`   | BOOL | 恒温系统启动命令  |
| `xSystemStopCmd`    | BOOL | 恒温系统停止命令  |
| `xSystemRunningSts` | BOOL | 恒温系统运行状态  |
| `xAutoMode`         | BOOL | 自动控制模式选择  |
| `xPIDEn`            | BOOL | PID控制器使能     |
| `xPIDRst`           | BOOL | PID控制器复位命令 |

### 2. 温度与PID变量

| 变量名           | 类型 | 中文注释                 |
| ---------------- | ---- | ------------------------ |
| `rRoomTempSP`    | REAL | 房间温度设定值，单位℃    |
| `rRoomTempPV`    | REAL | 房间实际温度，单位℃      |
| `rHeaterOutPct`  | REAL | PID加热输出，范围0～100% |
| `rAmbientTemp`   | REAL | 环境温度，单位℃          |
| `rTempHighLimit` | REAL | 超温报警上限，单位℃      |
| `xOverTempAlm`   | BOOL | 房间超温报警             |
| `xTempSensorErr` | BOOL | 温度信号异常报警         |

### 3. 温度仿真变量

| 变量名         | 类型 | 中文注释                    |
| -------------- | ---- | --------------------------- |
| `rSimTemp`     | REAL | 温度仿真模型当前温度，单位℃ |
| `rHeatGain`    | REAL | 加热升温系数                |
| `rCoolingLoss` | REAL | 环境散热系数                |
| `rInitialTemp` | REAL | 仿真初始温度，单位℃         |
| `xSimReset`    | BOOL | 温度仿真模型复位命令        |

### 4. 程序块名称

```text
OB_Main
OB_Cyclic100ms
FB_TemperatureSimulation
DB_TemperatureSimulation
DB_PIDCompact_Temperature
DB_TemperatureControl
```

---

## 十一、推荐的变量规划顺序

面对一个新项目时，不要立即打开TIA Portal建立变量。

建议先按照下面顺序思考：

1. 系统有哪些控制对象？
2. 每个对象有哪些现场输入？
3. 每个对象有哪些现场输出？
4. 操作人员可以发出哪些命令？
5. 程序需要生成哪些运行状态？
6. 设备可能产生哪些报警？
7. 哪些模拟量需要原始值和工程量转换？
8. 哪些参数需要在HMI上设置？
9. 哪些数据需要保存在DB中？
10. 哪些重复设备应该封装成FB和UDT？

例如，看到“恒温控制系统”时，应先想到：

```text
命令：启动、停止、复位、手动、自动
输入：温度反馈
参数：温度设定值、报警上限
运算：PID控制
输出：加热百分比
状态：运行、就绪、报警
仿真：环境温度、升温、散热
```

再根据这些功能建立变量，而不是想到一个变量就临时添加一个。

---

## 十二、最终统一规则

本博客后续PLC项目统一遵循：

```text
1. 变量使用英文，注释使用中文
2. 变量名称表达功能，不表达地址
3. 使用数据类型前缀
4. BOOL变量必须体现命令、状态、反馈或报警含义
5. 模拟量区分原始值、工程量、设定值和输出值
6. REAL变量必须在注释中注明工程单位
7. 程序块使用“类型_功能名称”
8. 同一个项目不得混用多套命名风格
9. 名称可以稍长，但不能含义模糊
10. 建立变量前先完成控制对象和信号规划
```

变量命名并不是单纯的英语问题，而是对控制逻辑的整理。

当一个变量能够清楚表达“它是什么、从哪里来、要做什么”时，后面的LAD程序设计就会容易很多。

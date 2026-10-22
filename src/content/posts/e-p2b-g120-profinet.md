---
author: 叶工
category: PLC练习项目
description: 我完成G120的离线参数与标准报文1组态，在仿真PLC中观察启停控制字切换，编写状态解析、复位脉冲与速度换算；未验证真实G120通信和电机运行。
draft: false
lang: zh-CN
published: 2026-10-21
tags: [PLC, S7-1500, SINAMICS G120, Startdrive, PROFINET, LAD]
title: E-P2B｜G120变频器PROFINET离线组态与控制字
---

我把 S7-1500 与 SINAMICS G120 放进同一工程，配置电机参数和标准报文1，再编写 LAD 启停命令、状态解析、故障复位与速度换算。

> **本次收尾的是离线组态与PLC基础程序。**已在仿真PLC监视表观察控制字切换；尚未验证真实G120在线通信、电机运行与故障恢复。速度反馈换算已编写，未做数值测试。

## 先看结果｜软件编译与控制字切换

![Main OB1与DB_DriveData DB1软件编译0错误0警告](/images/posts/e-p2b-g120-profinet/01-compile.png)

最终 Main（OB1）和 DB_DriveData（DB1）软件编译 **0错误、0警告**。这里不作硬件整体编译通过的声明。

![运行请求TRUE时控制字为16#047F，状态字仍为0000](/images/posts/e-p2b-g120-profinet/02-run.png)

![运行请求FALSE时控制字恢复16#047E，复位脉冲未被本图捕捉](/images/posts/e-p2b-g120-profinet/03-stop.png)

运行请求 TRUE 时，控制字为 `16#047F`；恢复 FALSE 后变回 `16#047E`。状态字仍为0000，我没有把命令变化当成驱动已运行。复位请求置TRUE后没有额外捕捉脉冲，图中047E不代表脉冲已经被记录。

## 我的离线设备与参数

![设备概览：CU240E-2 PN固件4.7.14与PM240-2 IP20](/images/posts/e-p2b-g120-profinet/26-drive-hardware.png)

![PLC型号CPU1511-1 PN，6ES7 511-1AK02-0AB0，固件V2.9](/images/posts/e-p2b-g120-profinet/15-plc-model.png)

| 项目 | 本次配置 |
| --- | --- |
| 工程 | E_P2B_Drive_PN |
| 软件 | TIA Portal V19、Startdrive V19、PLCSIM Advanced V6.0 |
| PLC | CPU 1511-1 PN，PLC_1；6ES7 511-1AK02-0AB0，固件V2.9 |
| 驱动 | SINAMICS G120，Drive_1 |
| 控制单元 | CU240E-2 PN，6SL3244-0BB12-1FA0，固件4.7.14 |
| 功率模块 | PM240-2，所选目录A项6SL3210-1PE12-3ALx；此为目录型号表达，不是已核实的完整实物订货号 |
| PM电压与功率 | 380～480V；重过载0.55kW、轻过载0.75kW |
| 应用等级 | Standard Drive Control（SDC） |
| 给定来源 | 连接PLC，斜坡功能在驱动中；场总线默认配置[7] |
| 电源场景 | IEC、50Hz，输入380V，离线教学假设 |
| 示例电机 | 异步电机、星形；0.55kW、380V、1.5A、50Hz、1400rpm |
| 参考转速 / 最大转速 | 1500rpm / 1500rpm |
| 加速 / OFF1减速 | 10s / 10s |
| OFF3减速 / 电流极限 | 当时页面0s / 2.25A，未验证实机行为 |
| 其他 | 无温度传感器、无抱闸；不配置制动电阻和输出滤波器；电机识别禁用 |

CU负责命令、参数和控制，PM是功率部分。额定转速属于电机数据，参考转速属于通信换算基准。以上电机参数用于教学，不对应真实铭牌；实际接法、参数和停车行为须按具体设备确认。

## 驱动设置｜按调试向导保留我的选择

### 1. 应用等级：SDC

![调试向导：应用等级Standard Drive Control SDC](/images/posts/e-p2b-g120-profinet/17-application.png)

我选择 `[1] Standard Drive Control（SDC）`。这一页选择驱动控制应用等级，PLC的命令来源在后面另行配置。

### 2. 给定来源：PLC给目标，驱动处理斜坡

![连接PLC，选择驱动中的斜坡功能](/images/posts/e-p2b-g120-profinet/18-setpoint-source.png)

我选择中间一项：连接PLC，斜坡功能在驱动中。PLC给出目标速度，驱动侧按参数组织加减速；这不同于由PLC生成斜坡，也不同于不连接PLC的独立控制。

### 3. 场总线预设与标准报文1

![IO默认配置7场总线带数据组转换，标准报文1 PZD-2/2](/images/posts/e-p2b-g120-profinet/19-fieldbus-defaults.png)

IO默认配置为 `[7] 场总线，带有数据组转换`，报文为 `[1] 标准报文1，PZD-2/2`。上方DI、DO列表是预设的驱动本地端子功能，不是PLC的I/Q地址表。PZD-2/2表示每个方向2个WORD，具体地址还要到网络报文配置中核对。

### 4. 电源标准与输入电压

![IEC 50Hz SI单位，驱动输入电压380V](/images/posts/e-p2b-g120-profinet/20-supply.png)

标准选择IEC（50Hz电源、SI单位），设备输入电压设为380V。这是本次离线教学的电源假设，电机额定电压还要在电机页面单独填写。

### 5. 驱动选件与电机抱闸

![不选制动电阻，输出滤波器为0无筛选](/images/posts/e-p2b-g120-profinet/21-options.png)

![电机抱闸配置为0无电机抱闸](/images/posts/e-p2b-g120-profinet/23-brake.png)

本次不配置制动电阻，输出滤波器保留 `[0] 无筛选`，电机抱闸设为 `[0] 无电机抱闸`。制动电阻消耗减速回送能量，抱闸是机械保持装置，二者不能混为一项。这里的输出滤波器也不同于功率模块输入侧的滤波配置。

### 6. 电机铭牌字段：使用教学假设

![异步电机星形教学参数：1.5A、0.55kW、1400rpm、380V、50Hz](/images/posts/e-p2b-g120-profinet/22-motor.png)

选择输入电机数据、通用异步电机、星形。填入1.5A、0.55kW、1400rpm、380V、50Hz，自冷却、无温度传感器。87/104Hz运行未勾选。这组值用于学习字段与配置流程，不是现场电机选型或铭牌记录。

### 7. 参考转速、斜坡与电流极限

![参考及最大转速1500rpm，上升和OFF1下降10s，OFF3为0s，电流极限2.25A](/images/posts/e-p2b-g120-profinet/24-reference-ramp.png)

参考转速和最大转速均1500rpm，上升时间10s、OFF1下降时间10s，OFF3保留图示0s，电流极限2.25A。参考转速是报文归一化的基准，不要求与电机额定转速1400rpm相同。斜坡时间用于加减速配置；本次未验证实际加减速、电流限制或停车行为，以上不能作为实机整定结论。

### 8. 驱动功能与电机识别

![恒定负载线性特性曲线，电机识别禁用](/images/posts/e-p2b-g120-profinet/25-identification.png)

工艺应用为 `[0] 恒定负载（线性特性曲线）`，电机识别为 `[0] 禁用`。我只保存离线参数，没有执行电机数据测量。识别禁用不意味着真实电机已经完成调试。

## 网络与标准报文1

![PLC_1与Drive_1连接PN/IE_1，驱动分配给PLC_1](/images/posts/e-p2b-g120-profinet/10-network.png)

![PLC接口X1：192.168.0.1，255.255.255.0，子网PN/IE_1](/images/posts/e-p2b-g120-profinet/16-plc-ip.png)

![驱动IP192.168.0.2，自动生成设备名drive_1，转换名称drivexb14fe3](/images/posts/e-p2b-g120-profinet/11-drive-ip.png)

PLC_1离线IP为 `192.168.0.1`，Drive_1为 `192.168.0.2`，掩码均为 `255.255.255.0`，连接 `PN/IE_1`。Drive_1已分配给PLC_1的IO系统；离线连线不等于实体驱动已经上线。

驱动设备名栏显示 `drive_1`，转换后的名称为 `drivexb14fe3`；勾选自动生成名称。这是工程属性记录，没有向实体设备分配名称的验证。


![标准报文1：发送实际值I256至259，接收设定值Q256至259](/images/posts/e-p2b-g120-profinet/12-telegram-overview.png)

标准报文1是 **PZD-2/2**：两个方向各2个WORD，即各4字节。报文配置页面的发送/接收以驱动为参照。

| PLC变量 | 类型 / 地址 | 方向与内容 |
| --- | --- | --- |
| wDriveControl | Word，%QW256 | PLC→驱动，STW1控制字 |
| iDriveSpeedSetRaw | Int，%QW258 | PLC→驱动，NSOLL_A速度给定 |
| wDriveStatus | Word，%IW256 | 驱动→PLC，ZSW1状态字 |
| iDriveActualSpeedRaw | Int，%IW258 | 驱动→PLC，NIST_A速度反馈 |


![驱动发送实际值至PLC输入I256，长度2个字，硬件标识符266](/images/posts/e-p2b-g120-profinet/13-telegram-send.png)

![驱动接收来自PLC输出Q256的设定值，长度2个字](/images/posts/e-p2b-g120-profinet/14-telegram-receive.png)

发送实际值：驱动到PLC输入I256；接收设定值：PLC输出Q256到驱动。两项均显示长度2个字、硬件标识符266。266是本工程分配的硬件标识符，不是IP、站号或过程数据地址。

每个WORD占两个字节，所以第二个字从258开始。I区与Q区独立，可以使用相同起始字节。

## LAD｜速度给定与启停命令

![LAD段1至3：750rpm给定、047E停止和047F运行命令](/images/posts/e-p2b-g120-profinet/29-command-lad.png)

第一段MOVE将 `INT#8192` 写入 `iDriveSpeedSetRaw`。本工程参考转速1500rpm，目标750rpm对应：

```text
给定原始值 = 目标转速 ÷ 参考转速 × 16384
8192 = 750 ÷ 1500 × 16384
```

程序段2、3用互斥的常闭/常开触点控制MOVE：

| xDriveRunReq（%M10.0） | 写入wDriveControl |
| --- | --- |
| FALSE | WORD#16#047E，OFF1停止命令 |
| TRUE | WORD#16#047F，运行请求 |

两值只差bit0，典型启动先给047E再切换047F。本程序是基础命令练习，不是完整驱动状态机；驱动是否执行还涉及通信、状态和使能条件。变量注释里的“初始FALSE”只是文字，不会自动设置变量。

## 状态字｜先按协议取位，再谈运行状态

![修正后的状态解析使用X0、X2、X3、X6和普通线圈](/images/posts/e-p2b-g120-profinet/04-status.png)

我最初按X0、X1、X2、X3连续取位，后来改为协议要求的 **X0、X2、X3、X6**。变量排列顺序不能代替状态字定义。

| wDriveStatus取位 | 输出变量 / 地址 | 含义 |
| --- | --- | --- |
| .%X0 | xDriveReadyToStart，%M11.0 | 准备接通 |
| .%X2 | xDriveOpEnabled，%M11.1 | 运行已使能 |
| .%X3 | xDriveFault，%M11.2 | 存在故障 |
| .%X6 | xDriveStartInhibited，%M11.3 | 接通被禁止 |

使用普通线圈。使能不等于电机已经转动，状态字0000也不能自动解释为“无故障、已停止”，还要确认IO数据有效性。本次无有效真实驱动状态用于验证解析结果。

## 故障确认｜P_TRIG与控制字bit7

![P_TRIG产生单扫描脉冲，随后普通线圈写入STW1 bit7](/images/posts/e-p2b-g120-profinet/05-reset.png)

![更新的PLC默认变量表，过程数据、运行请求、状态和复位变量](/images/posts/e-p2b-g120-profinet/27-tags-updated.png)

| 变量 | 类型 / 地址 | 用途 |
| --- | --- | --- |
| xDriveResetReq | Bool，%M12.0 | FALSE→TRUE请求一次，重复触发前先恢复FALSE |
| xDriveResetEdgeMem | Bool，%M12.1 | P_TRIG专用边沿存储位 |
| xDriveResetPulse | Bool，%M12.2 | 单扫描周期脉冲 |

段5生成脉冲，段6用普通线圈写 `"wDriveControl".%X7`，放在控制字MOVE后面，避免被整字写入覆盖。不能用置位线圈让bit7一直保持TRUE。

预期脉冲周期为停止时04FE或运行时04FF，然后恢复047E/047F。我理解后没有额外捕捉这个周期，不把预期数值写成已观察结果。故障确认不消除故障原因，也不代表实际故障恢复已验证。

## 速度反馈｜Int先转Real，再归一化

![DB_DriveData三个REAL变量及注释](/images/posts/e-p2b-g120-profinet/28-db-updated.png)

![CONV将速度反馈原始Int转换为Real](/images/posts/e-p2b-g120-profinet/08-conv.png)

![DIV除以16384，MUL乘以1500，得到rpm](/images/posts/e-p2b-g120-profinet/09-calc.png)

```text
iDriveActualSpeedRaw（Int）
    ↓ CONV：Int → Real
DB_DriveData.rActualSpeedRaw
    ↓ DIV：÷ REAL#16384.0
DB_DriveData.rActualSpeedRatio
    ↓ MUL：× REAL#1500.0
DB_DriveData.rActualSpeedRpm
```

三个DB变量均为REAL，起始值0.0。先转换再运算，避免整数除法丢失小数。1500是本工程的参考转速，变更参考值时也要同步换算。

这一部分已编写并通过软件编译，未做数值测试。没有有效反馈时，结果0rpm只说明当前原始数值为零，不证明实际电机停转。

## 这次遇到的边界｜仿真PLC不会自动生成虚拟G120

最初监视表中控制字、状态字都为0000；之后控制字能按程序写入047E并切换047F，状态字仍为0000。

Startdrive添加控制单元、功率模块与电机数据，是离线组态；PLCSIM Advanced运行的是PLC。当前环境没有因此产生执行G120固件、功率部分和电机行为的虚拟驱动。

本次没有另接Factory I/O或NX展示运动。场景联动可以验证控制逻辑，但不能替代真实G120报文通信和驱动运行验证。

## 收尾范围

| 内容 | 实际状态 |
| --- | --- |
| 设备、参数、网络与报文 | 已完成离线配置 |
| 控制字047E/047F切换 | 已在仿真PLC监视表观察 |
| PLC软件编译 | Main OB1、DB1，0错误0警告 |
| 状态解析与故障确认 | 已编写，无有效真实反馈；未捕捉复位脉冲 |
| 速度反馈换算 | 已编写，未做数值测试 |
| 硬件整体编译通过 | 当前材料未确认 |
| 真实G120通信、电机运行、故障恢复 | **尚未验证** |

本次收尾的是 **E-P2B离线组态与基础程序**，不是E-P2 A/B全部完成或实机调试完成。有对应设备或合适模型后，再继续在线验证。

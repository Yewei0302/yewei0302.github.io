---
title: PLC变量命名四要素英文缩写速查表
published: 2026-09-04
description: 汇总PLC变量命名所需的数据类型、控制对象、功能含义、状态及工程单位英文与缩写。
tags:
  - PLC
  - 变量命名
  - 英文缩写
  - TIA Portal
  - 工控基础
category: PLC基础
draft: false
---

> 适用范围：TIA Portal、S7-1200/1500、LAD、HMI、模拟量、PID、运动控制与常见自动化设备。  
> 推荐结构：`数据类型前缀 + 控制对象 + 功能含义 + 状态或单位后缀`  
> 示例：`rRoomTempPV`＝`r`（REAL）＋`RoomTemp`（房间温度）＋`PV`（过程实际值）。  
> 书写规则：数据类型前缀使用小写，其余单词首字母大写；变量名使用英文，中文写在注释中。并非每个变量都必须同时包含四部分，只保留表达含义所必需的部分。

## 一、数据类型

### 1. 基本数据类型

| 推荐前缀 | 英文/PLC类型 | 中文解释 | 示例 | 示例中文含义 |
|---|---|---|---|---|
| `x` | BOOL / Boolean | 布尔量，只有TRUE和FALSE | `xSystemReady` | 系统就绪状态 |
| `si` | SINT / Short Integer | 8位有符号整数 | `siSmallOffset` | 小范围有符号偏移量 |
| `usi` | USINT / Unsigned Short Integer | 8位无符号整数 | `usiStationNo` | 工位编号 |
| `i` | INT / Integer | 16位有符号整数 | `iRoomTempRawAI` | 房间温度模拟量原始值 |
| `ui` | UINT / Unsigned Integer | 16位无符号整数 | `uiProductCount` | 产品数量 |
| `di` | DINT / Double Integer | 32位有符号整数 | `diPositionPulse` | 位置脉冲数 |
| `udi` | UDINT / Unsigned Double Integer | 32位无符号整数 | `udiTotalCount` | 累计数量 |
| `li` | LINT / Long Integer | 64位有符号整数 | `liEncoderCount` | 编码器累计计数 |
| `uli` | ULINT / Unsigned Long Integer | 64位无符号整数 | `uliProductionTotal` | 生产累计总数 |
| `r` | REAL / Real Number | 32位浮点数 | `rRoomTempPV` | 房间实际温度 |
| `lr` | LREAL / Long Real | 64位浮点数 | `lrEnergyTotal` | 高精度累计能耗 |
| `by` | BYTE | 8位位组 | `byDeviceStatus` | 设备状态字节 |
| `w` | WORD | 16位位组 | `wAlarmWord` | 报警状态字 |
| `dw` | DWORD / Double Word | 32位位组 | `dwDeviceStatus` | 设备状态双字 |
| `lw` | LWORD / Long Word | 64位位组 | `lwStatusBits` | 64位状态位组 |
| `ch` | CHAR / Character | 单个ASCII字符 | `chSeparator` | 分隔字符 |
| `wch` | WCHAR / Wide Character | 单个Unicode字符 | `wchSymbol` | Unicode字符 |
| `str` | STRING / Character String | 字符串 | `strDeviceName` | 设备名称 |
| `wstr` | WSTRING / Wide String | Unicode字符串 | `wstrProductName` | 中文或Unicode产品名称 |

### 2. 时间和日期类型

| 推荐前缀 | 英文/PLC类型 | 中文解释 | 示例 | 示例中文含义 |
|---|---|---|---|---|
| `t` | TIME | 时间长度 | `tStartDelay` | 启动延时时间 |
| `lt` | LTIME / Long Time | 长时间长度、高分辨率时间 | `ltCycleTime` | 高精度循环时间 |
| `d` | DATE | 日期 | `dProductionDate` | 生产日期 |
| `tod` | TIME_OF_DAY | 一天中的时间 | `todShiftStart` | 班次开始时间 |
| `ltod` | LTIME_OF_DAY | 高精度日时间 | `ltodEventTime` | 高精度事件时间 |
| `dtl` | DTL / Date and Time Long | 日期与时间结构 | `dtlFaultTime` | 故障发生日期和时间 |

### 3. 复合及特殊数据类型

| 推荐前缀 | 英文/PLC类型 | 中文解释 | 示例 | 示例中文含义 |
|---|---|---|---|---|
| `arr` | ARRAY | 相同类型数据组成的数组 | `arrRoomTemp` | 房间温度数组 |
| `st` | STRUCT / Structure | 多种成员组成的结构 | `stMotorData` | 电机结构数据 |
| `udt` | UDT / User-Defined Type | 用户自定义数据类型 | `udtMotor` | 电机自定义类型定义 |
| `e` | ENUM / Enumeration | 枚举值 | `eSystemMode` | 系统模式枚举 |
| `v` | VARIANT | 可保存多种数据类型的变量 | `vInputData` | 通用输入数据 |
| `ref` | REF_TO / Reference To | 指向其他变量的类型安全引用 | `refMotorData` | 电机数据引用 |
| `p` | POINTER / Pointer | 指针，进阶功能使用 | `pDataBuffer` | 数据缓冲区指针 |
| `ton` | TON / On-Delay Timer | 接通延时定时器实例 | `tonStartDelay` | 启动延时定时器 |
| `tof` | TOF / Off-Delay Timer | 断开延时定时器实例 | `tofFanDelay` | 风机停止延时定时器 |
| `tp` | TP / Pulse Timer | 脉冲定时器实例 | `tpBuzzerPulse` | 蜂鸣器脉冲定时器 |
| `ctu` | CTU / Count Up | 加计数器实例 | `ctuProductCount` | 产品加计数器 |
| `ctd` | CTD / Count Down | 减计数器实例 | `ctdRemainingCount` | 剩余数量减计数器 |
| `ctud` | CTUD / Count Up and Down | 加减计数器实例 | `ctudBufferCount` | 缓冲区加减计数器 |

> 初学和常规项目优先掌握：`x`、`i`、`di`、`r`、`t`、`str`、`arr`、`st`、`ton`、`ctu`。

## 二、控制对象

### 1. 系统、产线和程序层级

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `System` | System | 系统 | `xSystemRunningSts` |
| `Machine` | Machine | 单机设备 | `xMachineReady` |
| `Line` | Production Line | 生产线 | `xLineStartCmd` |
| `Area` | Area | 区域 | `xAreaSafetyOK` |
| `Cell` | Production Cell | 生产单元 | `xCellAutoMode` |
| `Station` / `Stn` | Station | 工位 | `xStation01Ready` |
| `Unit` | Unit | 功能单元 | `xHeatingUnitEn` |
| `Module` | Module | 模块 | `xModuleFault` |
| `Sequence` / `Seq` | Sequence | 顺序控制流程 | `iSequenceStep` |
| `Step` | Step | 流程步骤 | `iCurrentStep` |
| `Mode` | Mode | 工作模式 | `iSystemMode` |
| `Recipe` | Recipe | 配方 | `uiRecipeNo` |
| `Batch` | Batch | 批次 | `strBatchNo` |
| `Process` | Process | 工艺过程 | `xProcessActive` |
| `Cycle` | Cycle | 设备工作循环 | `xCycleStartCmd` |

### 2. 驱动、旋转和输送设备

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `Motor` / `M01` | Motor | 电机；多台设备可用M01编号 | `xM01RunFbk` |
| `Drive` | Drive | 驱动器统称 | `xDriveReady` |
| `VFD` | Variable Frequency Drive | 变频器 | `rVFD01FreqSP` |
| `Servo` | Servo Drive/Motor | 伺服驱动或伺服电机 | `xServo01HomingDone` |
| `Axis` | Motion Axis | 运动轴 | `rAxis01PositionPV` |
| `Spindle` | Spindle | 主轴 | `rSpindleSpeedSP` |
| `Pump` | Pump | 泵 | `xPump01StartCmd` |
| `Fan` | Fan | 风机 | `xFan01RunningSts` |
| `Blower` | Blower | 鼓风机 | `xBlowerStartCmd` |
| `Compressor` | Compressor | 压缩机 | `xCompressorReady` |
| `Conveyor` / `Conv` | Conveyor | 输送机、传送带 | `xConveyorRunCmd` |
| `Roller` | Roller | 辊筒 | `rRollerSpeedSP` |
| `Winder` | Winder | 收卷机 | `rWinderTensionSP` |
| `Unwinder` | Unwinder | 放卷机 | `rUnwinderSpeedSP` |
| `Feeder` | Feeder | 送料机 | `xFeederRunCmd` |
| `Mixer` | Mixer | 搅拌机 | `xMixerStartCmd` |
| `Agitator` | Agitator | 搅拌器 | `xAgitatorRunFbk` |

### 3. 气动、液压和执行机构

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `Cylinder` / `Cyl` | Cylinder | 气缸或液压缸 | `xCylinderExtendCmd` |
| `Valve` | Valve | 阀门 | `xValveOpenCmd` |
| `Solenoid` / `Sol` | Solenoid | 电磁铁、电磁阀线圈 | `xSolenoidDO` |
| `Damper` | Damper | 风门、挡板 | `rDamperPositionSP` |
| `Actuator` / `Act` | Actuator | 执行器 | `xActuatorReady` |
| `Clamp` | Clamp | 夹具、夹紧机构 | `xClampCloseCmd` |
| `Gripper` | Gripper | 机械夹爪 | `xGripperOpenCmd` |
| `Brake` | Brake | 制动器 | `xBrakeReleaseCmd` |
| `Gate` | Gate | 闸门 | `xGateClosedFbk` |
| `Shutter` | Shutter | 百叶、挡门 | `xShutterOpenCmd` |

### 4. 温度、压力、液位和工艺对象

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `RoomTemp` | Room Temperature | 房间温度 | `rRoomTempPV` |
| `AmbientTemp` | Ambient Temperature | 环境温度 | `rAmbientTemp` |
| `Heater` | Heater | 加热器 | `rHeaterOutPct` |
| `Cooler` | Cooler | 冷却器 | `xCoolerStartCmd` |
| `Chiller` | Chiller | 冷水机 | `xChillerReady` |
| `Oven` | Oven | 烘箱、加热炉 | `rOvenTempSP` |
| `Furnace` | Furnace | 工业炉 | `rFurnaceTempPV` |
| `Tank` | Tank | 储罐 | `rTankLevelPV` |
| `Level` | Level | 液位、高度 | `rTankLevelPV` |
| `Pressure` | Pressure | 压力 | `rAirPressurePV` |
| `Flow` | Flow | 流量 | `rWaterFlowPV` |
| `Humidity` | Humidity | 湿度 | `rRoomHumidityPV` |
| `Tension` | Tension | 张力 | `rWinderTensionPV` |
| `Weight` | Weight | 重量 | `rProductWeightPV` |
| `Position` / `Pos` | Position | 位置 | `rAxisPositionPV` |
| `Speed` / `Spd` | Speed | 速度、转速 | `rMotorSpeedPV` |
| `Frequency` / `Freq` | Frequency | 频率 | `rMotorFreqSP` |
| `Torque` / `Trq` | Torque | 转矩 | `rMotorTorquePV` |
| `Current` / `Cur` | Current | 电流 | `rMotorCurrentPV` |
| `Voltage` / `Volt` | Voltage | 电压 | `rBusVoltagePV` |
| `Power` | Power | 功率 | `rHeaterPowerPV` |
| `Energy` | Energy | 能量、电能 | `lrEnergyTotal` |

### 5. 传感器和现场操作器件

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `Sensor` / `Sns` | Sensor | 传感器统称 | `xSensorFault` |
| `TempSensor` | Temperature Sensor | 温度传感器 | `xTempSensorErr` |
| `PressureSensor` | Pressure Sensor | 压力传感器 | `rPressureSensorPV` |
| `LevelSensor` | Level Sensor | 液位传感器 | `rLevelSensorPV` |
| `Encoder` / `Enc` | Encoder | 编码器 | `diEncoderPulseCount` |
| `Proximity` / `Prox` | Proximity Sensor | 接近开关 | `xProximity01DI` |
| `Photoeye` / `PE` | Photoelectric Sensor | 光电传感器 | `xProductPresentPE` |
| `LimitSwitch` / `LS` | Limit Switch | 限位开关 | `xCylinderExtendLS` |
| `PushButton` / `PB` | Push Button | 实体按钮 | `xStartPB` |
| `SelectorSwitch` / `SS` | Selector Switch | 选择开关 | `xAutoManualSS` |
| `EmergencyStop` / `EStop` | Emergency Stop | 急停 | `xEStopOK` |
| `SafetyDoor` | Safety Door | 安全门 | `xSafetyDoorClosed` |
| `LightCurtain` | Safety Light Curtain | 安全光幕 | `xLightCurtainClear` |
| `FootSwitch` | Foot Switch | 脚踏开关 | `xFootSwitchDI` |

### 6. 电气元件和指示器件

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `Contactor` / `KM` | Contactor | 接触器 | `xM01ContactorDO` |
| `Relay` / `K` | Relay | 继电器 | `xAlarmRelayDO` |
| `Breaker` / `CB` | Circuit Breaker | 断路器 | `xMainBreakerClosed` |
| `Fuse` / `FU` | Fuse | 熔断器 | `xFuseHealthy` |
| `Lamp` | Indicator Lamp | 指示灯 | `xRunLampDO` |
| `StackLight` | Stack Light | 三色灯、塔灯 | `xStackLightRedDO` |
| `Buzzer` | Buzzer | 蜂鸣器 | `xBuzzerDO` |
| `PowerSupply` / `PSU` | Power Supply Unit | 电源模块 | `xPSUHealthy` |
| `UPS` | Uninterruptible Power Supply | 不间断电源 | `xUPSFault` |

### 7. 控制、通信和信息设备

| 推荐写法 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `PLC` | Programmable Logic Controller | 可编程逻辑控制器 | `xPLCHeartbeat` |
| `HMI` | Human-Machine Interface | 人机界面 | `xSystemStartCmdHMI` |
| `SCADA` | Supervisory Control and Data Acquisition | 监控与数据采集系统 | `xSCADAConnected` |
| `Robot` | Industrial Robot | 工业机器人 | `xRobotReady` |
| `Vision` | Machine Vision System | 机器视觉系统 | `xVisionInspectReq` |
| `Camera` | Camera | 相机 | `xCameraTriggerCmd` |
| `Scanner` | Scanner | 扫描器 | `xScannerReady` |
| `Barcode` | Barcode | 条码 | `strBarcodeData` |
| `RFID` | Radio Frequency Identification | 射频识别 | `xRFIDReadDone` |
| `MES` | Manufacturing Execution System | 制造执行系统 | `xMESConnected` |
| `Server` | Server | 服务器 | `xServerConnected` |
| `Client` | Client | 客户端 | `xClientConnected` |
| `Device` / `Dev` | Device | 通用设备 | `xDeviceOnline` |
| `Network` / `Net` | Network | 网络 | `xNetworkFault` |
| `Communication` / `Comm` | Communication | 通信 | `xCommErr` |

> 缩写只在团队已经约定、不会产生歧义时使用。初学阶段优先使用完整单词，例如优先用`Cylinder`，而不是为了短而强行写`Cyl`。

## 三、功能含义

### 1. 启停、模式和控制命令

| 推荐写法 | 英文含义 | 中文解释 | 示例 |
|---|---|---|---|
| `Start` | Start | 启动 | `xSystemStartCmd` |
| `Stop` | Stop | 停止 | `xSystemStopCmd` |
| `Run` | Run | 运行 | `xMotorRunCmd` |
| `Jog` | Jog | 点动 | `xMotorJogCmd` |
| `Reset` / `Rst` | Reset | 复位 | `xPIDResetCmd` |
| `Enable` / `En` | Enable | 使能、允许功能工作 | `xPIDEn` |
| `Disable` | Disable | 禁用 | `xAlarmDisableCmd` |
| `On` | On | 开启、接通 | `xHeaterOnCmd` |
| `Off` | Off | 关闭、断开 | `xHeaterOffCmd` |
| `Auto` | Automatic | 自动 | `xAutoMode` |
| `Manual` / `Man` | Manual | 手动 | `xManualMode` |
| `Local` | Local | 就地控制 | `xLocalMode` |
| `Remote` | Remote | 远程控制 | `xRemoteMode` |
| `Select` / `Sel` | Select | 选择 | `iRecipeSel` |
| `Switch` | Switch | 切换 | `xModeSwitchCmd` |
| `Change` | Change | 改变 | `xRecipeChangeReq` |
| `Initialize` / `Init` | Initialize | 初始化 | `xSystemInitCmd` |
| `Restart` | Restart | 重新启动 | `xDeviceRestartCmd` |
| `Shutdown` | Shutdown | 停机、关闭系统 | `xSystemShutdownCmd` |

### 2. 方向、位置和机械动作

| 推荐写法 | 英文含义 | 中文解释 | 示例 |
|---|---|---|---|
| `Forward` / `Fwd` | Forward | 正转、前进 | `xMotorForwardCmd` |
| `Reverse` / `Rev` | Reverse | 反转、后退 | `xMotorReverseCmd` |
| `Up` | Up | 向上 | `xLiftUpCmd` |
| `Down` | Down | 向下 | `xLiftDownCmd` |
| `Raise` | Raise | 升起 | `xPlatformRaiseCmd` |
| `Lower` | Lower | 降下 | `xPlatformLowerCmd` |
| `Open` | Open | 打开 | `xValveOpenCmd` |
| `Close` | Close | 关闭 | `xValveCloseCmd` |
| `Extend` | Extend | 伸出 | `xCylinderExtendCmd` |
| `Retract` | Retract | 缩回 | `xCylinderRetractCmd` |
| `Clamp` | Clamp | 夹紧 | `xFixtureClampCmd` |
| `Release` | Release | 松开、释放 | `xBrakeReleaseCmd` |
| `Lock` | Lock | 锁定 | `xDoorLockCmd` |
| `Unlock` | Unlock | 解锁 | `xDoorUnlockCmd` |
| `Home` | Home Position | 原点位置 | `xAxisHomeFbk` |
| `Homing` | Homing | 回原点过程 | `xAxisHomingCmd` |
| `Move` | Move | 移动 | `xAxisMoveCmd` |
| `Position` / `Pos` | Position | 定位、位置 | `rAxisPositionSP` |
| `Index` | Indexing | 分度、索引定位 | `xTableIndexCmd` |
| `Rotate` | Rotate | 旋转 | `xTableRotateCmd` |
| `Lift` | Lift | 提升 | `xLiftStartCmd` |

### 3. 工艺动作

| 推荐写法 | 英文含义 | 中文解释 | 示例 |
|---|---|---|---|
| `Heat` | Heat | 加热 | `xHeatEnable` |
| `Cool` | Cool | 冷却 | `xCoolEnable` |
| `Fill` | Fill | 进料、注入、灌装 | `xTankFillCmd` |
| `Drain` | Drain | 排放、排液 | `xTankDrainCmd` |
| `Feed` | Feed | 送料 | `xMaterialFeedCmd` |
| `Discharge` | Discharge | 出料、排出 | `xProductDischargeCmd` |
| `Load` | Load | 装载、加载 | `xMaterialLoadCmd` |
| `Unload` | Unload | 卸载 | `xProductUnloadCmd` |
| `Mix` | Mix | 混合、搅拌 | `xTankMixCmd` |
| `Dose` | Dose | 定量投料 | `rDoseWeightSP` |
| `Cut` | Cut | 切割 | `xCutterCutCmd` |
| `Wind` | Wind | 收卷 | `xWinderRunCmd` |
| `Unwind` | Unwind | 放卷 | `xUnwinderRunCmd` |
| `Tension` | Tension | 张力控制 | `rTensionSP` |
| `Seal` | Seal | 封口、密封 | `xSealerStartCmd` |
| `Weld` | Weld | 焊接 | `xWelderStartCmd` |
| `Print` | Print | 打印 | `xPrinterStartCmd` |
| `Inspect` | Inspect | 检测、检查 | `xVisionInspectReq` |
| `Reject` | Reject | 剔除不合格品 | `xRejectCmd` |
| `Pack` | Pack | 包装 | `xPackingStartCmd` |

### 4. 数据处理和计算

| 推荐写法 | 英文含义 | 中文解释 | 示例 |
|---|---|---|---|
| `Read` | Read | 读取 | `xRFIDReadReq` |
| `Write` | Write | 写入 | `xRecipeWriteReq` |
| `Get` | Get | 获取数据 | `xGetStatusReq` |
| `Set` | Set | 设置数值或状态 | `xSetParameterReq` |
| `Save` | Save | 保存 | `xRecipeSaveCmd` |
| `Load` | Load | 加载数据 | `xRecipeLoadCmd` |
| `Clear` / `Clr` | Clear | 清除 | `xCountClearCmd` |
| `Calculate` / `Calc` | Calculate | 计算 | `rSpeedCalc` |
| `Convert` / `Cvt` | Convert | 数据类型或格式转换 | `rTempConverted` |
| `Scale` | Scale | 比例换算为工程量 | `rTempScaled` |
| `Normalize` / `Norm` | Normalize | 标准化到0.0～1.0 | `rTempNormalized` |
| `Linearize` | Linearize | 线性化 | `rSensorLinearized` |
| `Filter` / `Filt` | Filter | 滤波 | `rPressureFiltered` |
| `Average` / `Avg` | Average | 求平均值 | `rTempAvg` |
| `Sum` | Sum | 求和 | `rPowerSum` |
| `Total` | Total | 累计总量 | `udiProductionTotal` |
| `Count` / `Cnt` | Count | 计数 | `uiProductCount` |
| `Compare` / `Cmp` | Compare | 比较 | `xTempCompareResult` |
| `Limit` / `Lim` | Limit | 限制、限幅 | `rOutputLimited` |
| `Clamp` | Clamp | 将数值钳制在上下限内 | `rSpeedClamped` |
| `Offset` | Offset | 偏移量补偿 | `rTempOffset` |
| `Gain` | Gain | 增益、比例系数 | `rHeatGain` |
| `Correction` / `Corr` | Correction | 修正、补偿 | `rSensorCorrection` |
| `Sample` | Sample | 采样 | `tSampleTime` |
| `Update` | Update | 更新 | `xDataUpdateReq` |

### 5. 条件、安全和流程逻辑

| 推荐写法 | 英文含义 | 中文解释 | 示例 |
|---|---|---|---|
| `Check` | Check | 检查 | `xSafetyCheckDone` |
| `Monitor` | Monitor | 监视 | `xTempMonitorEn` |
| `Validate` | Validate | 验证数据有效性 | `xParameterValid` |
| `Permit` / `Perm` | Permit | 运行许可 | `xMotorStartPerm` |
| `Interlock` | Interlock | 联锁条件 | `xMotorInterlockOK` |
| `Inhibit` | Inhibit | 禁止动作 | `xStartInhibit` |
| `Bypass` | Bypass | 临时旁路某个条件 | `xSensorBypass` |
| `Override` | Override | 强制覆盖正常控制 | `xManualOverride` |
| `Latch` | Latch | 锁存 | `xAlarmLatched` |
| `Unlatch` | Unlatch | 解除锁存 | `xAlarmUnlatchCmd` |
| `Trigger` / `Trig` | Trigger | 触发 | `xCameraTriggerCmd` |
| `Pulse` | Pulse | 脉冲 | `xStartPulse` |
| `Delay` | Delay | 延时 | `tStartDelay` |
| `Timeout` | Timeout | 超时 | `xCommTimeout` |
| `Synchronize` / `Sync` | Synchronize | 同步 | `xAxisSyncCmd` |
| `Simulate` / `Sim` | Simulate | 仿真 | `xTempSimEn` |
| `Force` | Force | 强制 | `xOutputForceEn` |
| `Test` | Test | 测试 | `xLampTestCmd` |

## 四、必要的状态和单位后缀

### 1. 信号角色和程序状态后缀

| 后缀 | 英文全称 | 中文解释 | 示例 | 使用提醒 |
|---|---|---|---|---|
| `Cmd` | Command | 程序控制命令 | `xSystemStartCmd` | 表示程序希望设备执行动作 |
| `Req` | Request | 请求 | `xVisionInspectReq` | 常用于通信或功能请求 |
| `Fbk` | Feedback | 现场反馈 | `xM01RunFbk` | 来自辅助触点、驱动器或传感器 |
| `Sts` | Status | 程序综合状态 | `xSystemRunningSts` | 由程序综合判断出的状态 |
| `En` | Enable | 使能 | `xPIDEn` | 只表示允许工作，不表示已经运行 |
| `Perm` | Permission/Permit | 许可 | `xMotorStartPerm` | 所有启动许可条件的综合结果 |
| `Ack` | Acknowledge | 确认 | `xAlarmAck` | 常用于报警确认 |
| `Rst` | Reset | 复位 | `xAlarmRst` | 可用完整写法`ResetCmd` |
| `Alm` | Alarm | 报警 | `xRoomTempHighAlm` | 需要操作员或程序响应 |
| `Warn` | Warning | 警告 | `xTempHighWarn` | 通常比报警级别低 |
| `Err` | Error | 程序、数据或通信错误 | `xCommErr` | 常表示功能执行错误 |
| `Fault` | Fault | 设备故障 | `xMotorFault` | 多指设备自身故障 |
| `Trip` | Trip | 保护跳闸 | `xMotorTrip` | 过载、保护器动作等 |
| `Ready` | Ready | 就绪 | `xDriveReady` | 满足启动前提但不等于运行 |
| `Running` | Running | 正在运行 | `xMotorRunningSts` | 设备或系统处于运行状态 |
| `Active` | Active | 激活、生效 | `xCoolingActive` | 功能当前处于激活状态 |
| `Busy` | Busy | 正在执行 | `xRecipeLoadBusy` | 指令尚未完成 |
| `Done` | Done | 执行完成 | `xHomingDone` | 常为完成脉冲或保持状态 |
| `Valid` | Valid | 数据有效 | `xTempPVValid` | 数据通过有效性检查 |
| `Invalid` | Invalid | 数据无效 | `xParameterInvalid` | 数据不可使用 |
| `OK` | Okay | 正常、条件满足 | `xSafetyOK` | TRUE通常代表正常，便于正逻辑编程 |
| `Fail` / `Failed` | Failed | 执行失败 | `xStartFailed` | 动作未成功完成 |
| `Connected` | Connected | 已连接 | `xHMIConnected` | 通信连接建立 |
| `Online` | Online | 在线 | `xDeviceOnline` | 设备在线可访问 |
| `Heartbeat` | Heartbeat | 心跳信号 | `xPLCHeartbeat` | 周期翻转或脉冲，用于判断通信存活 |
| `Timeout` | Timeout | 超时 | `xCommTimeout` | 等待超过允许时间 |
| `Changed` | Changed | 数据已变化 | `xRecipeChanged` | 表示检测到变化 |
| `New` | New | 新数据、新事件 | `xNewData` | 新数据到达标志 |
| `FirstScan` | First Scan | PLC首次扫描 | `xFirstScan` | 启动后的首次循环标志 |
| `Rise` | Rising Edge | 上升沿 | `xStartRise` | FALSE到TRUE瞬间 |
| `Fall` | Falling Edge | 下降沿 | `xStopFall` | TRUE到FALSE瞬间 |
| `Pulse` | Pulse | 单周期脉冲 | `xStartPulse` | 只保持一个扫描周期或指定时间 |
| `Latched` | Latched | 已锁存 | `xAlarmLatched` | 条件消失后仍保持 |

> `Cmd`、`Fbk`和`Sts`必须区分：`Cmd`是程序命令，`Fbk`是现场返回，`Sts`是程序综合状态。

### 2. 过程量、设定值和数值属性后缀

| 后缀 | 英文全称 | 中文解释 | 示例 | 使用提醒 |
|---|---|---|---|---|
| `SP` | Setpoint | 设定值、目标值 | `rRoomTempSP` | 用户或配方希望达到的数值 |
| `PV` | Process Value | 过程实际值 | `rRoomTempPV` | 传感器或仿真模型反馈给控制器的实际值 |
| `MV` | Manipulated Variable | 操纵量 | `rHeaterMV` | 控制器对执行机构施加的控制量 |
| `CV` | Control Variable | 控制变量 | `rPIDCV` | 不同资料含义可能不同，项目内需约定 |
| `Out` | Output | 计算或功能输出 | `rPIDOut` | 一般输出值，不一定连接硬件 |
| `In` | Input | 功能输入 | `rPIDIn` | 一般输入值 |
| `Raw` | Raw Value | 未换算原始值 | `iRoomTempRawAI` | 不是℃、bar等工程量 |
| `Eng` | Engineering Value | 工程量 | `rRoomTempEng` | 已转换成实际工程单位 |
| `Actual` | Actual Value | 实际值 | `rSpeedActual` | 可读性强，但闭环控制优先用PV |
| `Target` | Target Value | 目标值 | `rPositionTarget` | 运动或生产目标 |
| `Ref` | Reference | 给定值、参考值 | `rSpeedRef` | 驱动系统常见用法 |
| `Max` | Maximum | 最大值 | `rTempMax` | 数据或参数允许的最大值 |
| `Min` | Minimum | 最小值 | `rTempMin` | 数据或参数允许的最小值 |
| `High` | High | 高、高限 | `rTempHighLimit` | 不要只写含义模糊的`H` |
| `Low` | Low | 低、低限 | `rTempLowLimit` | 不要只写含义模糊的`L` |
| `UpperLimit` | Upper Limit | 上限 | `rPressureUpperLimit` | 完整且清晰 |
| `LowerLimit` | Lower Limit | 下限 | `rPressureLowerLimit` | 完整且清晰 |
| `Deadband` | Deadband | 死区 | `rTempDeadband` | 防止输出频繁切换 |
| `Hysteresis` / `Hys` | Hysteresis | 回差、滞环 | `rTempHysteresis` | 开关控制常用 |
| `Offset` | Offset | 偏移量 | `rTempOffset` | 零点或数值补偿 |
| `Gain` | Gain | 增益 | `rHeatGain` | 比例放大或仿真升温系数 |
| `Rate` | Rate | 变化率、速率 | `rTempRiseRate` | 单位要在注释或名称中说明 |
| `Count` / `Cnt` | Count | 当前计数 | `uiProductCount` | 可清零的当前数量 |
| `Total` | Total | 累计总量 | `udiProductionTotal` | 长期累计值 |
| `Index` / `Idx` | Index | 数组索引、序号 | `uiMotorIdx` | 指向数组中的某个元素 |
| `No` | Number | 编号 | `uiRecipeNo` | 表示编号，不一定可计算 |
| `ID` | Identifier | 唯一标识 | `udiProductID` | 唯一身份编号 |
| `Step` | Step | 当前流程步 | `iSequenceStep` | 顺序控制步骤号 |
| `Mode` | Mode | 模式 | `iSystemMode` | 建议配合枚举或常量 |
| `Set` | Set Value | 设置值 | `rSpeedSet` | 可用，但闭环设定值优先用SP |
| `Calc` | Calculated | 计算值 | `rSpeedCalc` | 程序计算产生 |
| `Filtered` / `Filt` | Filtered | 滤波后的值 | `rPressureFiltered` | 与原始PV区分 |
| `Avg` | Average | 平均值 | `rTempAvg` | 说明统计后的数值 |

### 3. 信号来源和硬件接口后缀

| 后缀 | 英文全称 | 中文解释 | 示例 |
|---|---|---|---|
| `DI` | Digital Input | PLC数字量输入 | `xStartPB_DI` |
| `DO` | Digital Output | PLC数字量输出 | `xM01ContactorDO` |
| `AI` | Analog Input | PLC模拟量输入 | `iRoomTempRawAI` |
| `AO` | Analog Output | PLC模拟量输出 | `iHeaterRawAO` |
| `HMI` | Human-Machine Interface | 信号来自或送往HMI | `xSystemStartCmdHMI` |
| `PLC` | Programmable Logic Controller | PLC侧信号 | `xHeartbeatPLC` |
| `SCADA` | Supervisory Control and Data Acquisition | SCADA侧信号 | `xResetReqSCADA` |
| `MES` | Manufacturing Execution System | MES侧信号 | `xOrderReadyMES` |
| `PB` | Push Button | 现场实体按钮 | `xStartPB` |
| `LS` | Limit Switch | 限位开关 | `xCylinderExtendLS` |
| `PE` | Photoelectric Sensor | 光电传感器 | `xProductPresentPE` |
| `Enc` | Encoder | 编码器 | `diPositionPulseEnc` |
| `Sim` | Simulation | 仿真信号 | `rRoomTempPVSim` |

> 为了提高可读性，简单变量可以不加下划线，例如`xStartPB`；当需要明确区分来源时，可以在团队规范中统一使用`xStartCmdHMI`或`xStartCmd_HMI`，但同一项目只能选择一种写法。

### 4. 常用工程单位后缀

| 后缀 | 英文全称 | 中文单位 | 示例 |
|---|---|---|---|
| `Pct` | Percent / Percentage | 百分比，% | `rHeaterOutPct` |
| `DegC` | Degrees Celsius | 摄氏度，℃ | `rRoomTempDegC` |
| `DegF` | Degrees Fahrenheit | 华氏度，℉ | `rTempDegF` |
| `K` | Kelvin | 开尔文，K | `rTempK` |
| `Pa` | Pascal | 帕，Pa | `rPressurePa` |
| `kPa` | Kilopascal | 千帕，kPa | `rPressureKPa` |
| `MPa` | Megapascal | 兆帕，MPa | `rHydraulicPressureMPa` |
| `Bar` | Bar | 巴，bar | `rAirPressureBar` |
| `mbar` | Millibar | 毫巴，mbar | `rVacuumMbar` |
| `V` | Volt | 伏特，V | `rBusVoltageV` |
| `mV` | Millivolt | 毫伏，mV | `rSensorVoltageMV` |
| `A` | Ampere | 安培，A | `rMotorCurrentA` |
| `mA` | Milliampere | 毫安，mA | `rSensorCurrentMA` |
| `W` | Watt | 瓦，W | `rHeaterPowerW` |
| `kW` | Kilowatt | 千瓦，kW | `rMotorPowerKW` |
| `kWh` | Kilowatt-hour | 千瓦时，kWh | `lrEnergyTotalKWh` |
| `Hz` | Hertz | 赫兹，Hz | `rMotorFreqHz` |
| `Rpm` | Revolutions Per Minute | 转/分钟，rpm | `rMotorSpeedRpm` |
| `Deg` | Degree | 角度，° | `rAxisAngleDeg` |
| `Rad` | Radian | 弧度，rad | `rAxisAngleRad` |
| `Pulse` | Pulse | 脉冲数 | `diEncoderPulse` |
| `Mm` | Millimetre | 毫米，mm | `rPositionMm` |
| `Cm` | Centimetre | 厘米，cm | `rLevelCm` |
| `M` | Metre | 米，m | `rLengthM` |
| `Um` | Micrometre | 微米，μm | `rThicknessUm` |
| `Mmps` | Millimetres Per Second | 毫米/秒，mm/s | `rAxisSpeedMmps` |
| `Mps` | Metres Per Second | 米/秒，m/s | `rLineSpeedMps` |
| `Mpm` | Metres Per Minute | 米/分钟，m/min | `rLineSpeedMpm` |
| `L` | Litre | 升，L | `rTankVolumeL` |
| `mL` | Millilitre | 毫升，mL | `rDoseVolumeML` |
| `Lpm` | Litres Per Minute | 升/分钟，L/min | `rWaterFlowLpm` |
| `M3` | Cubic Metre | 立方米，m³ | `rTankVolumeM3` |
| `M3h` | Cubic Metres Per Hour | 立方米/小时，m³/h | `rAirFlowM3h` |
| `G` | Gram | 克，g | `rProductWeightG` |
| `Kg` | Kilogram | 千克，kg | `rProductWeightKg` |
| `T` | Tonne | 吨，t | `rMaterialWeightT` |
| `N` | Newton | 牛顿，N | `rForceN` |
| `Nm` | Newton-metre | 牛·米，N·m | `rTorqueNm` |
| `NPerMm` | Newton Per Millimetre | 牛/毫米，N/mm | `rTensionNPerMm` |
| `S` / `Sec` | Second | 秒，s | `rCycleTimeSec` |
| `Ms` | Millisecond | 毫秒，ms | `udiCycleTimeMs` |
| `Min` | Minute | 分钟，min | `uiMixTimeMin` |
| `Hr` | Hour | 小时，h | `rRunTimeHr` |
| `Us` | Microsecond | 微秒，μs | `udiPulseTimeUs` |

> 单位后缀需要兼顾可读性和团队习惯。大小写无法完全遵循国际单位符号时，以“项目内一致”为优先，例如统一使用`KPa`、`KW`、`KWh`。无论变量名是否带单位，中文注释中都必须写清量程和单位。

---
title: 西门子PLC程序块命名速查表：OB、FB与DB
published: 2026-09-04
description: 汇总TIA Portal项目中组织块OB、功能块FB和数据块DB的命名逻辑、常用英文、中文注释及项目实例。
tags:
  - PLC
  - 程序块命名
  - OB
  - FB
  - DB
  - TIA Portal
category: PLC基础
draft: false
---

> 适用范围：TIA Portal、S7-1200/1500、LAD程序、设备控制、模拟量、PID与仿真项目。  
> 核心原则：**OB按“什么时候执行”命名，FB按“负责什么功能”命名，DB按“保存什么数据、属于谁”命名。**

## 一、先理解OB、FB和DB分别负责什么

| 程序块 | 英文全称 | 核心作用 | 命名时重点回答 |
|---|---|---|---|
| `OB` | Organization Block | 决定程序何时执行，是PLC操作系统与用户程序之间的入口 | 什么时候执行？什么事件触发？ |
| `FB` | Function Block | 封装一个设备或一项需要保存内部状态的控制功能 | 控制谁？完成什么功能？ |
| `DB` | Data Block | 保存参数、状态、设定值、配方、通信数据或FB实例数据 | 保存什么数据？属于哪个功能或设备？ |

三者的基本关系：

```text
OB决定调用时机
      ↓
FB执行具体控制功能
      ↓
DB保存FB需要的参数和状态
```

以恒温PID项目为例：

```text
OB_Cyclic100ms
      ↓ 每100 ms调用
PID_Compact / FB_TemperatureSimulation
      ↓ 读取和更新
DB_PIDCompact_Temperature / DB_TemperatureSimulation
```

---

## 二、统一命名格式

### 1. OB命名格式

```text
OB_执行周期或触发事件
```

例如：

```text
OB_Main
OB_Startup
OB_Cyclic100ms
OB_HardwareInterrupt
```

### 2. FB命名格式

```text
FB_控制对象或功能名称
```

例如：

```text
FB_MotorControl
FB_ValveControl
FB_TemperatureSimulation
FB_SequenceControl
```

### 3. DB命名格式

全局数据块：

```text
DB_数据所属功能
```

实例数据块：

```text
DB_FB功能_设备或对象编号
```

例如：

```text
DB_GlobalParameters
DB_HMIData
DB_MotorControl_M01
DB_PIDCompact_Temperature
```

### 4. 大小写与下划线

本博客统一使用：

```text
块类型缩写 + 下划线 + 大驼峰功能名称
```

推荐：

```text
FB_MotorControl
DB_TemperatureControl
OB_Cyclic100ms
```

不推荐：

```text
fb_motor_control
FBmotorcontrol
Motor_FB
DB1_New
```

---

## 三、OB组织块命名速查表

### 1. 常见OB名称

| 推荐名称 | 英文解释 | 中文作用 | 典型用途 |
|---|---|---|---|
| `OB_Main` | Main Program Cycle | 主循环组织块 | PLC正常运行时循环执行主程序 |
| `OB_Startup` | Startup | 启动组织块 | PLC由STOP切换到RUN时执行初始化 |
| `OB_Cyclic10ms` | Cyclic Interrupt 10 ms | 10 ms循环中断 | 快速采样或高速控制 |
| `OB_Cyclic50ms` | Cyclic Interrupt 50 ms | 50 ms循环中断 | 较快的周期控制任务 |
| `OB_Cyclic100ms` | Cyclic Interrupt 100 ms | 100 ms循环中断 | PID、温度仿真及周期计算 |
| `OB_Cyclic500ms` | Cyclic Interrupt 500 ms | 500 ms循环中断 | 较慢的数据更新任务 |
| `OB_Cyclic1s` | Cyclic Interrupt 1 s | 1秒循环中断 | 运行时间累计、慢速监控 |
| `OB_TimeOfDay` | Time-of-Day Interrupt | 日期时间中断 | 到达指定时间后执行任务 |
| `OB_TimeDelay` | Time-Delay Interrupt | 延时中断 | 触发后延迟一定时间执行 |
| `OB_HardwareInterrupt` | Hardware Interrupt | 硬件中断 | 模块或通道事件触发 |
| `OB_DiagnosticError` | Diagnostic Error | 诊断错误组织块 | 模块诊断事件处理 |
| `OB_TimeError` | Time Error | 时间错误组织块 | 程序执行时间异常处理 |
| `OB_Communication` | Communication Event | 通信事件组织块 | 特定通信事件处理，按项目需要使用 |

> 实际可用的OB类型、编号和触发方式取决于CPU型号及TIA Portal中的组态。名称用于表达作用，不能代替硬件组态。

### 2. OB常用英文

| 英文 | 缩写或写法 | 中文解释 |
|---|---|---|
| Main | `Main` | 主程序、主要任务 |
| Startup | `Startup` | 启动、初始化阶段 |
| Cycle | `Cycle` | 循环 |
| Cyclic | `Cyclic` | 周期执行的 |
| Interrupt | `Interrupt` | 中断 |
| Hardware | `Hardware` | 硬件 |
| Diagnostic | `Diagnostic` | 诊断 |
| Error | `Error` | 错误 |
| Time | `Time` | 时间 |
| Time of Day | `TimeOfDay` | 一天中的指定时间 |
| Delay | `Delay` | 延时 |
| Event | `Event` | 事件 |
| Communication | `Communication` / `Comm` | 通信 |
| Safety | `Safety` | 安全相关 |

### 3. OB标题和注释模板

#### 主循环OB

```text
块名称：OB_Main
块标题：主循环程序
块注释：PLC正常运行时循环执行，用于调用系统控制、设备控制、HMI处理和报警管理程序块。
```

#### 100 ms循环中断OB

```text
块名称：OB_Cyclic100ms
块标题：100 ms周期控制任务
块注释：每100 ms周期执行，用于调用PID控制器、温度仿真模型及需要固定采样周期的运算程序。
```

#### 启动OB

```text
块名称：OB_Startup
块标题：PLC启动初始化
块注释：PLC进入RUN模式时执行一次，用于初始化状态、默认参数和启动标志。
```

### 4. OB命名注意事项

- OB名称必须突出执行时机，不要用设备名称代替执行条件。
- 周期中断名称建议直接包含周期，例如`100ms`、`500ms`或`1s`。
- 固定周期要求的控制器，应放在相应循环中断OB中调用。
- 不要把全部程序直接堆在OB中；OB主要负责组织和调用。
- OB编号由PLC系统规则和项目组态决定，名称不能随意代替编号。

---

## 四、FB功能块命名速查表

### 1. FB与FC的区别

| 类型 | 英文全称 | 是否需要实例DB | 适合用途 |
|---|---|---|---|
| `FB` | Function Block | 需要 | 电机、阀门、气缸、顺控、状态机、设备管理等需要保存状态的功能 |
| `FC` | Function | 通常不需要 | 数学计算、单位换算、限幅、简单判断等不需要保存内部状态的功能 |

判断方法：

```text
需要记住上一次状态、定时器状态或内部步骤 → 优先使用FB
输入相同就应得到相同结果，不需要保存状态 → 可以使用FC
```

### 2. 设备控制FB

| 推荐名称 | 英文解释 | 中文作用 |
|---|---|---|
| `FB_MotorControl` | Motor Control | 电机启停、联锁、反馈和故障控制 |
| `FB_VFDControl` | Variable Frequency Drive Control | 变频器启停、频率给定及状态处理 |
| `FB_ServoControl` | Servo Control | 伺服使能、定位及状态管理 |
| `FB_AxisControl` | Axis Control | 运动轴控制 |
| `FB_PumpControl` | Pump Control | 泵控制 |
| `FB_FanControl` | Fan Control | 风机控制 |
| `FB_ConveyorControl` | Conveyor Control | 输送机控制 |
| `FB_ValveControl` | Valve Control | 阀门开关及反馈控制 |
| `FB_CylinderControl` | Cylinder Control | 气缸伸出、缩回及限位控制 |
| `FB_HeaterControl` | Heater Control | 加热器启停、联锁及保护控制 |
| `FB_CoolerControl` | Cooler Control | 冷却设备控制 |
| `FB_TankControl` | Tank Control | 储罐进料、排料和液位控制 |

### 3. 工艺和顺序控制FB

| 推荐名称 | 英文解释 | 中文作用 |
|---|---|---|
| `FB_SequenceControl` | Sequence Control | 顺序流程和步骤控制 |
| `FB_StateMachine` | State Machine | 状态机控制 |
| `FB_BatchControl` | Batch Control | 批次过程控制 |
| `FB_RecipeManager` | Recipe Manager | 配方选择、读取和保存 |
| `FB_ModeManager` | Mode Manager | 手动、自动、就地和远程模式管理 |
| `FB_PermissionManager` | Permission Manager | 启动许可条件管理 |
| `FB_InterlockManager` | Interlock Manager | 联锁条件管理 |
| `FB_AlarmManager` | Alarm Manager | 报警生成、锁存、确认和复位 |
| `FB_RuntimeCounter` | Runtime Counter | 设备运行时间累计 |
| `FB_ProductionCounter` | Production Counter | 产品数量和产量累计 |

### 4. 模拟量和闭环控制FB

| 推荐名称 | 英文解释 | 中文作用 |
|---|---|---|
| `FB_AnalogInput` | Analog Input Processing | 模拟量输入转换、断线判断和滤波 |
| `FB_AnalogOutput` | Analog Output Processing | 工程量到输出原始值的转换和限幅 |
| `FB_SignalFilter` | Signal Filter | 信号滤波处理 |
| `FB_TemperatureControl` | Temperature Control | 温度控制功能 |
| `FB_PressureControl` | Pressure Control | 压力控制功能 |
| `FB_LevelControl` | Level Control | 液位控制功能 |
| `FB_FlowControl` | Flow Control | 流量控制功能 |
| `FB_PIDWrapper` | PID Wrapper | 对PID工艺对象进行项目化封装 |
| `FB_TemperatureSimulation` | Temperature Simulation | 模拟升温和环境散热过程 |
| `FB_ProcessSimulation` | Process Simulation | 通用被控对象仿真 |

### 5. 通信和数据处理FB

| 推荐名称 | 英文解释 | 中文作用 |
|---|---|---|
| `FB_CommunicationManager` | Communication Manager | 通信连接和状态管理 |
| `FB_ModbusTCPClient` | Modbus TCP Client | Modbus TCP客户端通信 |
| `FB_ModbusTCPServer` | Modbus TCP Server | Modbus TCP服务器通信 |
| `FB_ProfinetDevice` | PROFINET Device | PROFINET设备数据处理 |
| `FB_DriveCommunication` | Drive Communication | PLC与驱动器通信处理 |
| `FB_RobotInterface` | Robot Interface | PLC与机器人信号交互 |
| `FB_HMIInterface` | HMI Interface | HMI命令、状态和参数交互 |
| `FB_DataLogger` | Data Logger | 数据记录和缓存 |
| `FB_HeartbeatMonitor` | Heartbeat Monitor | 通信心跳和超时监视 |

### 6. FB常用功能单词

| 英文 | 中文解释 | 适用示例 |
|---|---|---|
| Control | 控制 | `FB_MotorControl` |
| Manager | 管理多个对象、状态或任务 | `FB_AlarmManager` |
| Handler | 处理某类事件或数据 | `FB_ErrorHandler` |
| Monitor | 监视 | `FB_HeartbeatMonitor` |
| Interface | 接口、信号交互 | `FB_HMIInterface` |
| Simulation | 仿真 | `FB_TemperatureSimulation` |
| Processing | 处理 | `FB_AnalogInputProcessing` |
| Counter | 计数器、累计功能 | `FB_RuntimeCounter` |
| Sequence | 顺序流程 | `FB_SequenceControl` |
| State Machine | 状态机 | `FB_StateMachine` |
| Communication | 通信 | `FB_CommunicationManager` |
| Diagnostic | 诊断 | `FB_DeviceDiagnostic` |
| Protection | 保护 | `FB_MotorProtection` |

### 7. FB标题和注释模板

```text
块名称：FB_MotorControl
块标题：通用电机控制
块注释：完成电机手动/自动启停、启动许可、运行反馈、超时判断和故障报警处理。
```

```text
块名称：FB_TemperatureSimulation
块标题：房间温度对象仿真
块注释：根据加热输出、环境温度、升温系数和散热系数，周期计算模拟房间温度。
```

```text
块名称：FB_SequenceControl
块标题：设备自动流程控制
块注释：根据启动条件、步骤完成条件和故障状态，管理自动运行步骤及流程复位。
```

### 8. FB命名注意事项

- 一个FB尽量只承担一类职责。
- 能重复使用的设备控制应使用通用名称，例如`FB_MotorControl`。
- 只服务于特定设备的FB，可以带设备或工艺名称，例如`FB_WinderControl`。
- 不要使用`FB_New`、`FB_Test1`、`FB_Program2`等无功能含义的名称。
- FB名称不需要包含输入、输出地址。
- `Control`表示控制功能，`Manager`表示管理多个对象或任务，两者不要随意混用。

---

## 五、DB数据块命名速查表

### 1. DB的主要分类

| DB类型 | 保存内容 | 推荐命名格式 | 示例 |
|---|---|---|---|
| 全局DB | 多个程序块共同访问的数据 | `DB_数据领域` | `DB_GlobalParameters` |
| 功能DB | 某个系统功能的数据 | `DB_功能名称` | `DB_TemperatureControl` |
| 设备DB | 某台或某组设备的数据 | `DB_设备名称` | `DB_MotorData` |
| 单实例DB | 某次FB调用的内部状态和接口数据 | `DB_FB功能_对象编号` | `DB_MotorControl_M01` |
| 工艺对象实例DB | PID、运动控制等工艺对象的实例数据 | `DB_工艺对象_控制对象` | `DB_PIDCompact_Temperature` |
| 配方DB | 产品工艺参数和配方 | `DB_Recipe`或`DB_Recipe_产品` | `DB_Recipe_ProductA` |
| HMI DB | HMI命令、显示状态和参数 | `DB_HMI`或`DB_HMIData` | `DB_HMIData` |
| 通信DB | 发送、接收和连接状态 | `DB_Communication_设备` | `DB_Communication_VFD01` |
| 保持DB | 断电后需要保留的数据 | `DB_RetainData` | `DB_RetainData` |
| 仿真DB | 仿真参数和模拟状态 | `DB_Simulation_对象` | `DB_Simulation_Temperature` |

### 2. 全局和系统数据DB

| 推荐名称 | 英文解释 | 中文作用 |
|---|---|---|
| `DB_GlobalParameters` | Global Parameters | 全局参数 |
| `DB_GlobalStatus` | Global Status | 全局运行状态 |
| `DB_SystemData` | System Data | 系统公共数据 |
| `DB_SystemParameters` | System Parameters | 系统参数 |
| `DB_SystemStatus` | System Status | 系统状态 |
| `DB_IOData` | Input/Output Data | 现场I/O映射和接口数据 |
| `DB_HMIData` | HMI Data | HMI交互数据 |
| `DB_AlarmData` | Alarm Data | 报警状态和记录数据 |
| `DB_RecipeData` | Recipe Data | 配方数据 |
| `DB_ProductionData` | Production Data | 生产数量和批次数据 |
| `DB_MaintenanceData` | Maintenance Data | 维护、寿命和运行时间数据 |
| `DB_RetainData` | Retentive Data | 断电保持数据 |
| `DB_Configuration` | Configuration Data | 系统配置数据 |

### 3. 设备和工艺数据DB

| 推荐名称 | 中文作用 |
|---|---|
| `DB_MotorData` | 电机数据集合 |
| `DB_ValveData` | 阀门数据集合 |
| `DB_CylinderData` | 气缸数据集合 |
| `DB_DriveData` | 驱动器数据集合 |
| `DB_AnalogData` | 模拟量数据集合 |
| `DB_TemperatureControl` | 温度控制参数和状态 |
| `DB_PressureControl` | 压力控制参数和状态 |
| `DB_LevelControl` | 液位控制参数和状态 |
| `DB_SequenceData` | 顺序流程步骤和状态 |
| `DB_SafetyStatus` | 安全状态汇总，普通程序使用的状态镜像 |

### 4. 实例DB命名

FB每个独立控制对象都需要保存自己的内部状态。单实例DB建议同时体现FB功能和对象编号。

| FB名称 | 控制对象 | 推荐实例DB名称 |
|---|---|---|
| `FB_MotorControl` | M01电机 | `DB_MotorControl_M01` |
| `FB_MotorControl` | M02电机 | `DB_MotorControl_M02` |
| `FB_ValveControl` | V01阀门 | `DB_ValveControl_V01` |
| `FB_CylinderControl` | CY01气缸 | `DB_CylinderControl_CY01` |
| `FB_ConveyorControl` | CV01输送机 | `DB_ConveyorControl_CV01` |
| `FB_TemperatureSimulation` | 房间温度 | `DB_TemperatureSimulation_Room` |
| `PID_Compact` | 房间温度控制 | `DB_PIDCompact_Temperature` |

如果项目较小、功能不会混淆，也可采用较短名称：

```text
DB_Motor_M01
DB_Valve_V01
DB_PID_Temperature
```

但同一个项目必须统一，不能一部分使用完整名称，另一部分随意缩写。

### 5. 多重实例命名

当一个上层FB将其他FB作为静态变量调用时，可以使用多重实例，内部实例变量建议使用：

```text
instMotor01
instValve01
instStartDelay
instAlarmManager
```

其中`inst`表示`Instance`，即实例。

示例：

```text
上层块：FB_LineControl
静态实例：instMotor01
数据类型：FB_MotorControl
中文注释：M01输送电机控制实例
```

多重实例的数据统一保存在上层FB的实例DB中，因此不会为每个内部FB单独生成实例DB。

### 6. DB常用英文

| 英文 | 中文解释 | 示例 |
|---|---|---|
| Global | 全局 | `DB_GlobalParameters` |
| System | 系统 | `DB_SystemStatus` |
| Data | 数据 | `DB_HMIData` |
| Parameter / Param | 参数 | `DB_SystemParameters` |
| Status | 状态 | `DB_GlobalStatus` |
| Configuration / Config | 配置 | `DB_Configuration` |
| Recipe | 配方 | `DB_RecipeData` |
| Production | 生产 | `DB_ProductionData` |
| Maintenance | 维护 | `DB_MaintenanceData` |
| Alarm | 报警 | `DB_AlarmData` |
| Communication / Comm | 通信 | `DB_Communication_VFD01` |
| Send / Tx | 发送 | `DB_CommTxData` |
| Receive / Rx | 接收 | `DB_CommRxData` |
| Retain | 保持、断电保存 | `DB_RetainData` |
| Simulation / Sim | 仿真 | `DB_Simulation_Temperature` |
| Instance / Inst | 实例 | `DB_MotorControl_M01` |
| Buffer | 缓冲区 | `DB_DataBuffer` |
| History | 历史记录 | `DB_AlarmHistory` |

### 7. DB标题和注释模板

```text
块名称：DB_TemperatureControl
块标题：恒温系统控制数据
块注释：保存房间温度设定值、实际值、加热输出、控制模式、报警限值和运行状态。
```

```text
块名称：DB_MotorControl_M01
块标题：M01电机控制实例数据
块注释：保存FB_MotorControl控制M01电机时所需的接口参数、内部状态和定时器数据。
```

```text
块名称：DB_HMIData
块标题：HMI交互数据
块注释：保存HMI操作命令、参数设定、页面状态和PLC显示数据。
```

### 8. DB命名注意事项

- 不要长期使用`DB1`、`DB2`作为唯一名称，编号不能表达数据用途。
- 不要把所有数据全部塞入`DB_Global`，应按系统、HMI、报警、配方、通信等职责拆分。
- 实例DB必须能够看出属于哪个FB和哪个设备。
- HMI需要访问的数据应集中规划，避免页面变量散落在多个无关DB中。
- 断电保持变量应集中管理，并在注释中说明保持原因。
- DB名称不应包含实际绝对地址，因为优化块访问可能不使用固定偏移地址。

---

## 六、B2恒温PID项目完整命名示例

### 1. 推荐程序块

| 类型 | 推荐名称 | 标题 | 作用 |
|---|---|---|---|
| OB | `OB_Main` | 主循环程序 | 处理启停、模式、报警和HMI逻辑 |
| OB | `OB_Cyclic100ms` | 100 ms周期控制任务 | 固定周期调用PID和温度仿真 |
| FB | `FB_TemperatureSimulation` | 房间温度对象仿真 | 模拟加热升温和环境散热 |
| DB | `DB_TemperatureSimulation_Room` | 房间温度仿真实例数据 | 保存仿真FB内部状态和参数 |
| 工艺对象实例DB | `DB_PIDCompact_Temperature` | 房间温度PID实例数据 | 保存PID_Compact内部状态和参数 |
| 全局DB | `DB_TemperatureControl` | 恒温系统控制数据 | 保存SP、PV、输出、模式和报警限值 |
| HMI DB | `DB_HMIData` | HMI交互数据 | 保存用户命令和画面参数 |

### 2. 推荐调用关系

```text
OB_Main
├─ 系统启动/停止逻辑
├─ 手动/自动模式逻辑
├─ 超温报警逻辑
└─ HMI数据处理

OB_Cyclic100ms
├─ PID_Compact
│  └─ DB_PIDCompact_Temperature
└─ FB_TemperatureSimulation
   └─ DB_TemperatureSimulation_Room
```

### 3. OB30程序段标题和注释

程序段1：

```text
标题：房间温度PID周期控制
注释：每100 ms无条件调用PID_Compact，根据房间温度设定值与实际值计算加热输出百分比。
```

程序段2：

```text
标题：房间温度对象仿真
注释：每100 ms调用温度仿真FB，根据PID加热输出和环境散热条件更新模拟房间温度，并反馈给PID控制器。
```

### 4. 数据连接关系

```text
DB_TemperatureControl.rRoomTempSP
                    ↓ Setpoint
        DB_PIDCompact_Temperature
                    ↓ Output
DB_TemperatureControl.rHeaterOutPct
                    ↓ HeatOut
       FB_TemperatureSimulation
                    ↓ SimTemp
DB_TemperatureControl.rRoomTempPV
                    ↓ Input
        DB_PIDCompact_Temperature
```

---

## 七、常见错误对照表

| 不推荐名称 | 问题 | 推荐名称 |
|---|---|---|
| `OB30_New` | 只表达编号，没有执行周期 | `OB_Cyclic100ms` |
| `OB_PID` | OB应首先表达调用时机 | `OB_Cyclic100ms` |
| `FB1` | 无法判断控制功能 | `FB_MotorControl` |
| `FB_Test` | 无法判断最终用途 | `FB_TemperatureSimulation` |
| `MotorProgram` | 没有程序块类型 | `FB_MotorControl` |
| `DB1` | 无法判断保存什么数据 | `DB_TemperatureControl` |
| `DB_Motor` | 多台电机时无法识别对象 | `DB_MotorControl_M01` |
| `DB_PID` | 多个PID时无法区分回路 | `DB_PIDCompact_Temperature` |
| `DB_AllData` | 容易变成无边界的大杂烩 | 按`HMI`、`Alarm`、`Recipe`等职责拆分 |
| `FB_Ctrl1` | 缩写和编号缺少对象含义 | `FB_ValveControl` |

---

## 八、新项目程序块规划模板

建立程序块之前，先填写下面这张表：

| 问题 | 需要填写的内容 |
|---|---|
| PLC主循环需要调用哪些功能？ | 决定`OB_Main`中的调用结构 |
| 哪些任务要求固定周期？ | 决定是否建立`OB_Cyclic100ms`等循环中断 |
| 有哪些重复控制对象？ | 决定建立哪些通用FB |
| 哪些功能需要保存内部状态？ | 决定使用FB而不是简单计算FC |
| 每个FB有多少个独立实例？ | 决定实例DB或多重实例数量 |
| 哪些数据需要多个块共同访问？ | 决定全局DB的划分 |
| 哪些数据需要HMI访问？ | 决定`DB_HMIData`或功能DB接口 |
| 哪些数据需要断电保持？ | 决定`DB_RetainData`及保持属性 |
| 哪些数据用于通信？ | 决定通信发送、接收和状态DB |
| 哪些数据只用于仿真？ | 决定仿真DB并避免与真实I/O混用 |

最终检查口诀：

```text
OB看时间，FB看功能，DB看归属；
名称能说明用途，注释能说明连接。
```


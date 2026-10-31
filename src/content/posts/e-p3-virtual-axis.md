---
author: 叶工
category: PLC练习项目
title: E-P3｜虚拟轴运动控制：从点动到定位与停止
description: 我用虚拟轴完成正反点动、坐标基准设置、绝对与相对定位，验证运动途中停止和重新发起运动，并记录轴未归位报警的排查。
published: 2026-11-01
lang: zh-CN
tags: [PLC, S7-1500, 运动控制, 虚拟轴, PLCSIM Advanced]
draft: false
---

我用 TIA Portal 和 PLCSIM Advanced 搭建了一根虚拟定位轴。从正反点动开始，完成了设置坐标基准、绝对定位、相对定位，以及运动途中的主动停止。

## 先看成果：走得动，也停得下

![目标200 mm，途中停在79.2 mm，停止完成且轴保持使能](/images/posts/e-p3-virtual-axis/01-halt-result.png)

*目标200 mm，途中停在79.2 mm，停止完成且轴保持使能*

我先发出“走到 **200 mm**”的定位请求，再在运动途中触发停止。轴停在 **79.2 mm**，实际速度归零，`xHaltDone` 为 TRUE，`xMoveAborted` 为 TRUE，轴仍保持使能。

|我做的操作|实际结果|
|---|---|
|正、反向点动|速度分别约 +10 / −10 mm/s，取消请求后停止|
|定义位置基准|当前位置设为 0 mm，Home 完成|
|绝对定位|0 → 100 → 20 mm|
|相对定位|20 + 50 = 70 mm；70 − 30 = 40 mm|
|途中停止|目标 200 mm，停在 79.2 mm|
|重新运动后再停|重新发出定位请求，再停在 186.8 mm|

## 我的虚拟轴与程序结构

工程为 **E_P3_Servo_Axis**，CPU 为 **1511-1 PN**，虚拟 PLC 地址 **192.168.60.10**。我使用 `TO_PositioningAxis`，轴名 `Axis_1`，勾选“虚拟轴”，位置单位 mm、速度单位 mm/s。

![Axis_1采用虚拟轴，线性坐标与mm单位](/images/posts/e-p3-virtual-axis/02-virtual-axis.png)

*Axis_1采用虚拟轴，线性坐标与mm单位*


> 我的操作顺序：轴使能 → 点动验证 → 建立位置基准 → 定位运动 → 途中停止。

Main（OB1）中有六段调用，`DB_AxisControl` 保存请求、参数与反馈；每条运动指令另有自己的实例 DB。

|Main 中的调用|我用它做什么|实例 DB|
|---|---|---|
|MC_Power|允许轴运动|DB_AxisPower|
|MC_MoveJog|正反点动|DB_AxisJog|
|MC_MoveAbsolute|走到指定坐标|DB_AxisMove|
|MC_Home|定义当前位置坐标|DB_AxisHome|
|MC_MoveRelative|再走一段指定距离|DB_AxisRelative|
|MC_Halt|减速停止当前运动|DB_AxisHalt|

<details>
<summary>展开：使能与点动的接线</summary>

![MC_Power连接使能请求与状态反馈](/images/posts/e-p3-virtual-axis/03-power-block.png)

*MC_Power连接使能请求与状态反馈*

![MC_MoveJog连接正反点动与速度变量](/images/posts/e-p3-virtual-axis/04-jog-block.png)

*MC_MoveJog连接正反点动与速度变量*


</details>

## 点动：正向走，反向走，取消请求就停

我把点动速度设成 **10 mm/s**，分别触发 `xJogForward` 和 `xJogBackward`。正向时位置增加，反向时位置减小；取消点动请求后，实际速度回到 0。

![正向点动：实际速度约+10 mm/s](/images/posts/e-p3-virtual-axis/05-forward-jog.png)

*正向点动：实际速度约+10 mm/s*

![反向点动：实际速度约-10 mm/s](/images/posts/e-p3-virtual-axis/06-reverse-jog.png)

*反向点动：实际速度约-10 mm/s*

监控值中的 9.999… 接近 10，是浮点数显示现象。这次我没有同时给两个方向请求。

## 第一次定位失败：有位置数值，还不算已归位

第一次触发绝对定位时，位置没有变化，指令返回 **16#8001**。继续查看轴报警，我找到了 **MC Alarm 321：轴未归位**。

![报警321：轴未归位，绝对定位请求被拒绝](/images/posts/e-p3-virtual-axis/07-not-homed.png)

*报警321：轴未归位，绝对定位请求被拒绝*

我增加 `MC_Home`，使用 **Mode = 0、Position = 0.0**，把虚拟轴当前位置定义为零点。设置后，`xHomeDone` 为 TRUE，位置为 0，错误码为 0000。

![零点设置完成，实际位置0且无错误](/images/posts/e-p3-virtual-axis/09-home-result.png)

*零点设置完成，实际位置0且无错误*

**这里是在设置坐标，轴本身不移动。** 我的实验没有真实机械，可以人为选择这个基准；真实设备不能在任意位置直接清零，需要先找到可信的机械基准。

<details>
<summary>展开：设置位置基准的接线</summary>

![MC_Home以Mode 0把当前位置定义为0 mm](/images/posts/e-p3-virtual-axis/08-home-block.png)

*MC_Home以Mode 0把当前位置定义为0 mm*


</details>

## 绝对定位：目标写多少，就停在哪个坐标

我先定位到 **100 mm**，完成后再把目标改为 **20 mm**，重新触发请求。轴自动反向运行，最终停在 20 mm。两次完成时，速度均为 0、Done 为 TRUE，定位无错误。

![绝对定位到100 mm完成，速度0](/images/posts/e-p3-virtual-axis/11-absolute-100.png)

*绝对定位到100 mm完成，速度0*

![从100 mm返回20 mm，定位完成](/images/posts/e-p3-virtual-axis/12-absolute-20.png)

*从100 mm返回20 mm，定位完成*

<details>
<summary>展开：绝对定位的接线</summary>

![MC_MoveAbsolute绝对定位指令](/images/posts/e-p3-virtual-axis/10-absolute-block.png)

*MC_MoveAbsolute绝对定位指令*


</details>

## 相对定位：从当前坐标再走一段

绝对定位关心“去哪里”，相对定位关心“再走多远”。我用两次运动对比了正、负距离。

![从20 mm相对移动+50 mm，停在70 mm](/images/posts/e-p3-virtual-axis/14-relative-plus.png)

*从20 mm相对移动+50 mm，停在70 mm*

![从70 mm相对移动-30 mm，停在40 mm](/images/posts/e-p3-virtual-axis/15-relative-minus.png)

*从70 mm相对移动-30 mm，停在40 mm*

|起点|Distance（移动距离）|终点|
|---|---|---|
|20 mm|+50 mm|70 mm|
|70 mm|−30 mm|40 mm|

两次均为 Done = TRUE、Error = FALSE，错误码 0000。请求写回 FALSE 后，完成信号清除，实际位置保持。

<details>
<summary>展开：相对定位的接线</summary>

![MC_MoveRelative相对定位指令](/images/posts/e-p3-virtual-axis/13-relative-block.png)

*MC_MoveRelative相对定位指令*


</details>

## 途中主动停止，再重新发起运动

我用 `MC_Halt` 中断正在执行的绝对定位。停在 79.2 mm 时，原定位的 `CommandAborted` 为 TRUE：这是被新停止命令中断，不是定位出错。

<details>
<summary>展开：减速停止的接线</summary>

![MC_Halt减速停止指令](/images/posts/e-p3-virtual-axis/16-halt-block.png)

*MC_Halt减速停止指令*


</details>

我将请求复位，再重新发出绝对定位命令，轴可以继续向目标运动；再次触发停止后，停在 **186.8 mm**，速度为 0，Halt 完成且没有错误。

![重新发起向200 mm定位后再次停止，停在186.8 mm](/images/posts/e-p3-virtual-axis/17-restart-stop.png)

*重新发起向200 mm定位后再次停止，停在186.8 mm*

这次验证的是程序控制减速停止，**不是安全急停**。停止后的运动需要重新发出请求。

## 这次真正记住的几件事

- **Enable（使能）**：允许轴运动；`MC_Power.Busy` 持续为 TRUE，不代表故障。
- **Execute（执行请求）**：我先写 FALSE，再写 TRUE，发起新任务。只在“修改值”栏填数，还要执行修改并确认“监视值”。
- **Busy / Done**：执行中 / 已完成。Done 随请求复位而清除，不表示轴丢失了已经建立的位置基准。
- **CommandAborted**：当前任务被其他命令中断；需要结合 Error 判断，不能把它直接当错误。
- **Error / ErrorID**：是否出错 / 错误码。8001 还要继续看工艺对象的具体报警。

下载后有一次绝对定位再次被拒绝，我重新完成位置基准设置后，才继续停止实验。以后我会检查“已归位”状态，不只看位置是否显示为 0。

另一个排障是模拟 CPU 曾出现 **OB91 事件缓冲区溢出**。我将 MC_Servo 周期从 **4 ms 调整到 20 ms** 后继续低速虚拟轴测试，短时观察和后续操作未再次出现该问题。这只是本次仿真调整记录，还不能算长期稳定性验证，也不作为真实驱动的周期配置结论。

这篇记录的是我已经完成的**虚拟轴软件实验**；真实伺服、机械回原点、限位保护和自动运行流程还没有在本项目中验证。


---

## 跟着重做：从变量到 Main 程序

下面是我这次实际使用的程序整理。我保留梯形图接线方式，先建变量，再按六个程序段连接，最后按顺序测试。

### 01 / 先分清三个“DB”

|对象|本次名称|用途|
|---|---|---|
|工艺对象|Axis_1 [DB1]|代表要控制的虚拟轴；所有指令的Axis都接它|
|全局数据块|DB_AxisControl [DB3]|保存操作请求、速度/位置参数、执行反馈|
|指令实例DB|DB_AxisPower等|保存对应指令的内部执行状态；插入指令时创建|

> DB编号由工程自动分配，重做时可能不同；本教程使用符号名称连接，不需要强行改成相同编号。

### 02 / 建立虚拟轴

1. 新建 CPU 1511-1 PN，项目命名 E_P3_Servo_Axis，PLC命名 PLC_Axis，地址设为192.168.60.10。
2. 工艺对象 → 新增对象 → TO_PositioningAxis，命名 Axis_1。
3. 基本参数勾选“虚拟轴”，选择线性轴，位置用mm，速度用mm/s。
4. 本次动态默认值：速度50 mm/s，加速度100 mm/s²，减速度100 mm/s²，斜坡上升/下降时间均0.05 s。运动指令中的速度另外设为10 mm/s。
5. 本次未启用模数及硬、软限位。保留自动生成的MC_Servo和MC_Interpolator组织块，不删除。

### 03 / 完整变量表：DB_AxisControl

新建全局数据块，名称填 DB_AxisControl。下面共39个变量。**起始值是下载/初始化所用的值；运行时看监视值。**

前缀只是命名习惯：x表示布尔开关，r表示实数，w表示字。Bool只有TRUE/FALSE；Real能保存小数；Word用于本次十六进制错误码。

#### 轴使能

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xPowerEnable`|Bool|false|请求轴使能；操作变量|
|`xPowerStatus`|Bool|false|轴已使能|
|`xPowerBusy`|Bool|false|使能指令工作中|
|`xPowerError`|Bool|false|使能错误|
|`wPowerErrorID`|Word|16#0|使能错误码|

#### 正反点动

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xJogForward`|Bool|false|正向点动请求|
|`xJogBackward`|Bool|false|反向点动请求|
|`rJogVelocity`|Real|10.0|点动速度，mm/s|
|`xJogInVelocity`|Bool|false|已达到点动速度|
|`xJogBusy`|Bool|false|点动执行中|
|`xJogAborted`|Bool|false|点动被其他任务中断|
|`xJogError`|Bool|false|点动错误|
|`wJogErrorID`|Word|16#0|点动错误码|

#### 绝对定位

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xMoveExecute`|Bool|false|绝对定位请求|
|`rMovePosition`|Real|100.0|目标坐标，mm|
|`rMoveVelocity`|Real|10.0|定位速度，mm/s；相对定位共用|
|`xMoveDone`|Bool|false|定位完成|
|`xMoveBusy`|Bool|false|定位执行中|
|`xMoveAborted`|Bool|false|定位被其他任务中断|
|`xMoveError`|Bool|false|定位错误|
|`wMoveErrorID`|Word|16#0|定位错误码|

#### 设置坐标基准

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xHomeExecute`|Bool|false|设置坐标请求|
|`xHomeDone`|Bool|false|设置完成|
|`xHomeBusy`|Bool|false|设置执行中|
|`xHomeError`|Bool|false|设置错误|
|`wHomeErrorID`|Word|16#0|设置错误码|

#### 相对定位

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xRelExecute`|Bool|false|相对移动请求|
|`rRelDistance`|Real|50.0|移动距离，mm；正负号决定方向|
|`xRelDone`|Bool|false|相对移动完成|
|`xRelBusy`|Bool|false|相对移动执行中|
|`xRelAborted`|Bool|false|相对移动被其他任务中断|
|`xRelError`|Bool|false|相对移动错误|
|`wRelErrorID`|Word|16#0|相对移动错误码|

#### 减速停止

|名称|类型|起始值|中文含义|
|---|---|---|---|
|`xHaltExecute`|Bool|false|减速停止请求|
|`xHaltDone`|Bool|false|减速停止完成|
|`xHaltBusy`|Bool|false|正在减速停止|
|`xHaltAborted`|Bool|false|停止任务被中断|
|`xHaltError`|Bool|false|停止错误|
|`wHaltErrorID`|Word|16#0|停止错误码|

### 04 / Main 六段梯形图：逐端口连接

Main是每轮扫描都会执行的主程序。每个程序段的EN直接连接左侧电源轨，让指令持续被调用；**不要用Execute触点控制EN**。动作由Enable、JogForward或Execute等输入决定。

下表的变量均在DB_AxisControl内。例如xPowerEnable的完整写法是 `"DB_AxisControl".xPowerEnable`。所有Axis端均选择 `"Axis_1"`。

#### 程序段 1 · 轴使能

**MC_Power · 实例 DB_AxisPower [DB2]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|Enable|输入|`"DB_AxisControl".xPowerEnable`|
|StartMode|输入常量|`1`|
|StopMode|输入常量|`0`|
|Status|输出|`"DB_AxisControl".xPowerStatus`|
|Busy|输出|`"DB_AxisControl".xPowerBusy`|
|Error|输出|`"DB_AxisControl".xPowerError`|
|ErrorID|输出|`"DB_AxisControl".wPowerErrorID`|

Enable 为 TRUE 时维持使能，Status 为 TRUE 后再发运动请求。

#### 程序段 2 · 正反点动

**MC_MoveJog · 实例 DB_AxisJog [DB4]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|JogForward|输入|`"DB_AxisControl".xJogForward`|
|JogBackward|输入|`"DB_AxisControl".xJogBackward`|
|Velocity|输入|`"DB_AxisControl".rJogVelocity`|
|Acceleration|输入常量|`-1.0`|
|Deceleration|输入常量|`-1.0`|
|Jerk|输入常量|`-1.0`|
|PositionControlled|输入常量|`TRUE`|
|InVelocity|输出|`"DB_AxisControl".xJogInVelocity`|
|Busy|输出|`"DB_AxisControl".xJogBusy`|
|CommandAborted|输出|`"DB_AxisControl".xJogAborted`|
|Error|输出|`"DB_AxisControl".xJogError`|
|ErrorID|输出|`"DB_AxisControl".wJogErrorID`|

方向请求保持 TRUE 时持续点动，两个请求都为 FALSE 后减速停止。不要同时给两个方向请求。

#### 程序段 3 · 绝对定位

**MC_MoveAbsolute · 实例 DB_AxisMove [DB5]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|Execute|输入|`"DB_AxisControl".xMoveExecute`|
|Position|输入|`"DB_AxisControl".rMovePosition`|
|Velocity|输入|`"DB_AxisControl".rMoveVelocity`|
|Acceleration|输入常量|`-1.0`|
|Deceleration|输入常量|`-1.0`|
|Jerk|输入常量|`-1.0`|
|Direction|输入常量|`1`|
|Done|输出|`"DB_AxisControl".xMoveDone`|
|Busy|输出|`"DB_AxisControl".xMoveBusy`|
|CommandAborted|输出|`"DB_AxisControl".xMoveAborted`|
|Error|输出|`"DB_AxisControl".xMoveError`|
|ErrorID|输出|`"DB_AxisControl".wMoveErrorID`|

Position 是目标坐标。线性轴未启用模数，本次保留 Direction 默认值。绝对定位前先建立位置基准。

#### 程序段 4 · 定义坐标

**MC_Home · 实例 DB_AxisHome [DB6]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|Execute|输入|`"DB_AxisControl".xHomeExecute`|
|Position|输入常量|`0.0`|
|Mode|输入常量|`0`|
|Done|输出|`"DB_AxisControl".xHomeDone`|
|Busy|输出|`"DB_AxisControl".xHomeBusy`|
|Error|输出|`"DB_AxisControl".xHomeError`|
|ErrorID|输出|`"DB_AxisControl".wHomeErrorID`|

本次 Mode 0 只把当前位置定义为0 mm，不会驱动轴寻找机械原点。ReferenceMarkPosition、CommandAborted 输出未接入本次变量。

#### 程序段 5 · 相对定位

**MC_MoveRelative · 实例 DB_AxisRelative [DB7]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|Execute|输入|`"DB_AxisControl".xRelExecute`|
|Distance|输入|`"DB_AxisControl".rRelDistance`|
|Velocity|输入|`"DB_AxisControl".rMoveVelocity`|
|Acceleration|输入常量|`-1.0`|
|Deceleration|输入常量|`-1.0`|
|Jerk|输入常量|`-1.0`|
|Done|输出|`"DB_AxisControl".xRelDone`|
|Busy|输出|`"DB_AxisControl".xRelBusy`|
|CommandAborted|输出|`"DB_AxisControl".xRelAborted`|
|Error|输出|`"DB_AxisControl".xRelError`|
|ErrorID|输出|`"DB_AxisControl".wRelErrorID`|

Distance 是从当前位置再走的距离，例如70加-30，终点就是40 mm。

#### 程序段 6 · 减速停止

**MC_Halt · 实例 DB_AxisHalt [DB8]**

|接口|方向|连接或填写|
|---|---|---|
|Axis|输入|`"Axis_1"`|
|Execute|输入|`"DB_AxisControl".xHaltExecute`|
|Deceleration|输入常量|`-1.0`|
|Jerk|输入常量|`-1.0`|
|AbortAcceleration|输入常量|`FALSE`|
|Done|输出|`"DB_AxisControl".xHaltDone`|
|Busy|输出|`"DB_AxisControl".xHaltBusy`|
|CommandAborted|输出|`"DB_AxisControl".xHaltAborted`|
|Error|输出|`"DB_AxisControl".xHaltError`|
|ErrorID|输出|`"DB_AxisControl".wHaltErrorID`|

停止正在执行的运动，保持轴使能；原运动的CommandAborted变TRUE。它不是安全急停。

输入里的 `-1.0` 表示沿用轴组态的对应动态默认值。本次没有额外编写FC或自动步进程序；六个指令在Main中持续调用，我通过监控表手动发请求。

### 05 / 把监控表整理成三组

|分组|加入内容|显示方式|
|---|---|---|
|操作区|所有Enable、Execute、正反点动请求，以及速度、位置、距离参数|Bool用布尔型；Real用浮点数|
|结果区|Status、Done、Busy、CommandAborted、Error|布尔型|
|位置与错误|"Axis_1".ActualPosition、"Axis_1".ActualVelocity，以及所有ErrorID|位置/速度用浮点数；错误码用十六进制|

监控表中同一个变量只保留一行即可；实验截图里的重复行不需要照抄。只修改请求与参数，不修改指令反馈，也不写ActualPosition/ActualVelocity。

### 06 / 测试流程：一次只发一种运动请求

<div style="display:flex;flex-wrap:wrap;gap:8px;margin:20px 0" aria-label="实验操作流程"><span>① 编译下载</span><span>→</span><span>② 轴使能</span><span>→</span><span>③ 点动验证</span><span>→</span><span>④ 定义坐标</span><span>→</span><span>⑤ 定位</span><span>→</span><span>⑥ 途中停止</span></div>

**准备：** PLCSIM Advanced启动PLC_Axis，下载编译后的程序，CPU进入RUN。所有运动请求先写FALSE，实际速度确认0。修改使用“修改一次”，不强制。

|步骤|我修改的值与操作|应该看到|
|---|---|---|
|使能|xPowerEnable写TRUE|xPowerStatus=TRUE，无使能错误；Enable维持TRUE|
|正反点动|rJogVelocity=10；正向请求TRUE后FALSE；再反向TRUE后FALSE|速度约+10、-10，取消请求后0；不同时触发|
|定义零点|所有运动请求FALSE；xHomeExecute先FALSE再TRUE；完成后写FALSE|xHomeDone=TRUE，无错误，当前位置变0；实际轴不移动|
|绝对定位100|rMovePosition=100，rMoveVelocity=10；xMoveExecute先FALSE再TRUE|到100，速度0，xMoveDone=TRUE|
|返回20|上次完成后xMoveExecute写FALSE；目标改20，再写TRUE|到20，Done=TRUE；之后Execute写FALSE|
|相对+50|rRelDistance=50；xRelExecute先FALSE再TRUE|20→70，Done=TRUE；之后请求写FALSE|
|相对-30|rRelDistance=-30；xRelExecute再从FALSE写TRUE|70→40，Done=TRUE；之后请求写FALSE|
|途中停止|Halt请求FALSE；绝对目标200并重新触发；看到运动后触发xHaltExecute|途中速度归0，HaltDone=TRUE，MoveAborted=TRUE；两请求再写FALSE|
|再次运动|Halt请求先FALSE，再重新触发绝对定位|接受新的定位任务；也可再次触发Halt验证停止|

**Execute像按一次启动按钮：FALSE→TRUE产生新的请求。** 完成后写FALSE，是为下一次触发做准备；不是把位置清零。运动已经开始后，把定位Execute写FALSE也不能当作停止按钮，主动停止用MC_Halt。

设置零点的请求只在需要建立坐标时触发，不要每次定位前都清零。下载或重启后若基准失效，应先确认已归位状态；看到位置0并不能代替这项检查。

### 07 / 看不懂反馈时，先查这张表

|英文|中文|本次怎么判断|
|---|---|---|
|Enable|使能|轴运动的许可|
|Execute|执行请求|先FALSE再TRUE触发|
|Status|状态|Power的Status为TRUE表示轴已使能|
|Busy|执行中|结合对应指令判断；Power的Busy可持续TRUE|
|Done|完成|定位到达或停止完成；请求复位后可以消失|
|CommandAborted|命令被中断|Halt中断定位时，原定位此信号TRUE属于预期|
|Error|错误|TRUE时继续查ErrorID|
|ErrorID|错误代码|8001继续看轴报警；本次报警321是未归位|
|Position / Distance|坐标 / 距离|绝对看终点坐标；相对看从当前再走多远|
|Velocity / Deceleration / Jerk|速度 / 减速度 / 加加速度|速度决定走多快，后两项影响减速及变化的平滑程度|

本教程对应我已完成的手动虚拟轴实验，不包含机械回原点、真实伺服接线、限位联锁或自动顺序控制。

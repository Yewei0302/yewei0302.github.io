---
title: C3自动清洗线仿真实践：GRAPH步序、暂停恢复与HMI控制
published: 2026-09-27
description: 使用S7-1500、GRAPH与LAD完成七段输送清洗线仿真，记录TONR暂停计时保留、完成计数、五类故障恢复与WinCC HMI接入。
image: ''
tags:
  - 西门子PLC
  - S7-1500
  - GRAPH
  - LAD
  - Factory I/O
  - WinCC
  - 故障恢复
category: PLC项目练习
draft: false
lang: zh-CN
---

使用 TIA Portal V19、PLCSIM Advanced、Factory I/O 和 WinCC，完成一条七段传送带清洗线的顺序控制、故障恢复与操作界面。本文记录关键程序和实际调试过程。

![图1｜自行搭建的 Factory I/O 清洗线：七段输送、五个处理工位。](/images/posts/c3-cleaning-line/01-scene.png)

*图1｜自行搭建的 Factory I/O 清洗线：七段输送、五个处理工位。*

## 从“能跑完”到“中断后还能继续”

C3的目标是让工件完成预冲洗、清洗剂喷淋、毛刷清洗、清水冲洗、吹风干燥，最后送出并计数。相比单纯的顺序动作，这次更关注中断处理：停止时要保留进度，故障后要能定位问题，排除原因后由操作人员明确恢复运行。

Factory I/O中的传送带和传感器模拟物料输送，工位指示灯表示相应处理过程。喷淋、毛刷和干燥采用定时逻辑模拟，没有建立真实流体、清洗效果或热过程模型。

<table><thead><tr><th>组成</th><th>本项目配置</th></tr></thead><tbody><tr><td>PLC与编程</td><td>S7-1500（CPU 1511-1 PN）；TIA Portal V19</td></tr><tr><td>运行环境</td><td>PLCSIM Advanced + Factory I/O</td></tr><tr><td>程序语言</td><td>GRAPH负责步序，LAD负责状态、故障、输出与计数</td></tr><tr><td>操作界面</td><td>WinCC；TP1500 Comfort，1280 × 800</td></tr><tr><td>场景</td><td>七段传送带、七个位置检测点、五个工位指示灯</td></tr></tbody></table>

![图2｜实际HMI运行画面：状态灯、当前步骤、完成计数、故障代码和操作按钮。](/images/posts/c3-cleaning-line/02-hmi-runtime.png)

*图2｜实际HMI运行画面：状态灯、当前步骤、完成计数、故障代码和操作按钮。*

### 程序职责

把“当前处于哪一步”“是否允许运行”“当前该开哪些输出”分开处理，可以减少在每个步序中重复编写相同条件。

<table><thead><tr><th>程序块</th><th>职责</th></tr></thead><tbody><tr><td>FB_SystemControl</td><td>处理启动、停止、恢复及系统状态，管理过程计时</td></tr><tr><td>FB_FaultControl</td><td>检测与锁存故障，给出代码、故障步骤和复位条件</td></tr><tr><td>FB_CleaningSequence</td><td>用GRAPH组织工艺步骤及转换</td></tr><tr><td>FB_OutputControl</td><td>根据步骤、运行许可和故障条件生成设备输出</td></tr><tr><td>FB_ProductCounter</td><td>记录出口经过状态，完成计数并管理计数确认</td></tr></tbody></table>

<details>
<summary>查看 Factory I/O 信号映射</summary>

输入对应操作按钮和位置传感器，输出对应传送带、工位灯及系统状态灯。

![补充图｜Factory I/O 与PLC输入、输出地址的映射。](/images/posts/c3-cleaning-line/03-io-mapping.png)

*补充图｜Factory I/O 与PLC输入、输出地址的映射。*

</details>

## 正常循环

<video src="/images/posts/c3-cleaning-line/normal-cycle.mp4" aria-label="正常完整循环" autoplay loop muted playsinline controls preload="metadata" style="width:100%;height:auto;"></video>

## 用GRAPH表达工艺顺序

顺序从等待、生成工件开始，依次完成工位间转运与定时处理。下表中的编号是程序显示的逻辑步骤码，例如70表示毛刷处理，不是GRAPH编辑器的第70个步骤。

<table><thead><tr><th>步骤码</th><th>动作</th><th>完成依据</th></tr></thead><tbody><tr><td>0 / 10</td><td>等待 / 生成工件</td><td>启动及入口检测条件</td></tr><tr><td>20 / 30</td><td>转运至预冲洗 / 预冲洗</td><td>到位 / 5秒</td></tr><tr><td>40 / 50</td><td>转运至清洗剂工位 / 喷淋</td><td>到位 / 5秒</td></tr><tr><td>60 / 70</td><td>转运至毛刷工位 / 毛刷清洗</td><td>到位 / 8秒</td></tr><tr><td>80 / 90</td><td>转运至清水冲洗 / 冲洗</td><td>到位 / 5秒</td></tr><tr><td>100 / 110</td><td>转运至干燥工位 / 干燥</td><td>到位 / 6秒</td></tr><tr><td>120 / 130</td><td>转运至出口 / 等待出口清空</td><td>出口检测及离开确认</td></tr><tr><td>135 / 140</td><td>出口延时输送 / 完成</td><td>2秒 / 计数确认</td></tr></tbody></table>

GRAPH转换条件同时受系统运行状态约束。这样，停止或故障后，即使某个传感器条件已经满足，步序也不会自行继续推进；输出则由输出控制块中的运行许可约束。

![图3｜GRAPH步序概览。](/images/posts/c3-cleaning-line/04-graph-sequence.gif)

*图3｜GRAPH步序概览。*

入口采用先生成、再输送的方式。入口传感器必须能够检测到刚生成的工件，检测成立后才能进入转运步骤。这一条件也成为后续调试中的关键点。

## 停止保留步骤，也保留已完成的时间

以70步毛刷清洗为例：目标处理时间为8秒。如果已经完成3秒后停止，恢复时应继续剩余过程。这里使用TONR，并将“计时使能”和“计时复位”分开编写。

<table><thead><tr><th>条件</th><th>逻辑作用</th></tr></thead><tbody><tr><td>系统运行，且当前步骤为70</td><td>允许毛刷定时器继续累计</td></tr><tr><td>初始化请求成立，或当前步骤不为70</td><td>复位毛刷定时器</td></tr><tr><td>停止但仍停留在70步</td><td>使能撤销、复位条件不成立，保留累计时间</td></tr><tr><td>恢复运行且仍处于70步</td><td>继续累计，完成后允许顺序进入下一步</td></tr></tbody></table>

![图4｜毛刷处理的使能、复位与TONR调用。暂停时不触发计时复位。](/images/posts/c3-cleaning-line/05-brush-tonr.png)

*图4｜毛刷处理的使能、复位与TONR调用。暂停时不触发计时复位。*

停止时保留当前步骤和累计时间，初始化时清除相应过程状态。

<video src="/images/posts/c3-cleaning-line/stop-resume.mp4" aria-label="停止与恢复" autoplay loop muted playsinline controls preload="metadata" style="width:100%;height:auto;"></video>

## 每件只计一次：完成脉冲与确认位

PLC会循环执行程序。如果在“完成步骤成立”时每扫描一次就加一，同一个工件可能被重复计数。本项目使用完成脉冲和计数确认位，使完成步骤与计数逻辑形成明确的交接。

<ol><li>进入140完成步，系统运行、未初始化，且尚未计数确认时，产生 <code>xCycleCompletePls</code>。</li><li>完成脉冲使 <code>diCompletedCountPV</code> 加一，并置位 <code>xCycleCountAckSts</code>。</li><li>确认位置位后阻止重复产生完成脉冲，同时供GRAPH完成步骤转换使用。</li><li>离开完成步或初始化时复位确认位，为下一件工件准备。</li></ol>

![图5｜完成脉冲的生成条件：完成步、未确认、运行中且无初始化请求。](/images/posts/c3-cleaning-line/07-count-pulse.png)

*图5｜完成脉冲的生成条件：完成步、未确认、运行中且无初始化请求。*

![图6｜计数加一、置位确认、离开完成步后清除确认。](/images/posts/c3-cleaning-line/08-count-ack.png)

*图6｜计数加一、置位确认、离开完成步后清除确认。*

出口还需要区分“尚未到达”和“已经经过并离开”。程序记录工件曾被出口传感器检测到，再结合传感器清空判断出料，避免把出口一开始就没有物料误认为出料完成。

<details>
<summary>查看出口经过标记与初始化处理</summary>

![补充图｜出口经过状态的置位、清除以及初始化时的计数清零。](/images/posts/c3-cleaning-line/09-exit-tracking.png)

*补充图｜出口经过状态的置位、清除以及初始化时的计数清零。*

</details>

## 现场按钮与HMI共用请求逻辑

HMI不直接改写系统运行状态，而是写入命令变量。OB1将现场按钮与HMI命令合并，形成统一的启动、复位和恢复请求，再由控制逻辑判断是否允许执行。

<table><thead><tr><th>请求</th><th>来源</th><th>去向</th></tr></thead><tbody><tr><td>xStartReq</td><td>现场启动 OR HMI启动命令</td><td>系统控制块的启动输入</td></tr><tr><td>xResetReq</td><td>现场复位 OR HMI复位命令</td><td>故障复位逻辑</td></tr><tr><td>xResumeReq</td><td>现场恢复 OR HMI恢复命令</td><td>系统控制块的恢复输入</td></tr><tr><td>xStopActiveSts</td><td>现场停止输入归一化后，与HMI停止命令合并</td><td>系统控制块的停止输入</td></tr></tbody></table>

![图7｜启动与故障复位请求合并。](/images/posts/c3-cleaning-line/10-hmi-requests.png)

*图7｜启动与故障复位请求合并。*

![图8｜统一请求接入 FB_SystemControl；停止与急停使用处理后的状态。](/images/posts/c3-cleaning-line/11-system-control-call.png)

*图8｜统一请求接入 FB_SystemControl；停止与急停使用处理后的状态。*

HMI按钮采用按下置位、松开复位的方式。START用于启动，STOP用于停止，RESET用于故障复位，RESUME用于从保留的步骤恢复。RESET与RESUME分开，保证故障复位不会直接触发设备动作。

<details>
<summary>查看停止、急停输入处理与恢复请求合并</summary>

![补充图｜停止输入归一化及HMI停止命令接入；急停输入独立处理。](/images/posts/c3-cleaning-line/12-stop-estop-inputs.png)

*补充图｜停止输入归一化及HMI停止命令接入；急停输入独立处理。*

![补充图｜现场恢复按钮与HMI恢复命令合并。](/images/posts/c3-cleaning-line/13-resume-request.png)

*补充图｜现场恢复按钮与HMI恢复命令合并。*

</details>

## 故障恢复：先清除原因，再复位，再恢复

故障发生后，程序锁存报警并记录首次故障所在步骤。操作顺序为：排除原因 → RESET复位 → RESUME恢复。急停未释放时不能复位，释放急停和故障复位也不会自动启动。

故障码用于区分问题类别，故障步骤用于定位中断位置。调试结果如下。

<table><thead><tr><th>故障码</th><th>类型</th><th>本次测试记录</th></tr></thead><tbody><tr><td>10</td><td>急停</td><td>急停未释放不能复位；释放、复位后仍需单独恢复</td></tr><tr><td>20</td><td>转运超时</td><td>40步触发；排除原因并恢复后正常完成</td></tr><tr><td>30</td><td>位置丢失</td><td>70步触发；恢复后计时继续</td></tr><tr><td>40</td><td>出口堵料</td><td>120步触发；恢复后正常出料并计数</td></tr><tr><td>50</td><td>过程故障</td><td>70步触发；恢复后计时继续，完成计数正常</td></tr></tbody></table>

正常循环、停止保持、恢复运行以及HMI操作均已完成仿真测试。HMI显示故障代码和故障步骤。

<aside><strong>项目边界</strong>

这里验证的是仿真程序中的急停状态处理与恢复顺序，不是实体设备安全回路或安全功能认证。

</aside>

## 调试记录

### 入口检测不到工件，流程无法进入输送

最初入口传感器放在生成工件之后的位置，但程序需要先检测到工件才允许输送。工件不移动就到不了传感器，检测不成立又无法开始移动。调整入口传感器，使其能检测到生成位置的工件后，流程恢复正常。这个问题提醒我，场景位置与程序进入条件必须一起检查。

### 故障灯常亮，要先确认急停实际状态

调试中确认了当前Factory I/O映射下，急停按下为TRUE、释放为FALSE，程序输入极性必须与此一致。后来再次出现故障灯常亮，最终发现是场景中的急停确实处于按下状态，释放后设备恢复正常。重启软件并不能消除仍然存在的输入条件。

### HMI变量出现“无效值类型”

HMI配置时遇到过变量标红和“无效值类型”，重新编译后恢复正常。

### HMI停止状态曾阻止启动

曾出现启动命令已发出，但停止状态仍然有效的情况；在HMI上按下并松开一次STOP后，系统能够正常操作。这说明排查时需要跟踪“按钮命令 → 合并请求 → 控制状态”的完整路径。

### 这次项目的收获

C3让我把顺序控制、设备输出、故障处理、过程计时和HMI操作连成了一个完整流程。GRAPH使工艺顺序直观，LAD把允许运行与恢复条件表达清楚；完成确认位和出口经过标记则解决了跨扫描周期的状态交接。

判断一条线是否完成，不只是看它能否从头跑到尾，还要看它停在哪里、保留了什么、由什么条件允许继续。后续扩展报警或上位机功能时，这些明确的状态与请求接口也能继续使用。

---
author: 叶工
category: PLC练习项目
description: 我用FreeOpcUa连接S7-1500虚拟PLC，完成变量读取、变化订阅、设定值写入、只读权限拒绝，以及手动重连后的读取与重新订阅。
draft: false
lang: zh-CN
published: 2026-10-22
tags: [PLC, S7-1500, OPC UA, FreeOpcUa, PLCSIM Advanced, 数据采集]
title: E7｜OPC UA变量读写、订阅与权限验证
---

我让S7-1500虚拟PLC作为OPC UA服务器，用FreeOpcUa Client读取温度与运行状态、写入设定值，并验证只读保护和手动重连后的数据读取。

> 本次是**同一台虚拟机中的实际软件通信测试**，不是实体PLC现场验证。采用None通道和匿名访问；加密、证书互信、异常断网自动恢复及数据质量状态处理尚未完成验证。

## 先看成果｜客户端写入，PLC同步变化

![客户端设定值与TIA监视表同时显示35.0](/images/posts/e7-opcua-data-access/01-write-setpoint.png)

我从客户端把 `rSetpoint` 从30.0改成 **35.0**，TIA监视表中的实际值也变成35.0。这次写入走的是OPC UA，不是在TIA中修改同一个值来代替客户端测试。

## 变化订阅｜温度与运行状态自动更新

![TIA温度改为26.6，OPC UA订阅收到约26.60000038](/images/posts/e7-opcua-data-access/02-subscription-temperature.png)

![温度恢复25.0、运行状态改为TRUE，客户端订阅同步变化](/images/posts/e7-opcua-data-access/03-subscription-running.png)

我在TIA中修改PLC实际值，客户端不点Refresh也能收到变化：温度25.0→26.6，随后恢复25.0；运行状态False→True。客户端显示的26.60000038是REAL浮点数的表示精度，不是传输时把26.6改错了。

## 只读保护｜能输入，不等于服务器接受

![客户端尝试将只读温度写为28.0，服务器返回BadNotWritable，PLC仍为25.0](/images/posts/e7-opcua-data-access/04-write-denied.png)

我尝试从客户端把只读温度写成28.0，服务器拒绝并返回：

```text
BadNotWritable
The access level does not allow writing to the Node
```

属性编辑区暂时显示28.0，但订阅列表和TIA实际值仍是25.0。判断写入是否成功，要看返回状态和PLC实际值，不能只看编辑框。属性区Refresh后可重新读取服务器值。

## 手动重连｜读取最新值后重新订阅

![手动重连后读到温度29.0，原订阅列表为空](/images/posts/e7-opcua-data-access/05-reconnect-read.png)

![重新订阅温度后显示29.0与时间戳](/images/posts/e7-opcua-data-access/06-resubscribe.png)

我主动Disconnect，在TIA中将温度改为29.0，再手动Connect。重连后属性区能读取29.0，但原订阅列表为空；重新订阅温度后，列表显示29.0和时间戳。

本次结论是 **手动重连后可读到当前值，并重新添加订阅**，没有验证自动重连、原订阅自动恢复，也没有记录异常断网时客户端是否自动把旧数据标为无效。

## 环境与接口｜这次是真正跑通了软件通信

![PLC以太网地址192.168.60.1，掩码255.255.255.0](/images/posts/e7-opcua-data-access/09-plc-ip.png)

![PLCSIM Advanced V6.0实例E7_102处于RUN，TCP/IP Single Adapter为Local](/images/posts/e7-opcua-data-access/10-plcsim.png)

| 项目 | 本次使用 |
| --- | --- |
| 工程 | 最初E7_OPCUA，后续截图显示E7_OPCUA1；PLC_1 |
| PLC组态 | CPU1511-1 PN，固件V2.9 |
| 软件 | TIA Portal V19、S7-PLCSIM Advanced V6.0、FreeOpcUa Client |
| 服务器 | S7-1500虚拟PLC，实例E7_102 |
| 访问方式 | TCP/IP Single Adapter，Local；客户端与仿真PLC在同一台虚拟机 |
| PLC IP | 192.168.60.1，255.255.255.0 |
| 客户端所在Windows | 端口测试中显示192.168.60.100 |
| 端点 | opc.tcp://192.168.60.1:4840 |
| 通道 / 身份 | None / Anonymous，仅本地教学环境 |

客户端原计划用UaExpert，实际因下载与邮箱要求改用FreeOpcUa Client。PLC仍提供同一OPC UA接口，没有为更换客户端重做数据块。

## 三个变量｜访问与写入权限分别设置

![DB_OPCUA三个变量都可访问，只有rSetpoint可写](/images/posts/e7-opcua-data-access/07-tags.png)

![PLC软件Main OB1和DB_OPCUA DB1编译0错误0警告](/images/posts/e7-opcua-data-access/08-compile.png)

| 变量 | TIA类型 | 起始值 | OPC UA权限 |
| --- | --- | --- | --- |
| DB_OPCUA.rTemperature | Real | 25.0 | 只读 |
| DB_OPCUA.rSetpoint | Real | 30.0 | 可读写 |
| DB_OPCUA.xRunning | Bool | FALSE | 只读 |

这些都是人工教学数据，不代表真实温度测量或机器运行。DB保留优化访问，三个变量勾选“从HMI/OPC UA/Web API可访问”，仅设定值勾选“可写”。

我一度把右侧“设定值”列当成OPC UA写入权限，后来改正。最终软件编译显示Main OB1和DB_OPCUA DB1 **0错误、0警告**；编译无错本身不代表变量已对客户端开放写入。TIA监视表修改PLC实际值也不同于客户端写入，只读权限限制的是OPC UA路径。

## 排障记录｜Ping能通，服务器却没有启用

![未启用OPC UA服务器时：Ping成功，但TCP4840连接失败](/images/posts/e7-opcua-data-access/11-port-failed.png)

第一次连接时端点列表为空，客户端报TCP连接超时。我在CMD里直接运行PowerShell命令还遇到“不是内部或外部命令”，改用PowerShell调用后才得到端口结果。

```powershell
Test-NetConnection 192.168.60.1 -Port 4840
```

当时PingSucceeded为True，TcpTestSucceeded为False。后来发现工程里忘记激活OPC UA服务器，开启、保存并下载相应配置后，客户端可以发现端点。不能把Ping成功当成服务端口已经可用，也不应一开始就归咎于证书或用户名。

## 端点与节点｜从连接地址找到PLC变量

![启用服务器后发现opc.tcp端点，选择None和Anonymous](/images/posts/e7-opcua-data-access/12-endpoint.png)

![浏览PLC_1的DataBlocksGlobal与DB_OPCUA三个节点](/images/posts/e7-opcua-data-access/13-node-tree.png)

端点中 `opc.tcp` 是本次传输方式，192.168.60.1是地址，4840是配置端口。我选择None通道和Anonymous身份连接；浏览路径是：

```text
Root → Objects → PLC_1 → DataBlocksGlobal → DB_OPCUA
```

本次设定值的NodeId显示为：

```text
ns=3;s="DB_OPCUA"."rSetpoint"
```

`ns=3` 是当前服务器命名空间索引，`s=`后面是字符串标识符。它不是固定通用地址；换工程或服务器时应重新浏览核对，不需要用DB字节偏移代替。TIA的Real在客户端显示为OPC UA Float，Bool显示Boolean。

## 订阅操作｜逐个添加，不用持续手动刷新

![右键Subscribe to data change，逐个添加订阅](/images/posts/e7-opcua-data-access/14-subscribe-menu.png)

![初次订阅收到设定值30.0、温度25.0、运行状态False与时间戳](/images/posts/e7-opcua-data-access/15-initial-subscriptions.png)

当前客户端的节点树没有按预想完成多选，我改为逐个右键 **Subscribe to data change**，在Subscriptions页收到三个初始值与时间戳，再通过实际值变化验证订阅。

读取是取得某一时刻的数据；变化订阅是在建立监视后接收相关变化通知。数值不变时不一定有新的数据通知，因此不能仅凭时间戳不跳动断定连接已断。

截图时间戳带有 `+00:00`，表示UTC，与本地北京时间的显示方式不同。时间戳、数据值与质量状态要分开理解；本次界面展示了值和时间戳，没有完成连续质量状态监控，也没有把日志里的警告直接当成会话已断开。

## 目前完成到哪里

| 内容 | 当前证据 |
| --- | --- |
| OPC UA连接、节点浏览、读取 | 已验证 |
| 温度与运行状态变化订阅 | 已验证 |
| 客户端写入设定值 | 已验证30.0→35.0 |
| 只读温度拒绝写入 | 已验证BadNotWritable，PLC值未变 |
| 手动断开、重连与重新订阅 | 已验证重连读取29.0，手动重新订阅 |
| 签名加密、证书互信、账号角色 | 尚未验证 |
| 异常断网自动重连与自动恢复订阅 | 尚未验证 |
| 质量状态与陈旧数据自动标记 | 尚未完成 |
| 实体PLC及现场应用 | 尚未验证 |

E7的**基础读写、订阅与权限部分**已有软件通信结果。后续若用于现场，需要按实际CPU与授权核对安全、变量权限、更新周期和断线处理；当前测试不等于完整SCADA或MES实现。

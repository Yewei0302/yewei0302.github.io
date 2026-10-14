---
author: 叶工
category: PLC练习项目
description: PLC分别作为Modbus TCP服务器和客户端完成读写，再用Wireshark抓包验证，并通过502改503再恢复的实验练习分层诊断。
draft: false
lang: zh-CN
published: 2026-10-05
tags: [PLC, Modbus TCP, MB_SERVER, MB_CLIENT, Wireshark, 通信]
title: E2–E4 Modbus TCP合集：读写验证、抓包与错误端口实验
---

这次我把 E2、E3、E4 连着做了一遍：先让 PLC 当服务器，再让 PLC 当客户端，最后抓包检查通信实际发生了什么。相比只看“连接成功”，我现在能把寄存器数值、程序监控和请求响应对照起来，也做了一次错误端口的故障恢复实验。

## 先看我完成的结果

|阶段|我完成的验证|
|---|---|
|E2|PLC使用MB_SERVER，QModMaster读取保持寄存器，并写入后对照PLC监控值|
|E3|PLC使用MB_CLIENT，OpenModSim作为服务器，FC03读取15/240/3840，FC16写入111/222/333|
|E4|Wireshark抓到FC03和FC16请求响应，将RemotePort从502改成503抓到RST/ACK，恢复502后读取正常|

![E3读取结果：15、240、3840](/images/posts/e2-e4-modbus-tcp/12.png)

![E3写入后服务器中的111、222、333](/images/posts/e2-e4-modbus-tcp/14.png)

![恢复502后正常返回15、240、3840](/images/posts/e2-e4-modbus-tcp/28.png)

## E2：先让PLC当服务器

我先整理 PLC 通信设置、服务器地址和数据区，再调用 `MB_SERVER`。QModMaster 是客户端，PLC 提供保持寄存器数据。

数据区用 Word 类型保存。最初读取的三个值是240、300、75，QModMaster 的 FC03 返回值与 PLC 数据对应。

![QModMaster读取保持寄存器](/images/posts/e2-e4-modbus-tcp/05.png)

写入时我使用 FC16，QModMaster 写入1、2、3后，PLC 监控表中的三个值也变成1、2、3。这让我确认了客户端写入确实到达了 PLC 数据区。

![FC16写入操作](/images/posts/e2-e4-modbus-tcp/07.png)

![PLC监控表中的写入结果](/images/posts/e2-e4-modbus-tcp/08.png)

这一阶段我开始分清：客户端发起操作，服务器提供数据；它们不是固定由电脑或PLC充当。

## E3：交换角色，让PLC主动读写

第二阶段我用 `MB_CLIENT`，让 PLC 主动连接 OpenModSim。连接配置里的服务器地址是192.168.0.100，端口为502，读写缓冲区使用 Word 数组。

![客户端数据区与连接配置](/images/posts/e2-e4-modbus-tcp/10.png)

这里真正踩到的配置点是 Unit ID。当前环境实测需要设为255，通信才正常；我把这个值保留在服务器配置和后面的抓包核对中，没有把它当成所有 Modbus 设备都必须使用的站号。

![OpenModSim的Unit ID与读取数据](/images/posts/e2-e4-modbus-tcp/11.png)

FC03读取时，服务器中的15、240、3840进入PLC接收区；FC16写入时，PLC发送区的111、222、333出现在服务器保持寄存器中。

![PLC写入缓冲区](/images/posts/e2-e4-modbus-tcp/13.png)

这次我不只检查连接状态，也逐项核对数值。读写方向交换之后，仍然用“谁发请求、谁提供数据”去理解流程。

## E4：把数值和实际报文对起来

安装 Wireshark 后，我抓取这条通信，先看 TCP 连接，再看 Modbus 请求与响应。正常配置使用TCP端口502，抓包中的 Unit Identifier 是255。

![FC03请求](/images/posts/e2-e4-modbus-tcp/23.png)

![FC03响应](/images/posts/e2-e4-modbus-tcp/24.png)

我重点核对的是这些字段：

|字段|这次我怎样检查|
|---|---|
|FC03|Read Holding Registers，读取保持寄存器|
|FC16|Write Multiple Registers，一次写多个寄存器|
|Reference Number|起始偏移；这里40001对应报文偏移0|
|Word Count|操作寄存器个数，这次是3|
|Byte Count|数据字节数，3个16位寄存器对应6字节|
|Transaction ID|将同一次请求与响应配对，不把不同操作混在一起|
|Request / Response|检查是否有回复、字段是否对应、读回或写入的数据是否正确|

![FC16请求中的111、222、333](/images/posts/e2-e4-modbus-tcp/16.png)

FC16请求携带写入数据，所以能看到 Word Count 3、Byte Count 6 和三个值；写响应确认起始地址和数量，不会把三个值原样再返回一遍。FC03则是在响应里返回读取数据。

我还做了另一组写入1、2、3的抓包，保留下来对照不同事务，避免只记住一张“成功”的图。

## 把502改成503：先判断问题卡在哪一层

我将客户端 `RemotePort` 改成503。这个目标端口没有对应的服务监听，连接无法正常建立。

![RemotePort改为503](/images/posts/e2-e4-modbus-tcp/25.png)

![TCP复位报文：RST与ACK](/images/posts/e2-e4-modbus-tcp/26.png)

Wireshark 中能看到 `Flags: 0x014 (RST, ACK)`，Reset和Acknowledgment置位。这次失败停在TCP连接阶段，还没有进入Modbus寄存器读写。

随后我将端口恢复为502，重新检查FC03请求响应。请求与响应的 Transaction ID 都是1724，响应返回15、240、3840，Byte Count为6，响应时间约2.976 ms。

![恢复502后的FC03请求](/images/posts/e2-e4-modbus-tcp/27.png)

这次实验形成了一个完整过程：502正常 → 改503连接失败 → 抓到RST/ACK → 恢复502 → FC03正常返回。

## 这次积累的能力

我已经能在仿真环境中配置PLC作为Modbus TCP服务器或客户端，做基础保持寄存器读写，并用抓包核对请求、响应和实际数值。

遇到不通时，我开始先判断TCP连接是否建立。连接都没有建立，就先检查IP、端口和监听服务；已经有Modbus请求响应，再检查Unit ID、功能码、地址和长度。这还只是基础通信练习，但比只盯着PLC程序中的状态位更有依据。

## 完整实验素材

下面按E2、E3、E4保留本次全部素材，方便回看配置与不同测试结果。

<details><summary>E2服务器设置与QModMaster读写</summary>


![实验记录 01](/images/posts/e2-e4-modbus-tcp/01.png)


![实验记录 02](/images/posts/e2-e4-modbus-tcp/02.png)


![实验记录 03](/images/posts/e2-e4-modbus-tcp/03.png)


![实验记录 04](/images/posts/e2-e4-modbus-tcp/04.png)


![实验记录 05](/images/posts/e2-e4-modbus-tcp/05.png)


![实验记录 06](/images/posts/e2-e4-modbus-tcp/06.png)


![实验记录 07](/images/posts/e2-e4-modbus-tcp/07.png)


![实验记录 08](/images/posts/e2-e4-modbus-tcp/08.png)


</details>


<details><summary>E3客户端设置与OpenModSim读写</summary>


![实验记录 09](/images/posts/e2-e4-modbus-tcp/09.png)


![实验记录 10](/images/posts/e2-e4-modbus-tcp/10.png)


![实验记录 11](/images/posts/e2-e4-modbus-tcp/11.png)


![实验记录 12](/images/posts/e2-e4-modbus-tcp/12.png)


![实验记录 13](/images/posts/e2-e4-modbus-tcp/13.png)


![实验记录 14](/images/posts/e2-e4-modbus-tcp/14.png)


</details>


<details><summary>E4安装、读写抓包与故障恢复</summary>


![实验记录 15](/images/posts/e2-e4-modbus-tcp/15.png)


![实验记录 16](/images/posts/e2-e4-modbus-tcp/16.png)


![实验记录 17](/images/posts/e2-e4-modbus-tcp/17.png)


![实验记录 18](/images/posts/e2-e4-modbus-tcp/18.png)


![实验记录 19](/images/posts/e2-e4-modbus-tcp/19.png)


![实验记录 20](/images/posts/e2-e4-modbus-tcp/20.png)


![实验记录 21](/images/posts/e2-e4-modbus-tcp/21.png)


![实验记录 22](/images/posts/e2-e4-modbus-tcp/22.png)


![实验记录 23](/images/posts/e2-e4-modbus-tcp/23.png)


![实验记录 24](/images/posts/e2-e4-modbus-tcp/24.png)


![实验记录 25](/images/posts/e2-e4-modbus-tcp/25.png)


![实验记录 26](/images/posts/e2-e4-modbus-tcp/26.png)


![实验记录 27](/images/posts/e2-e4-modbus-tcp/27.png)


![实验记录 28](/images/posts/e2-e4-modbus-tcp/28.png)


</details>

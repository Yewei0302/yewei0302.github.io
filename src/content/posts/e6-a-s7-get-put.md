---
author: 叶工
category: PLC练习项目
description: 我在双 S7-1500 仿真中完成 GET 读取 1234、2222 和 PUT 写入 5678，记录连接 ID 与发送 DB 地址的两次排障。
draft: false
lang: zh-CN
published: 2026-10-11
tags: [PLC, S7-1500, GET, PUT, PLCSIM Advanced, 通信]
title: E6-A｜双 S7-1500 PLC 的 GET/PUT 通信仿真
---

我在两台 S7-1500 虚拟 PLC 之间完成了 GET/PUT 通信：GET 先后读到 1234、2222，PUT 将 PLC1 的 5678 写到了 PLC2。这次把环境上线继续推进到了实际数据交换。

## 先看成果：GET 读取 1234、2222

![GET 将 1234 读入 PLC1 的 DB1 接收变量](/images/posts/e6-a-s7-get-put/get-1234.png)

我先读到 **1234**，然后将 PLC2 的发送值改为 **2222**，PLC1 的接收值也更新为 **2222**。

![PLC2 DB1 发送值与 PLC1 GET 接收值均为 2222](/images/posts/e6-a-s7-get-put/get-2222.png)

## PUT 成果：PLC2 收到 5678

![PLC1 DB3 发送值 5678，PLC2 DB2 接收值 5678](/images/posts/e6-a-s7-get-put/put-5678-watch.png)

PLC1 的 `DB_PutData.iPutValue` 位于 `%DB3.DBW0`，PLC2 的 `DB_PutRecv.iPutRecv` 位于 `%DB2.DBW0`，两端都是 **5678**。这张图记录的是 PUT 成果；当时 PLC1 的 GET 接收值为 0。

## PUT 最终参数

![PLC1 PUT 最终使用连接 ID 16#100、远端 DB2 和本地 DB3](/images/posts/e6-a-s7-get-put/put-db3-program.png)

|参数|本次成功配置|
|---|---|
|ID|`W#16#100`|
|ADDR_1：PLC2 接收地址|`P#DB2.DBX0.0 INT 1`|
|SD_1：PLC1 发送地址|`P#DB3.DBX0.0 INT 1`|

在线图中 `ERROR = FALSE`、`STATUS = 16#0000`。我以 PLC2 实际收到 5678 验证这次写入。

## 两次排障，我记住了什么

![S7 连接属性明确显示本地 ID 为 W#16#100](/images/posts/e6-a-s7-get-put/connection-id.png)

**连接 ID：这条连接要用 `W#16#100`。** 我这次修正了指令的连接 ID，后续核对以工程中这条 S7 连接的 ID 为准。

**本地发送地址：数据实际在 DB3，我之前误填了 DB2。** PLC1 的发送数据放在 `P#DB3.DBX0.0 INT 1`，所以 `SD_1` 必须指向 DB3；`ADDR_1` 仍指向 PLC2 的 DB2。两台 PLC 的 DB 编号不必相同，关键是分清本地数据源和远端目标。

## 从双 PLC 环境搭建开始

![TIA V19 通过虚拟网卡搜索到仿真 PLC](/images/posts/e6-a-s7-get-put/screenshot_tia_download.png)

![PLCSIM Advanced V6.0 中两个 PLC 实例同时上线](/images/posts/e6-a-s7-get-put/screenshot_plcsim_instances.png)

我沿用 TIA Portal V19 与 PLCSIM Advanced V6.0 的仿真环境：PLC1 为 `192.168.60.10`，PLC2 为 `192.168.60.20`，虚拟网卡为 `192.168.60.100/24`，Online Access 使用 TCP/IP Single Adapter 的 `<Local>`。

[此前的环境搭建记录](/posts/e6-dual-plc-simulation/) · [简版 HTML](/records/e6-dual-plc.html)

后续我已完成 E6-B Modbus TCP 读取：[查看 E6-B 读取实测](/posts/e6-dual-plc-communication/)。Modbus 写入与断线恢复尚未验证。

---
author: 叶工
category: PLC练习项目
description: 我通过 MB_CLIENT 从双 PLC 的 Modbus TCP 服务端读取 3 个保持寄存器，接收值为 111、222、333，记录连接配置与在线验证。
draft: false
lang: zh-CN
published: 2026-10-11
tags: [PLC, S7-1500, Modbus TCP, MB_CLIENT, 通信]
title: E6-B｜双 PLC 的 Modbus TCP 读取实测
---

我在两台 S7-1500 虚拟 PLC 之间完成了 Modbus TCP 保持寄存器读取，PLC1 的接收数组读到 **111、222、333**。这篇记录我的读取配置与在线验证画面。

## 先看成果：读到 111 / 222 / 333

![Modbus 读取成功：DONE TRUE、ERROR FALSE、STATUS 16#0000，数据 16#006F / 16#00DE / 16#014D](/images/posts/e6-dual-plc-communication/mb-read-success.png)

我触发读取后，**DONE = TRUE、BUSY = FALSE、ERROR = FALSE、STATUS = 16#0000**。三个保持寄存器进入 PLC1 的接收数组：**16#006F = 111、16#00DE = 222、16#014D = 333**。

## 我的 Modbus 读取配置

![MB_CLIENT：MB_MODE 0，地址 40001，长度 3，接收指针 P#DB1.DBX0.0](/images/posts/e6-dual-plc-communication/mb-client-program.png)

我用 `MB_CLIENT` 从 **40001** 开始读取 **3** 个保持寄存器，`MB_MODE = 0`，数据写入 `DB_MB_Read.awReadRegs`。

![连接结构：192.168.60.20:502，ID W#16#2，主动建立 TRUE](/images/posts/e6-dual-plc-communication/mb-connection.png)

目标为 **192.168.60.20:502**，连接 ID 为 `W#16#2`，`ActiveEstablished = TRUE`。我按这套连接参数完成了本次读取。

![接收数组为三个 Word，位于 DB1 的偏移 0、2、4](/images/posts/e6-dual-plc-communication/mb-read-db.png)

![触发前监控画面：接收值为 0，STATUS 16#7004](/images/posts/e6-dual-plc-communication/mb-before-trigger.png)

我保留触发前的画面作对照；这张还没有读到数据，成功结果以开头的 111 / 222 / 333 为准。

<details><summary>最初放入 MB_CLIENT 时的画面</summary>

![初始 MB_CLIENT 块，参数尚未连接完整](/images/posts/e6-dual-plc-communication/mb-initial-block.png)

这是尚未接好参数的准备画面。

</details>

## 本次完成范围

我使用 TIA Portal V19 与 PLCSIM Advanced V6.0，在双 PLC 仿真环境中验证了 **Modbus TCP 保持寄存器读取**。**Modbus 写入与断线恢复尚未验证**，留待后续实测。

[下载独立离线 HTML（图片已内嵌）](/records/e6-dual-plc-communication.html)

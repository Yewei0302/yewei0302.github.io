---
author: 叶工
category: PLC练习项目
description: S7-1500虚拟PLC通过TCP/RTU网关完成FC03读取、FC06单写和FC16多写，结合从站数据与网关日志验证通信。
draft: false
lang: zh-CN
published: 2026-10-10
tags: [PLC, Modbus RTU, Modbus TCP, MB_CLIENT, 网关, 通信]
title: E5｜Modbus RTU 与 TCP/RTU 网关通信实测
---

这次使用 S7-1500 虚拟 PLC，通过 Modbus TCP/RTU 网关与 RTU 从站通信。我分别完成了保持寄存器读取、单寄存器写入和多寄存器写入，并记录了实际收发数据。

## 先看我完成的结果

![PLC通过TCP RTU网关读取OpenModSim数据的实际录屏动图](/images/posts/e5-modbus-rtu-gateway/02-read-demo.gif)

读取过程实录：在 RTU 从站与 PLC 监控数据之间验证读取结果。

![PLC通过TCP RTU网关写入OpenModSim寄存器的实际录屏动图](/images/posts/e5-modbus-rtu-gateway/04-write-demo.gif)

写入过程实录：修改 PLC 发送数据后，观察 OpenModSim 寄存器更新。

## 通信环境

S7-1500 · PLCSIM Advanced · ModbusGateway · OpenModSim · com0com

|通信节点|本次配置|
|---|---|
|S7-1500 虚拟 PLC|192.168.0.1|
|ModbusGateway|192.168.0.100:1502 · COM3|
|OpenModSim|COM4 · RTU 站号 1|

我使用 com0com 建立 COM3 与 COM4 虚拟串口对。PLC 通过 TCP 访问网关，网关再把请求转发给 RTU 从站。

## PLC 读取 RTU 数据（FC03）

![TIA Portal MB_CLIENT FC03读取LAD程序](/images/posts/e5-modbus-rtu-gateway/01-read-program.png)

MB_CLIENT 读取程序：从保持寄存器 40001 开始，一次读取 3 个数据到 awReadRegs。

## PLC 写入 RTU 数据（FC06 / FC16）

单寄存器写入测试中，我将第二个保持寄存器写为 400；随后又使用 FC16 一次写入 3 个保持寄存器。

![TIA Portal MB_CLIENT FC16写入LAD程序](/images/posts/e5-modbus-rtu-gateway/03-write-program.png)

MB_CLIENT 多寄存器写入程序：MB_MODE 为 1，起始地址 40001，写入长度 3，数据来自 awWriteRegs。

## TCP / RTU 通信日志

![ModbusGateway TCP与RTU双侧通信日志](/images/posts/e5-modbus-rtu-gateway/05-gateway-log.png)

网关日志同时显示 TCP 与 RTU 报文。多寄存器写入使用 FC16（0x10），请求与响应均有记录。

## 项目记录

这次调试中，PLC 的 TCP 连接 ID 与 Modbus Unit ID 不是一回事。网关后面的 RTU 从站使用站号 1，我最终将 MB_CLIENT 实例 DB 中的 MB_Unit_ID 配置为 16#01，完成了网关转发。

这次通信项目也让我明确了一个习惯：不要急着动手，先收集并核对 IP 地址、TCP 端口、Modbus Unit ID（RTU 站号）、串口号及串口参数，确认通信双方的配置一致后再开始联调。

本文记录本次纯软件仿真环境中的实际测试。

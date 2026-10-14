---
author: 叶工
category: PLC练习项目
description: 我完成了双 S7-1500 虚拟 PLC 上线和 TIA V19 下载，后续已完成 GET/PUT 与 Modbus TCP 读取验证。
draft: false
lang: zh-CN
published: 2026-10-11
tags: [PLC, S7-1500, PLCSIM Advanced, 仿真]
title: E6｜双 S7-1500 PLC 仿真环境搭建成功
---

我已在 PLCSIM Advanced V6.0 中让两台 S7-1500 虚拟 PLC 同时上线，并使用 TIA Portal V19 完成下载。

## 成果截图

![TIA 通过虚拟网卡搜到 192.168.60.10 的仿真 PLC](/images/posts/e6-dual-plc-simulation/screenshot_tia_download.png)

![PLCSIM Advanced V6.0 在 Local 模式下显示两个在线实例](/images/posts/e6-dual-plc-simulation/screenshot_plcsim_instances.png)

## 本次网络配置

|项目|本次配置|
|---|---|
|PLC1_Client|192.168.60.10|
|PLC2_Server|192.168.60.20|
|Siemens PLCSIM Virtual Ethernet Adapter|192.168.60.100/24|
|PLCSIM Online Access|TCP/IP Single Adapter → `<Local>`|
|TIA PG/PC 接口|Siemens PLCSIM Virtual Ethernet Adapter|

这次我将虚拟网卡与两台 PLC 的地址对齐到同一网段，完成了环境搭建。

后续我已完成 E6-B Modbus TCP 读取：[查看 E6-B 读取实测](/posts/e6-dual-plc-communication/)。Modbus 写入与断线恢复尚未验证。

[打开简版 HTML 成果记录](/records/e6-dual-plc.html)

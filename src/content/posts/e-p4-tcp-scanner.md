---
author: 叶工
category: PLC练习项目
description: 我用网络助手模拟 TCP 扫码设备，完成 LF 报文拼接、多报文拆分、超长保护、断线恢复、逐条 OK 应答与发送故障人工补发。
draft: false
lang: zh-CN
published: 2026-10-18
tags: [PLC, S7-1500, TCP, TRCV_C, TSEND, LAD, 通信]
title: E-P4｜TCP 模拟扫码：报文拼接、自动应答与故障恢复
---

我用 NetAssist 模拟 TCP 扫码设备，让 S7-1500 接收文本、按 LF 拼成完整报文，再逐条回复 OK。除了收发，我还测试了半条报文跨接收拼接、多条报文拆分、超长丢弃、断线清理，以及发送失败后的人工补发。

## 先看成果：两条报文，两次 OK

![一次收到 18 字节，识别两条报文并自动回复 OKOK](/images/posts/e-p4-tcp-scanner/01-two-frames-okok.png)

我一次发送两条带 LF 的报文：`CODE:456` 和 `CODE:789`。PLC 本次接收 18 字节，完整报文数与回复成功数都从 1 增到 3，待回复数归零；NetAssist 实际收到 4 字节的 **OKOK**。

## 我约定的报文格式

| 项目 | 本次配置 |
| --- | --- |
| 工程 | E_P4_TCP_Scanner，LAD |
| 软件 | TIA Portal V19、PLCSIM Advanced V6.0、NetAssist 5.15 |
| PLC 客户端 | 192.168.60.10，CPU 1511-1 PN |
| NetAssist 服务端 | 192.168.60.100:8080，与 TIA、PLCSIM 在同一虚拟机 |
| 连接 | TCP 主动连接，InterfaceId 64，连接 ID 1，本地端口 0 |
| 文本示例 | CODE:123456 |
| 报文结束符 | LF，单字节 16#0A；不计入报文长度 |
| 最大报文内容 | 256 字节 |
| 回复 | OK，两个字节 16#4F、16#4B |

我最初把 NetAssist 绑定到另一张网卡的 `192.168.60.128`，没有连上。改为本机虚拟网络地址 `192.168.60.100`，并同步修改 PLC 的目标地址后，客户端上线。PLCSIM 保持 TCP/IP Single Adapter 的 `<Local>`。

## 三次接收，拼成一条条码文本

![先收到 CODE:，拼接长度 5，完整报文数为 0](/images/posts/e-p4-tcp-scanner/02-fragment-code.png)

![再收到 123456，拼接长度增至 11，仍未结束](/images/posts/e-p4-tcp-scanner/03-fragment-digits.png)

![收到 LF 后保存 CODE:123456，长度 11，拼接长度清零](/images/posts/e-p4-tcp-scanner/04-lf-frame.png)

我先发 `CODE:`，再发 `123456`，最后单独发 LF。拼接长度依次是 **5 → 11 → 0**，直到 LF 到来才保存一条长度 11 的完整报文。三次接收只形成一条业务报文，接收次数与完整报文数分开统计。

## 一次接收，也能拆出两条报文

![一次接收中拆出两条报文，最近一条为 CODE:456](/images/posts/e-p4-tcp-scanner/05-two-frames.png)

我把 `CODE:123 + LF` 和 `CODE:456 + LF` 合在一次发送中。PLC 在同一次接收里识别到两个结束符，完整报文数增加 2，最近报文保存为 **CODE:456**，长度 **8**。

`abLastFrame` 只保存最近一条完整报文，只有前 `uiLastFrameLen` 个字节有效；后面残留的旧字节不属于当前报文。

## 断线时丢弃半条，重连后重新开始

![断线前已有 CODE: 半条报文，拼接长度为 5](/images/posts/e-p4-tcp-scanner/06-half-frame.png)

![关闭服务器后接收报错，半条报文长度清零](/images/posts/e-p4-tcp-scanner/07-disconnect-clear.png)

![服务器重新打开后 PLC 自动连接，拼接长度保持 0](/images/posts/e-p4-tcp-scanner/08-reconnected.png)

![重连后收到 CODE:789，未拼入旧连接残留](/images/posts/e-p4-tcp-scanner/09-after-reconnect.png)

我发送 `CODE:` 后关闭 NetAssist 服务器，PLC 检出接收错误时将拼接长度从 **5 清为 0**。重新打开服务器后，PLC 自动重连；再发送 **CODE:789 + LF**，保存长度为 8，没有混入旧连接的半条文本。

这次验证的是主动关闭服务所触发的异常与恢复；我还没有把静默链路故障、应用心跳和超时检测都纳入测试。

## 256 字节边界与超长丢弃

![四次各 64 字节，拼接长度达到 256，尚未超长](/images/posts/e-p4-tcp-scanner/10-capacity-256.png)

![第 257 个普通字节触发超长，长度停留 256](/images/posts/e-p4-tcp-scanner/11-overflow.png)

![真正的 HEX 0A 清除超长状态，不计入完整报文](/images/posts/e-p4-tcp-scanner/12-overflow-lf.png)

![超长丢弃后正常接收 CODE:999](/images/posts/e-p4-tcp-scanner/13-overflow-recovery.png)

我连续发四段各 64 字节的内容，**正好 256 字节仍允许**；再发一个普通字节 `X`，超长标志置位，长度停在 256。之后一直丢弃到 LF，清零拼接长度并解除超长状态，完整报文数不增加。再发 **CODE:999 + LF**，能够正常保存。

## 我踩过的坑：文字 0A 不等于换行字节

![误用 ASCII 发送文字 0A，日志为 ASCII/2，未触发 LF](/images/posts/e-p4-tcp-scanner/17-ascii-mistake.png)

我一度把 `0A` 和一整串十六进制数用 ASCII 模式发出去。日志里的 **ASCII/2**、**ASCII/26** 提醒了我：发出去的是文字，PLC 没有收到真正的 LF。改用发送区的 **HEX** 模式后，`0A` 对应 **HEX/1**，超长状态才按设计解除。

## 每条完整报文登记一次回复任务

![LAD 保存完整报文并登记待回复任务](/images/posts/e-p4-tcp-scanner/19-frame-save-program.png)

我没有直接用一次接收完成脉冲触发一次回复，而是在识别完整报文时增加 `udiAckPending`。发送端逐个取任务，成功后待回复数减 1、回复成功数加 1。这样一次收到两条报文，也能依次发送两次 OK。

## 发送失败先暂停，人工复位后补发

![发送连接 ID 不匹配，待回复 1，故障码锁存为 16#80A1](/images/posts/e-p4-tcp-scanner/14-send-fault.png)

![恢复连接 ID 后，待回复任务和故障标志仍保留](/images/posts/e-p4-tcp-scanner/15-before-reset.png)

![人工复位后未发送新报文，原任务补发 OK，历史故障码保留](/images/posts/e-p4-tcp-scanner/16-manual-retry.png)

我临时把 **TSEND 的 ID 单独改为 2**，实际接收连接仍用 ID 1，制造一次发送失败。待回复数保留为 1，成功数为 0，故障标志置位，并锁存本次故障码 **16#80A1**。

恢复 `TSEND.ID` 对连接参数 ID 的正常引用后，我只下载修改的 OB1，保留待回复任务。人工复位前不会继续发；复位后没有再发送新报文，NetAssist 收到了补发的 **OK**，待回复数归零，成功数变为 1，历史故障码仍保留。

<details><summary>展开查看接收与故障处理 LAD</summary>

![TRCV_C 接收指令：EN_R、CONT、ADHOC 为 TRUE，LEN 为 0](/images/posts/e-p4-tcp-scanner/18-trcv-program.png)

![人工复位条件：无正在执行回复、无发送忙、无接收错误](/images/posts/e-p4-tcp-scanner/20-reset-program.png)

![发送失败时置位暂停标志，并保存发送状态码](/images/posts/e-p4-tcp-scanner/21-fault-program.png)


我用 `TRCV_C` 建立连接并接收，`EN_R / CONT / ADHOC = TRUE`、`LEN = 0`。`TSEND` 复用同一个连接 ID，发送两字节数组 OK。故障后暂停发送，人工复位时检查没有正在执行回复、没有发送忙和接收错误。

</details>

## 我这次完成到哪里

我完成了网络助手与虚拟 PLC 的 TCP 双向收发、LF 组帧、分段拼接、多报文拆分、256 字节边界与超长恢复、关闭服务器后的半条清理与重连，以及逐条自动应答和发送故障人工补发。

**本项目是网络助手模拟扫码设备的软件仿真。** 当前 OK 仅表示收到非空且未超长的 LF 完整报文；我还没有校验 CODE: 前缀或条码内容，也没有验证实体扫码枪。补发没有加入消息编号和去重机制，不把它当作业务恰好执行一次的保证。

[下载独立离线 HTML（真实截图已内嵌）](/records/e-p4-tcp-scanner.html)

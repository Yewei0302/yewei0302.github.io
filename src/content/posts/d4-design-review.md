---
title: D4｜电气设计标准查证与自检记录
published: 2026-10-29
author: 叶工
category: 电气设计
lang: zh-CN
tags: [电气设计, EPLAN, 设计自检, 保护配合]
description: 复核7.5kW正反转电机回路，整理保护配合、电缆、PE与待验证条件，区分软件检查和工程验收。
draft: true
---

<style>
.d4-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:20px 0}.d4-grid figure{margin:0;padding:12px;border:1px solid #91a3b344;border-radius:14px;background:#8199aa0b}.d4-grid img{width:100%;height:auto;display:block}.d4-grid figcaption{font-size:.85em;line-height:1.65;margin-top:10px;opacity:.8}.d4-note{padding:18px;border-left:4px solid #dca64b;background:#dca64b12;border-radius:8px}@media(max-width:640px){.d4-grid{grid-template-columns:1fr}}
</style>

我把这次自检整理成一份可以继续补证据的记录：图纸上已经表达的内容，和需要产品资料、现场条件才能确认的内容，分别记清楚。对象是7.5kW、380V正反转电机，电流暂按15.8A。

<div class="d4-note">本阶段完成主要设计自检并列出验证缺口，尚不能认定整套回路通过工程验收。以下实际截图复用我的C4、D2、D3项目记录，保留阶段标识；不作为D4新增配置的截图证明。</div>

## 先看成果：从BOM走向审核记录

<div class="d4-grid">
<figure><a href="/images/posts/d4-design-review/d3-bom-reports-01-bom-final.png"><img src="/images/posts/d4-design-review/d3-bom-reports-01-bom-final.png" alt="D3阶段实际BOM汇总表" loading="lazy"/></a><figcaption>原有BOM是复核起点。D4记录LAD9V2已入BOM，仍待补充更新后的截图与兼容性资料。</figcaption></figure>
<figure><a href="/images/posts/d4-design-review/d3-bom-reports-02-check-clear.png"><img src="/images/posts/d4-design-review/d3-bom-reports-02-check-clear.png" alt="D3阶段EPLAN消息管理为空" loading="lazy"/></a><figcaption>软件检查无错误，只说明当前检查配置下没有消息，不能代替安全验证。</figcaption></figure>
</div>

## 保护与互锁：选了部件，还要验证配合

QF1采用A9F75320，3P、20A、D型，Icn为6kA（400V、IEC 60898-1条件）。我还没有取得安装点预期短路电流和QF1通过能量，不能只凭“6kA”判断保护已经满足。

FR1为LRD21，12～18A、Class 10A，暂整定16A；下一步核对电机铭牌电流、启动时间与负载。KM1/KM2采用LC1D18BD、24VDC，辅助常闭触点形成电气互锁。LAD9V2机械互锁已列入BOM，实际安装兼容性待核实。

<div class="d4-grid">
<figure><img src="/images/posts/d4-design-review/d3-bom-reports-07-breaker-template.png" alt="实际QF1部件功能模板" loading="lazy"/><figcaption>QF1：部件关联与功能模板记录，不等于短路保护配合证明。</figcaption></figure>
<figure><img src="/images/posts/d4-design-review/d3-bom-reports-08-overload-template.png" alt="实际热继电器功能模板" loading="lazy"/><figcaption>FR1：先核对型号与整定范围，再对照铭牌和启动特性。</figcaption></figure>
</div>

<div class="d4-grid">
<figure><img src="/images/posts/d4-design-review/c4-motor-reversing-01-main-circuit.png" alt="C4实际正反转主回路" loading="lazy"/><figcaption>历史主回路：用于回看正反转动力路径，参数以本次审核表为准。</figcaption></figure>
<figure><img src="/images/posts/d4-design-review/c4-motor-reversing-02-control-circuit.png" alt="C4实际正反转控制回路" loading="lazy"/><figcaption>历史控制图：核对辅助常闭触点互锁；机械互锁需另外核实。</figcaption></figure>
</div>

SB1常闭触点用于普通停止。它不能代替电源隔离措施；涉及人员进入危险区域时，还需要另行评估安全功能。

## W1与PE：图纸连接明确，现场条件仍有缺口

W1为YJV 4×4mm²，长度20m。XT2:1～3接M1的U1/V1/W1，XT2:4接M1:PE，PE采用黄绿芯线。我检查的是图纸目标，完整柜内PE路径和现场连续性尚未验证。

<div class="d4-grid">
<figure><img src="/images/posts/d4-design-review/d2-cable-design-01-w1-chart.png" alt="D2实际W1电缆图表" loading="lazy"/><figcaption>电缆报表：对照W1起点、终点与四芯分配。</figcaption></figure>
<figure><img src="/images/posts/d4-design-review/d2-cable-design-04-w1-cores.png" alt="D2实际W1芯线与PE分配" loading="lazy"/><figcaption>芯线记录：三根相线加一根PE；仍需现场验证保护导体连续性。</figcaption></figure>
</div>

| 计算项目 | 本轮记录 | 适用边界 |
|---|---|---|
| 载流量 | 42×0.79＝33.18A | 参考条件值；电缆沟通风、成组和环境条件待验证 |
| 运行电压降 | 约0.52% | 仅20℃简化值；需结合实际温度复核，也未代替启动压降校核 |
| 短路绝热热承受 | 327184 A²s | 采用k＝143、S＝4，(kS)²；铜XLPE规定温度条件、绝热假设及适用时间范围成立时才可采用 |
| 保护配合 | 尚不能确认 | 未取得故障电流、切断时间和QF1通过能量，不能只比较20A与33.18A |

RCD是否必须配置，要按实际接地系统、回路用途和适用规范确定。若按TN-S讨论，也必须验证PE可靠性和故障自动切断条件，不能由“有PE”直接推出“不需要RCD”。

## 短路电流怎么算：先确定故障位置与类型

我之前只记下“短路电流未取得”，没有留下计算路径。这次把方法补齐。电机工作电流15.8A用于负载分析，不能直接乘某个倍数作为供电系统短路电流。

### 三相短路：从电源到故障点累加阻抗

初步计算可写为 **Ik3＝c×Un÷(√3×|ZΣ|)**。Un是线电压，c是按采用计算方法确定的电压系数，ZΣ为每相等值阻抗，单位Ω。把上级电网、变压器、进线与W1等阻抗折算到同一电压侧，分别累加电阻与电抗：RΣ＝ΣR，XΣ＝ΣX，|ZΣ|＝√(RΣ²＋XΣ²)。不能把各段阻抗的模直接相加当作精确结果。

如果从变压器铭牌入手，可先用 **In＝Sn÷(√3×Un)**、**|ZT|≈(uk%÷100)×Un²÷Sn**。Sn使用VA，Un使用V。忽略上级阻抗时，变压器端短路电流可粗估为In×100÷uk%；这只是特定假设下的端部估算，不能直接用于20m电缆末端。

本项目缺变压器容量、短路阻抗、上级电网数据和进线参数，因此不填写一个虚构的Ik3结果。QF1安装处最大预期短路电流用于校核分断能力；末端最小故障电流用于校核可靠切断，两者要分别算。

### 相线碰壳：看完整故障回路

在TN系统中，初步关系为 **If≈c×U0÷|Zs|**。U0是相对地电压，380V系统约为219.4V；Zs包含电源、相线、PE及连接点形成的完整金属故障回路。TT系统不能套用同样的低阻抗PE返回路径。

仅演示W1本身：取20℃铜电阻率ρ＝0.0175Ω·mm²/m，单根4mm²、20m导体电阻R＝ρL/S＝0.0875Ω，相线与同截面PE往返约0.175Ω。若刻意忽略上级阻抗、电抗与接点，并取c＝1，可得到219.4÷0.175≈1.25kA。**这个数只是理想化算例，不是本项目测得或校核后的故障电流，尤其不能当作最小故障电流。** 实际还需采用导体电阻资料和最不利温度，加入完整电源回路阻抗。

铜导体电阻随温度上升，可用Rθ≈R20×[1＋0.00393×(θ−20)]作初步修正。做最小电流校核还要考虑最低电源电压及适用计算规则；不能用20℃电阻得出的较大电流证明一定及时跳闸。

## 算出电流后，怎样判断QF1与电缆

我按三个问题核对，避免把分断能力、动作电流和通过能量混为一谈：

| 问题 | 需要比较的内容 | 本项目状态 |
|---|---|---|
| 故障时能否安全分断 | QF1额定条件下分断能力与安装点最大预期短路电流 | 6kA是产品所述条件值，安装点电流未知 |
| 末端故障是否及时切断 | 最小故障电流与厂家时间—电流曲线，核对规定切断时间 | 等待完整回路数据及对应曲线 |
| 导体是否承受得住 | 保护装置总通过能量∫i²dt≤k²S² | 电缆限值已算，QF1能量资料未取得 |

“D型”说明瞬时动作特性类别，不代表任何故障都能瞬时切断。需查A9F75320对应版本的曲线，并按动作带的保守边界核对；还要检查启动电流与持续时间是否引起误动作。接触器和热继电器的短路配合则需厂家组合资料，不能由单个断路器参数代替。

当采用不变有效值电流的简化热计算时，t允许≈327184/I²。例如假设故障电流1000A，得到约0.327s；假设2000A，约0.0818s。它们只是导体热承受量的算术演示，**不是QF1实际跳闸时间**。限流断路器尤其应查厂家总通过能量，不能简单用预期短路电流平方乘一个猜测的时间。

## 其余计算也留下过程

- **电机电流**：三相输入关系P输出＝√3×U×I×η×cosφ。7.5kW为输出功率时，I＝7500÷(√3×380×η×cosφ)，必须知道效率与功率因数；本项目15.8A暂用，最终以铭牌为准。
- **载流量修正**：Iz＝表列载流量×各适用修正系数。42×0.79＝33.18A只对应原参考条件，42A的表格依据、敷设方式及0.79的适用原因都要补证据，不能重复计入同一修正。
- **运行压降**：三相平衡时ΔU≈√3×I×L×(r cosφ＋x sinφ)，L用单程长度；r、x若用Ω/km，20m应写0.020km。ΔU%＝100ΔU/U。现有0.52%保留为20℃简化记录，待补原取值和温度复算；启动压降另用启动工况核对。
- **过载保护**：核对负载电流、FR1整定、修正后载流量和实际动作特性。电机回路由短路保护与过载继电器分工，不能只用QF1的20A判断过载保护是否成立。
- **PE与RCD**：核对接地系统、故障切断条件及PE连续性。RCD不能代替PE，也不能凭电机功率决定是否必须安装。

### 本轮方法查证来源

本次补充依据厂家工程指南整理方法，正式项目仍应核对适用的现行标准、产品版本与现场条件。

- [施耐德 Electrical Installation Guide：短路电流](https://www.electrical-installation.org/enwiki/Short-circuit_current)
- [施耐德：最小短路电流校核](https://www.electrical-installation.org/enwiki/Calculation_of_minimum_levels_of_short-circuit_current)
- [施耐德：电缆短路热承受校核](https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions)
## 最终审核表

🟢表示完成对应范围内的检查，🟡表示仍缺验证条件；绿色不代表整套设备安全合格。

| 审核项 | 状态 | 记录与下一步 |
|---|---|---|
| 电气互锁、普通停止逻辑 | 🟢 图纸逻辑已检查 | 核对实物接线与动作 |
| LAD9V2机械互锁 | 🟡 已入BOM | 查厂家适配清单并核对安装 |
| FR1整定16A | 🟡 暂定 | 取得铭牌与启动数据 |
| QF1短路保护 | 🟡 已选型 | 取得预期短路电流、切断特性及配合资料 |
| W1载流量与电压降 | 🟡 参考计算已完成 | 核对敷设、散热、成组及温度 |
| W1短路热稳定 | 🟡 仅热承受量已算 | 取得对应故障条件下的通过能量 |
| 电机PE图纸目标 | 🟢 图纸连接已检查 | 完整保护回路及现场连续性仍待验证 |
| RCD适用性 | 🟡 条件不足 | 确认接地系统及适用规范 |
| EPLAN项目检查 | 🟢 当前检查无错误 | 不能代替工程安全验证 |

## 标准查证与待办

本记录沿用本轮学习数据，不把尚未核验的条文写成已查证结论。IEC 60898-1仅在此记录QF1所述分断能力条件，不能直接推导整个电机组合的保护配合结论。后续应把实际采用的现行标准版本、条款、适用范围以及厂家资料页补入记录。

我接下来优先补齐三组证据：

1. **供电与保护**：接地系统、预期短路电流、QF1时间电流曲线和通过能量，以及接触器/热继电器的厂家配合资料。
2. **电机与敷设**：铭牌、启动特性、电缆沟通风、成组和温度条件，复核16A整定及电缆计算。
3. **图纸与实物**：LAD9V2兼容性、更新BOM截图、完整PE回路与连续性测试；同步复核控制电源输入及保护是否完整。

当前没有充分依据把缺数据的项目判成“需要整改”，也不能把它们判成“通过”。取得证据后，若不满足要求，再落实具体整改并保留复核记录。


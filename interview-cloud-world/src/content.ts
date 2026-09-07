export interface Chapter { id: string; title: string; start: number; end: number; summary: string }
export const interview = {id:'digua-06',title:'一场机器人智能大爆发，与硬件创业黄金时代',guest:'王丛 · 地瓜机器人 CEO',series:'锦供参考 Vol.06',duration:4314.005,src:'/media/interview.mp4'};
export const chapters: Chapter[] = [
  {id:'start',title:'先行动，再调整',start:100,end:244,summary:'从创业经历出发，讨论在不确定中做选择，以及为什么时间是创业公司昂贵的成本。'},
  {id:'platform',title:'为什么选择平台？',start:244,end:540,summary:'从定制项目走向平台：理解能力、需求和商业模式，寻找适合自己的位置。'},
  {id:'industries',title:'机器人是无数个行业',start:766,end:1036,summary:'应用和生产关系各不相同，部分通用组件却可能收敛。这里呈现的是访谈中的判断。'},
  {id:'horizons',title:'今天、新机会、长期未来',start:1200,end:1444,summary:'地瓜内部的 1.0、2.0、3.0 业务分类：成熟业务、AI 新硬件与具身方向。这不是所有公司的统一成长阶段。'},
  {id:'software',title:'卖芯片，为什么做软件？',start:1784,end:2048,summary:'工具和软件生态如何帮助客户降低开发门槛、缩短开发周期，并走向量产。'},
  {id:'embodied',title:'具身会先在哪里落地？',start:2146,end:2390,summary:'把通用能力和特定场景分开讨论，结合任务、本体、产品匹配与投入回报判断落地条件。'},
  {id:'customers',title:'订单与未来的需求',start:3056,end:3344,summary:'大客户带来今天的订单，创新客户帮助发现未来需求；讨论碎片化需求如何影响产品取舍。'},
  {id:'organization',title:'保持创新的组织',start:3860,end:4310,summary:'讨论创新业务与既有利益、Founder Mode，以及选择同行者与建立信任。'}
];
export const insights = [
 {id:'branch',title:'一个机器人时代，无数种应用',body:'不同场景有不同任务和生产关系；部分底层组件和工具可以复用。此图是对本期访谈的编辑整理，并非行业共识。',chapter:2},
 {id:'horizons',title:'同时经营三个时间尺度',body:'成熟业务承接当下，AI 新硬件探索新机会，具身方向投入长期未来。这是地瓜内部业务分类，不是行业统一阶段。',chapter:3},
 {id:'ecosystem',title:'从工具，走向生态',body:'软件工具 → 开发效率 → 量产支持。这里表达访谈中的论述，不能视为已验证的因果实验结论。',chapter:4}
];
export const formatTime = (seconds:number) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;

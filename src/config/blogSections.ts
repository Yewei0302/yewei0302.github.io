export const blogSections = [
 {slug:'projects',name:'项目展示',symbol:'⚙',description:'已完成的实验、成果动图与实现记录',color:'blue'},
 {slug:'electrical-design',name:'电气设计',symbol:'⏚',description:'电路图、元件选型与 EPLAN 学习',color:'blue'},
 {slug:'plc',name:'PLC',symbol:'⌘',description:'编程基础、控制逻辑与通信实践',color:'blue'},
 {slug:'hmi',name:'上位机',symbol:'▤',description:'HMI、WinCC、报警、趋势与数据管理',color:'blue'},
 {slug:'vision-robotics',name:'视觉与机器人',symbol:'◎',description:'机器视觉、机器人与运动控制的学习记录',color:'blue'},
 {slug:'knowledge',name:'知识库',symbol:'✦',description:'学习随笔、资料研读与常用知识索引',color:'blue'},
];
export function matchesSection(post:{id:string;data:{category?:string;tags?:string[]}},slug:string){
 const category=post.data.category||'';
 const tags=post.data.tags||[];
 if(slug==='projects')return category==='PLC练习项目';
 if(slug==='electrical-design')return /EPLAN|电路|电气设计/.test(category);
 if(slug==='plc')return category.startsWith('PLC');
 if(slug==='hmi')return tags.some(tag=>/^(HMI|WinCC|SCADA|上位机)$/i.test(tag));
 if(slug==='vision-robotics')return /视觉|机器人/.test(category)||tags.some(tag=>/视觉|机器人/.test(tag));
 if(slug==='knowledge')return ['学习随笔','文章与期刊研读','技能与证书'].includes(category);
 return false;
}

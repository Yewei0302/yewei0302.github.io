import fs from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source='E:/电气项目展示/首页图片';
if(!fs.existsSync(source)){console.log('本机首页图片目录不存在，保留仓库中的图片与清单。');process.exit(0);}
const output=path.join(root,'public/images/home-picked');
fs.mkdirSync(output,{recursive:true});
const files=fs.existsSync(source)?fs.readdirSync(source,{withFileTypes:true}).filter(e=>e.isFile()&&/\.(png|jpe?g|webp|gif|avif)$/i.test(e.name)).map(e=>e.name).sort((a,b)=>a.localeCompare(b,'zh-CN')):[];
const pictures=await Promise.all(files.map(async name=>{const bytes=fs.readFileSync(path.join(source,name));const file=createHash('sha256').update(bytes).digest('hex').slice(0,16)+path.extname(name).toLowerCase();fs.writeFileSync(path.join(output,file),bytes);const meta=await sharp(bytes).metadata();return {name,src:'/images/home-picked/'+file,width:meta.width,height:meta.height};}));
fs.writeFileSync(path.join(root,'src/config/homePictures.json'),JSON.stringify(pictures,null,"\t")+"\n");
console.log(`已同步 ${pictures.length} 张自选首页图片。`);

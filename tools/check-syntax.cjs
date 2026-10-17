const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.join(__dirname,'..');
const files=['LCXL3 Device Profiles.control.js',...['lib','profiles','tools'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.js')).map(f=>dir+'/'+f))];
for(const file of files){const result=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`PASS: syntax (${files.length} JavaScript files)`);

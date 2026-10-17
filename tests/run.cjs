const cp=require('child_process'),path=require('path');
for(const file of ['../tools/check-syntax.cjs','iroko.cjs','profiles.cjs','navigation.cjs','pigments.cjs','mcrocklin.cjs']){
 const result=cp.spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}

const cp=require('child_process'),path=require('path');
for(const file of ['../tools/check-syntax.cjs','iroko.cjs','profiles.cjs','navigation.cjs','pigments.cjs','mcrocklin.cjs','helix.cjs','vox.cjs','archetype.cjs','archetype-eq.cjs','archetype-levels.cjs','archetype-teemah.cjs','bank-effects.cjs','trainwreck.cjs','trainwreck-core.cjs','trainwreck-rebase.cjs','dynamic-plate.cjs','trainwreck-output.cjs','black-parade.cjs','matchless.cjs','princeton.cjs','dr-z.cjs','remaining-bank.cjs','separate-amp-cab.cjs']){
 const result=cp.spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}

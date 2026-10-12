import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Run immediately before the fast-forward push; do not deploy a working folder.
const [repo,source,frozen,production]=process.argv.slice(2);
if(!repo||!frozen||![source,production].every(s=>/^[a-f0-9]{40}$/.test(s||'')))throw Error('Usage: release-preflight.mjs REPO SOURCE_SHA ARCHIVE PRODUCTION_SHA');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
git('fetch','origin');
const main=git('rev-parse','origin/main');
const remote=git('ls-remote','origin','refs/heads/main').split(/\s/)[0];
if(remote!==main)throw Error('main advanced during preflight; fetch and reconcile.');
git('merge-base','--is-ancestor',main,source);
git('merge-base','--is-ancestor',production,main);
const unreleased=git('diff','--name-only',production,main).split('\n').filter(Boolean).filter(f=>f!=='production-release.json');
if(unreleased.length)throw Error('main has changes not yet verified in production: '+unreleased.join(', '));
if(fs.existsSync(path.join(frozen,'.git')))throw Error('Use a fresh git archive, not a checkout.');
let checked=0;
for(const row of git('ls-tree','-r',source).split('\n')){
 const [info,file]=row.split('\t'),[mode,type,hash]=info.split(' ');
 if(type!=='blob')throw Error('Unsupported archive entry: '+file);
 const filename=path.join(frozen,file),bytes=mode==='120000'?Buffer.from(fs.readlinkSync(filename)):fs.readFileSync(filename);
 const actual=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
 if(actual!==hash)throw Error('Archive differs from reviewed commit: '+file);
 checked++;
}
console.log(JSON.stringify({sourceCommit:source,main,productionCommit:production,verifiedSourceFiles:checked}));

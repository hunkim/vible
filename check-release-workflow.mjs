import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {releaseIdentity} from './scripts/release-identity.mjs';
const root=path.dirname(new URL(import.meta.url).pathname),temp=fs.mkdtempSync(path.join(os.tmpdir(),'vible-release-check-'));
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const run=(file,cwd,args=[],env={})=>spawnSync(process.execPath,[path.join(root,file),...args],{cwd,env:{...process.env,...env},encoding:'utf8'});
try{
 const repo=path.join(temp,'repo'),remote=path.join(temp,'remote.git'),archive=path.join(temp,'archive');fs.mkdirSync(repo);fs.mkdirSync(archive);
 git(temp,'init','--bare',remote);git(repo,'init','-b','main');git(repo,'config','user.email','release-test@example.invalid');git(repo,'config','user.name','Release test');git(repo,'config','commit.gpgsign','false');git(repo,'remote','add','origin',remote);
 fs.writeFileSync(path.join(repo,'app.txt'),'released');git(repo,'add','.');git(repo,'commit','-m','App');const production=git(repo,'rev-parse','HEAD');git(repo,'push','origin','main');
 fs.writeFileSync(path.join(repo,'production-release.json'),'{}');git(repo,'add','.');git(repo,'commit','-m','Record');const metadata=git(repo,'rev-parse','HEAD');git(repo,'push','origin','main');
 assert.equal(run('scripts/ignore-record-only-build.mjs',repo,[],{VERCEL_GIT_PREVIOUS_SHA:production}).status,0);
 assert.equal(run('scripts/ignore-record-only-build.mjs',repo,[],{VERCEL_GIT_PREVIOUS_SHA:''}).status,1);
 assert.equal(run('scripts/ignore-record-only-build.mjs',repo,[],{VERCEL_GIT_PREVIOUS_SHA:'f'.repeat(40)}).status,1);
 fs.writeFileSync(path.join(repo,'app.txt'),'reviewed');git(repo,'add','.');git(repo,'commit','-m','New content');const source=git(repo,'rev-parse','HEAD');
 assert.equal(run('scripts/ignore-record-only-build.mjs',repo,[],{VERCEL_GIT_PREVIOUS_SHA:production}).status,1);
 // A metadata commit must not hide an earlier unbuilt content change.
 fs.writeFileSync(path.join(repo,'production-release.json'),'{"updated":true}');git(repo,'add','.');git(repo,'commit','-m','Later record');
 assert.equal(run('scripts/ignore-record-only-build.mjs',repo,[],{VERCEL_GIT_PREVIOUS_SHA:metadata}).status,1);
 execFileSync('tar',['-x','-C',archive],{input:execFileSync('git',['archive',source],{cwd:repo})});
 const args=[repo,source,archive,production];assert.equal(run('scripts/release-preflight.mjs',repo,args).status,0);
 fs.writeFileSync(path.join(archive,'app.txt'),'unreviewed draft');assert.notEqual(run('scripts/release-preflight.mjs',repo,args).status,0);fs.writeFileSync(path.join(archive,'app.txt'),'reviewed');
 git(repo,'push','origin','HEAD:main');assert.notEqual(run('scripts/release-preflight.mjs',repo,args).status,0);
 const sha='a'.repeat(40);assert.equal(releaseIdentity({VERCEL_GIT_COMMIT_SHA:sha,VIBLE_SOURCE_COMMIT:'b'.repeat(40)}).sourceCommit,sha);assert.equal(releaseIdentity({VIBLE_SOURCE_COMMIT:sha}).sourceCommit,sha);assert.equal(releaseIdentity({}).sourceCommit,null);assert.throws(()=>releaseIdentity({VERCEL:'1'}));assert.throws(()=>releaseIdentity({VIBLE_SOURCE_COMMIT:'invalid'}));
 const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));assert.equal(config.ignoreCommand,'node scripts/ignore-record-only-build.mjs');assert(config.headers.some(h=>h.source==='/release.json'&&h.headers.some(v=>v.value==='no-store')));
 console.log('Release guards verified: edited archives, advanced main and unreleased content blocked; only record-only deployments skipped; source identity validated.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}

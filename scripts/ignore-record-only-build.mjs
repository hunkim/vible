import {execFileSync} from 'node:child_process';
// Vercel: exit 0 skips; exit 1 builds. Missing history always builds.
let skip=false;
try{
 const previous=process.env.VERCEL_GIT_PREVIOUS_SHA;
 if(/^[a-f0-9]{40}$/.test(previous||'')){
  const files=execFileSync('git',['diff','--name-only',previous,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  skip=files.length===1&&files[0]==='production-release.json';
 }
}catch{/* A shallow clone or first deployment must still build. */}
console.log(skip?'Verified-release record only: skip duplicate deployment.':'Content or build changes: continue deployment.');
process.exit(skip?0:1);

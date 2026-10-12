export function releaseIdentity(env=process.env){
 const sourceCommit=env.VERCEL_GIT_COMMIT_SHA||env.VIBLE_SOURCE_COMMIT||null;
 if(sourceCommit&&!/^[a-f0-9]{40}$/.test(sourceCommit))throw Error('Invalid release source SHA.');
 if(env.VERCEL==='1'&&!sourceCommit)throw Error('Vercel builds require a Git source SHA. Release through main.');
 return {sourceCommit,deploymentId:env.VERCEL_DEPLOYMENT_ID||null};
}

// Build substitutes the configured CDN origin; local development remains self-contained.
export const ASSET_ORIGIN='';
export function assetURL(file,origin=ASSET_ORIGIN){
 if(!/^[a-zA-Z0-9_.-]+$/.test(file))throw Error('Invalid image filename');
 return `${origin&&file.endsWith('.jpg')?origin.replace(/\/$/,'')+'/':''}assets/${file}`;
}

import assert from 'node:assert/strict';
import {assetURL} from './assets.js';
assert.equal(assetURL('exodus-119-right-v1.jpg',''),'assets/exodus-119-right-v1.jpg');
assert.equal(assetURL('exodus-119-right-v1.jpg','https://images.vible.now'),'https://images.vible.now/assets/exodus-119-right-v1.jpg');
assert.equal(assetURL('image-pending.svg','https://images.vible.now'),'assets/image-pending.svg');
for(const unsafe of ['../secret','https://example.com/a.jpg','a.jpg?x=1'])assert.throws(()=>assetURL(unsafe));
console.log('Local/CDN image paths, local pending placeholders and safe filenames verified.');

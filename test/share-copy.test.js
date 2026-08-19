import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARE_INVITES, buildShareInviteCopy } from '../src/share-copy.js';

test('share copy randomizes among several short invitations and only exposes the code through the URL', () => {
  const url = 'https://picky.wzrice.cn/?pair=4P2JN';
  assert.ok(SHARE_INVITES.length >= 5);
  const first = buildShareInviteCopy(url, 0);
  const last = buildShareInviteCopy(url, 0.999999);
  assert.notEqual(first, last);
  for (const copy of [first, last]) {
    assert.match(copy, new RegExp(`${url.replace(/[?]/g, '\\?')}$`));
    assert.doesNotMatch(copy, /我的配对码|配对码是/);
    assert.equal(copy.match(/4P2JN/g)?.length, 1);
  }
});

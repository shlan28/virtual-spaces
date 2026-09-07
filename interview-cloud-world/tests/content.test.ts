import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,insights,interview,formatTime} from '../src/content.ts';
test('Every published chapter is a unique valid interval inside the source video',()=>{
 assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
 for(const c of chapters){assert.ok(c.start>=0 && c.end>c.start && c.end<=interview.duration);assert.ok(c.title && c.summary);}
 for(let i=1;i<chapters.length;i++) assert.ok(chapters[i].start>=chapters[i-1].end);
});
test('Every spatial insight links to an existing source chapter',()=>{for(const i of insights) assert.ok(chapters[i.chapter]);});
test('Long-video timestamps retain total minutes',()=>{assert.equal(formatTime(4314),'71:54');assert.equal(formatTime(100),'01:40');});

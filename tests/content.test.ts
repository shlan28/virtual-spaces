import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,insights,interview,formatTime,interviews,chaptersByInterview,exhibitSlots} from '../src/content.ts';
test('Every published chapter is a unique valid interval inside the source video',()=>{
 assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
 for(const c of chapters){assert.ok(c.start>=0 && c.end>c.start && c.end<=interview.duration);assert.ok(c.title && c.summary);}
 for(let i=1;i<chapters.length;i++) assert.ok(chapters[i].start>=chapters[i-1].end);
});
test('Every spatial insight links to an existing source chapter',()=>{for(const i of insights) assert.ok(chapters[i.chapter]);});
test('Long-video timestamps retain total minutes',()=>{assert.equal(formatTime(4314),'71:54');assert.equal(formatTime(100),'01:40');});

test('Published exhibits and insights resolve to a real interview while upcoming slots remain empty',()=>{
 const sourceIds=new Set(interviews.map(source=>source.id));
 assert.equal(sourceIds.size,interviews.length);
 assert.equal(new Set(exhibitSlots.map(slot=>slot.id)).size,exhibitSlots.length);
 for(const slot of exhibitSlots){
  if(slot.status==='upcoming') assert.equal(slot.interviewId,null);
  else {assert.ok(slot.interviewId);assert.ok(sourceIds.has(slot.interviewId));}
 }
 for(const insight of insights){assert.ok(sourceIds.has(insight.interviewId));assert.ok(chaptersByInterview[insight.interviewId]?.[insight.chapter]);}
});

import { createMission } from './arena-questions.js';

// Add a question factory here to enable another independently authored level.
export const arenaLevels=[
  {id:'percentages',number:1,title:'Procenta',displayTitle:'100 %',available:true,grade:'8. třída',createQuestions:createMission,sectors:['ZÁKLADNA','SLEVOVÉ DOKY','REAKTOR'],junctions:[2,5,8,10],lesson:'Nejdůležitější otázka: Co právě představuje 100 %?'},
  {id:'level-2',number:2,title:'Další mise',available:false},
  {id:'level-3',number:3,title:'Další mise',available:false},
];
export function loadLevel(id) {
  const config=arenaLevels.find(level=>level.id===id&&level.available);
  if(!config||typeof config.createQuestions!=='function')throw new Error('Arena level unavailable');
  const questions=config.createQuestions();
  if(!Array.isArray(questions)||!questions.length||questions.length>24)throw new Error('Arena levels support 1–24 gates');
  const text=value=>typeof value==='string'&&value.trim().length>0;
  for(const q of questions)if(!q||![q.text,q.skill,q.hint,q.explanation].every(text)||!Array.isArray(q.options)||q.options.length!==3||q.options.some(o=>!o||!text(o.label)||typeof o.correct!=='boolean')||q.options.filter(o=>o.correct).length!==1||new Set(q.options.map(o=>o.label)).size!==3)throw new Error('Invalid arena exercise');
  return {...config,questions};
}

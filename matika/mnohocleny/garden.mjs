// Deterministic rewards. One water drop per distinct solved task; no streaks or losses.
export const gardenItems = [
  {id:'daisy',name:'Sedmikráska',icon:'🌼',at:1},
  {id:'tulip',name:'Růžový tulipán',icon:'🌷',at:3},
  {id:'butterfly',name:'Modrý motýl',icon:'🦋',at:6},
  {id:'seedling',name:'Malý výhonek',icon:'🌱',at:10},
  {id:'sunflower',name:'Slunečnice',icon:'🌻',at:15},
  {id:'blossom',name:'Třešňový květ',icon:'🌸',at:21},
  {id:'ladybird',name:'Beruška',icon:'🐞',at:28},
  {id:'clover',name:'Čtyřlístek',icon:'🍀',at:36},
  {id:'hibiscus',name:'Kouzelný ibišek',icon:'🌺',at:45},
  {id:'mushroom',name:'Houbový domeček',icon:'🍄',at:55},
  {id:'rainbow',name:'Duha nad zahradou',icon:'🌈',at:68},
  {id:'fairy',name:'Strážkyně zahrady',icon:'🧚',at:82}
];
export const unlockedItems = drops => gardenItems.filter(item=>item.at<=drops);
export const newlyUnlocked = (before,after) => gardenItems.filter(item=>item.at>before&&item.at<=after);
export function sanitizeGarden(slots,drops) {
  const allowed=new Set(unlockedItems(drops).map(i=>i.id)), seen=new Set();
  return Array.from({length:12},(_,i)=>{
    const id=Array.isArray(slots)?slots[i]:null;
    if(!allowed.has(id)||seen.has(id))return null;
    seen.add(id);return id;
  });
}
export function placeItem(slots,id,index,drops) {
  if(!Number.isInteger(index)||index<0||index>=12||!unlockedItems(drops).some(i=>i.id===id))return sanitizeGarden(slots,drops);
  const next=sanitizeGarden(slots,drops).map(value=>value===id?null:value);
  next[index]=id;
  return next;
}

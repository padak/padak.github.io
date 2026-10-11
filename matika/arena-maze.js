export const CELL=4,ZONE_ROWS=12,COLUMNS=9;
const key=(col,row)=>`${col},${row}`;

export class MazeModel {
  constructor(gateCount,junctions=[],seed=12345) {
    this.gateCount=gateCount;this.junctions=new Set(junctions);this.cells=new Set();this.gates=[];
    this.opened=new Set();this.placements=[];
    let state=seed>>>0;
    const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
    const open=(c,r)=>this.cells.add(key(c,r));
    for(let stage=0;stage<gateCount;stage++) {
      const offset=stage*ZONE_ROWS,seen=new Set();
      const carve=(c,r)=>{
        seen.add(key(c,r));open(c,offset+r);
        const moves=[[2,0],[-2,0],[0,2],[0,-2]];
        for(let i=3;i>0;i--){const j=Math.floor(random()*(i+1));[moves[i],moves[j]]=[moves[j],moves[i]];}
        for(const [dc,dr] of moves){const nc=c+dc,nr=r+dr;if(nc<1||nc>7||nr<1||nr>5||seen.has(key(nc,nr)))continue;open(c+dc/2,offset+r+dr/2);carve(nc,nr);}
      };
      carve(3,1);
      for(const [c,r] of [[4,0],[3,0],[4,6],[3,6]])open(c,offset+r);
      // One extra connection makes a loop, with other branches ending in nooks.
      const loops=[];for(let r=1;r<=5;r+=2)for(let c=2;c<=6;c+=2)if(!this.cells.has(key(c,offset+r)))loops.push([c,r]);
      if(loops.length){const [c,r]=loops[Math.floor(random()*loops.length)];open(c,offset+r);}
      for(let r=7;r<=8;r++)for(let c=2;c<=6;c++)open(c,offset+r);
      const cols=this.junctions.has(stage)?[2,4,6]:[4];
      for(const c of cols){open(c,offset+9);open(c,offset+10);this.gates.push({stage,index:cols.length===3?(c-2)/2:0,col:c,row:offset+8.5,x:(c-4)*CELL,z:-(offset+8.5)*CELL});}
      for(let c=2;c<=6;c++)open(c,offset+11);
      this.placeSpiders(stage,offset);
    }
    // Final chamber beyond the last mathematical gate.
    for(let r=gateCount*ZONE_ROWS;r<gateCount*ZONE_ROWS+3;r++)for(let c=3;c<=5;c++)open(c,r);
  }
  has(col,row) {return this.cells.has(key(col,row));}
  cellAt(x,z) {return {col:Math.floor(x/CELL+4.5),row:Math.floor(-z/CELL+.5)};}
  wallEdges() {
    const edges=[];
    for(const cell of this.cells){const [c,r]=cell.split(',').map(Number),x=(c-4)*CELL,z=-r*CELL;
      for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])if(!this.has(c+dc,r+dr))edges.push({x:x+dc*CELL/2,z:z-dr*CELL/2,angle:dc?Math.PI/2:0});
    }
    return edges;
  }
  placeSpiders(stage,offset) {
    const nodes=[];for(let r=1;r<=5;r+=2)for(let c=1;c<=7;c+=2)nodes.push([c,r]);
    const chosen=[nodes[stage%4],nodes[5+stage%3],nodes[9+stage%3]];
    for(const [c,r] of chosen)for(const [dc,dr] of [[1,0],[-1,0],[0,-1],[0,1]])if(!this.has(c+dc,offset+r+dr)){
      this.placements.push({level:stage,x:(c-4)*CELL+dc*1.82,y:1.7+(stage%3)*.35,z:-(offset+r)*CELL-dr*1.82,angle:dc?-dc*Math.PI/2:dr===1?0:Math.PI});
      break;
    }
  }
  unlock(stage,index) {const gate=this.gates.find(g=>g.stage===stage&&g.index===(this.junctions.has(stage)?index:0));if(gate)this.opened.add(gate);return gate;}
  canOccupy(x,z,radius=.32) {
    const {col,row}=this.cellAt(x,z);
    const overlaps=(cx,cz,hw,hd)=>Math.max(Math.abs(x-cx)-hw,0)**2+Math.max(Math.abs(z-cz)-hd,0)**2<radius**2;
    for(let c=col-1;c<=col+1;c++)for(let r=row-1;r<=row+1;r++)if(!this.has(c,r)&&overlaps((c-4)*CELL,-r*CELL,CELL/2+.08,CELL/2+.08))return false;
    for(const g of this.gates)if(!this.opened.has(g)&&overlaps(g.x,g.z,CELL/2,.16))return false;
    return true;
  }
  move(position,dx,dz) {
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
    for(let i=0;i<steps;i++){
      if(this.canOccupy(position.x+dx/steps,position.z))position.x+=dx/steps;
      if(this.canOccupy(position.x,position.z+dz/steps))position.z+=dz/steps;
    }
    return position;
  }
  nearGate(stage,x,z) {const localRow=-z/CELL-stage*ZONE_ROWS;return localRow>=6.5&&localRow<9.1&&Math.abs(x)<=10;}
  passedGate(stage,z) {return -z/CELL>stage*ZONE_ROWS+9.15;}
  goal(stage) {return {x:0,z:-(stage*ZONE_ROWS+7)*CELL};}
  pathToGoal(stage,x,z,goalPosition=null) {
    const start=this.cellAt(x,z),goal=goalPosition?this.cellAt(goalPosition.x,goalPosition.z):{col:4,row:stage*ZONE_ROWS+7};
    const queue=[start],parents=new Map([[key(start.col,start.row),null]]);
    for(let i=0;i<queue.length;i++){
      const cell=queue[i],id=key(cell.col,cell.row);
      if(cell.col===goal.col&&cell.row===goal.row){const path=[];let cursor=id;while(cursor){const [col,row]=cursor.split(',').map(Number);path.unshift({x:(col-4)*CELL,z:-row*CELL});cursor=parents.get(cursor);}return path;}
      for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nc=cell.col+dc,nr=cell.row+dr,nid=key(nc,nr);if(!this.has(nc,nr)||parents.has(nid))continue;
        const fromZ=-cell.row*CELL,toZ=-nr*CELL;
        if(this.gates.some(g=>!this.opened.has(g)&&g.col===nc&&g.col===cell.col&&(fromZ-g.z)*(toZ-g.z)<0))continue;
        parents.set(nid,id);queue.push({col:nc,row:nr});
      }
    }
    return [];
  }
}

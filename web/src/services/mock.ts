import {initialProjects} from '../data.js';
import {DEMO_ACCOUNTS,type Account,type FundingService,type PoolStatus,type Project,type Role,type Transaction} from '../types.js';
export const ERROR_NAMES={1:'NotInitialized',2:'BadConfig',3:'WrongStatus',4:'ZeroAmount',5:'Overshoot',6:'NotInOrder',7:'CapExceeded',8:'NotApproved',9:'AlreadyRefunded',10:'NothingToRefund',11:'CapsTooLarge',12:'SupplierNotApproved'} as const;
export class FundingError extends Error{constructor(public code:keyof typeof ERROR_NAMES,message:string){super(message);this.name=ERROR_NAMES[code]}}
function fail(code:keyof typeof ERROR_NAMES,message:string):never{throw new FundingError(code,message)}
function auth(a:Account,role:Role){if(a.role!==role||DEMO_ACCOUNTS[a.id]?.address!==a.address||DEMO_ACCOUNTS[a.id]?.role!==role)throw new Error(`Only the ${role} account can do this.`)}
export function released(p:Project){return p.milestones.filter(m=>m.status==='approved').reduce((sum,m)=>sum+m.amount,0n)}
export function available(p:Project){return released(p)-p.categories.reduce((sum,c)=>sum+c.spent,0n)}
export function status(p:Project):PoolStatus{return p.rejected?'Failed':p.milestones.every(m=>m.status==='approved')?'Complete':p.raised===p.goal?'Funded':'Open'}
export function eligibleRefund(p:Project,address:string){const c=p.contributions.find(c=>c.address===address);return !p.rejected||!c||c.claimed||p.fundingAtRejection===0n?0n:c.amount*p.refundReserve/p.fundingAtRejection}
export function createMockService(delay=220):FundingService{
 let projects=initialProjects(),sequence=0;
 const wait=()=>new Promise<void>(r=>setTimeout(r,delay));
 const get=(id:string)=>projects.find(p=>p.id===id)??fail(1,'Project configuration was not found.');
 const writable=(id:string)=>{const p=get(id);if(!p.demoEnabled)throw new Error('This project is illustrative. Open the cold storage project for the interactive demo.');return p};
 const category=(p:Project,i:number,symbol:string)=>p.categories.find(c=>c.milestone===i&&c.symbol===symbol);
 function record(p:Project,a:Account,description:string,amount?:bigint):Transaction{const tx={id:`demo-tx-${++sequence}`,timestamp:new Date().toISOString(),description,amount};p.activity.unshift({...tx,address:a.address});return tx}
 return {
 async listProjects(){await wait();return structuredClone(projects)},async getProject(id){await wait();return structuredClone(get(id))},
 async contribute(id,amount,a){await wait();auth(a,'contributor');const p=writable(id);if(amount<=0n)fail(4,'Enter an amount above zero.');if(status(p)!=='Open')fail(3,`Contributions are unavailable while the pool is ${status(p)}.`);if(p.raised+amount>p.goal)fail(5,'That would pass the funding goal.');p.raised+=amount;const c=p.contributions.find(c=>c.address===a.address);if(c)c.amount+=amount;else p.contributions.push({name:a.name,address:a.address,amount,refunded:0n,claimed:false});return record(p,a,`${a.name} contributed`,amount)},
 async approveMilestone(id,i,a){await wait();auth(a,'verifier');const p=writable(id);if(status(p)!=='Funded')fail(3,`Approval is unavailable while the pool is ${status(p)}.`);if(i!==p.milestones.findIndex(m=>m.status==='pending'))fail(6,'Milestones must be approved in order.');p.milestones[i].status='approved';return record(p,a,`Milestone ${i+1} approved`,p.milestones[i].amount)},
 async rejectMilestone(id,i,a){await wait();auth(a,'verifier');const p=writable(id);if(status(p)!=='Funded')fail(3,`Rejection is unavailable while the pool is ${status(p)}.`);if(i!==p.milestones.findIndex(m=>m.status==='pending'))fail(6,'Review the next milestone in order.');p.refundReserve=p.raised-released(p);p.fundingAtRejection=p.raised;p.milestones[i].status='rejected';p.rejected=true;return record(p,a,`Milestone ${i+1} rejected`,p.refundReserve)},
 async spend(id,i,symbol,to,amount,a){await wait();auth(a,'recipient');const p=writable(id);if(amount<=0n)fail(4,'Enter an amount above zero.');if(p.milestones[i]?.status!=='approved')fail(8,'This milestone has not been approved yet.');if(!p.suppliers.some(s=>s.address===to&&s.approved))fail(12,'This wallet is not on the approved supplier list. No money moved.');const c=category(p,i,symbol);if(!c||c.spent+amount>c.cap)fail(7,'The category cap would be exceeded. No money moved.');c.spent+=amount;return record(p,a,`${c.name} payment to ${p.suppliers.find(s=>s.address===to)!.name}`,amount)},
 async claimRefund(id,a){await wait();auth(a,'contributor');const p=writable(id);if(status(p)!=='Failed')fail(3,'Refunds are only available after a milestone rejection.');const c=p.contributions.find(c=>c.address===a.address);if(c?.claimed)fail(9,'You have already claimed this refund.');const amount=eligibleRefund(p,a.address);if(!c||amount===0n)fail(10,'Nothing to claim for this wallet.');c.claimed=true;c.refunded=amount;return record(p,a,`${a.name} claimed a refund`,amount)},
 async getState(id){await wait();const p=get(id);const idx=p.milestones.findIndex(m=>m.status==='pending'||m.status==='rejected');return {status:status(p),goal:p.goal,totalRaised:p.raised,released:released(p),nextMilestone:idx<0?p.milestones.length:idx}},
 async getContribution(id,address){await wait();return get(id).contributions.find(c=>c.address===address)?.amount??0n},
 async getRefundable(id,address){await wait();return eligibleRefund(get(id),address)},
 async getMilestoneCount(id){await wait();return get(id).milestones.length},
 async getMilestone(id,i){await wait();const m=get(id).milestones[i];if(!m)fail(2,'Invalid milestone.');return structuredClone(m)},
 async getCap(id,i,c){await wait();return category(get(id),i,c)?.cap??0n},async getSpent(id,i,c){await wait();return category(get(id),i,c)?.spent??0n},async getRemaining(id,i,c){await wait();const b=category(get(id),i,c);return b?b.cap-b.spent:0n},
 async isSupplier(id,address){await wait();return get(id).suppliers.some(s=>s.address===address&&s.approved)},
 async getConfig(id){await wait();get(id);return {admin:'demo:admin',verifier:'demo:verifier',recipient:'demo:recipient',token:'demo:usdc'}},
 async reset(){await wait();projects=initialProjects();sequence=0},
 };
}

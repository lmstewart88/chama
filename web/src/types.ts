export type Role = 'contributor' | 'verifier' | 'recipient' | 'admin';
export type AccountId = 'amara' | 'baraka' | 'chidi' | 'verifier' | 'recipient' | 'admin' | 'wallet';
export interface Account { id:AccountId; name:string; address:string; role:Role }
export interface Milestone { title:string; bps:number; amount:bigint; status:'pending'|'approved'|'rejected' }
export interface Category { name:string; symbol:string; milestone:number; cap:bigint; spent:bigint }
export interface Contribution { address:string; name:string; amount:bigint; refunded:bigint; claimed:boolean }
export interface Supplier { name:string; address:string; approved:boolean }
export interface Activity { id:string; description:string; timestamp:string; address:string; amount?:bigint }
export type PoolStatus='Open'|'Funded'|'Complete'|'Failed';
/** Token amounts are bigint in seven-decimal USDC base units, matching INTERFACE.md. */
export interface Project { id:string; name:string; category:string; location:string; image:string; description:string; revenue:string; goal:bigint; raised:bigint; milestones:Milestone[]; categories:Category[]; contributions:Contribution[]; suppliers:Supplier[]; activity:Activity[]; rejected:boolean; refundReserve:bigint; fundingAtRejection:bigint; demoEnabled:boolean }
export interface Transaction { id:string; description:string; timestamp:string; amount?:bigint; hash?:string; simulated?:boolean }
export interface FundingService {
 listProjects():Promise<Project[]>; getProject(id:string):Promise<Project>;
 contribute(id:string,amount:bigint,account:Account):Promise<Transaction>;
 approveMilestone(id:string,index:number,account:Account):Promise<Transaction>;
 rejectMilestone(id:string,index:number,account:Account):Promise<Transaction>;
 spend(id:string,index:number,category:string,to:string,amount:bigint,account:Account):Promise<Transaction>;
 claimRefund(id:string,account:Account):Promise<Transaction>;
 getState(id:string):Promise<{status:PoolStatus;goal:bigint;totalRaised:bigint;released:bigint;nextMilestone:number}>;
 getContribution(id:string,address:string):Promise<bigint>; getRefundable(id:string,address:string):Promise<bigint>;
 getMilestoneCount(id:string):Promise<number>; getMilestone(id:string,index:number):Promise<Milestone>; getCap(id:string,index:number,category:string):Promise<bigint>;
 getSpent(id:string,index:number,category:string):Promise<bigint>; getRemaining(id:string,index:number,category:string):Promise<bigint>;
 isSupplier(id:string,address:string):Promise<boolean>;
 getConfig(id:string):Promise<{admin:string;verifier:string;recipient:string;token:string}>;
 reset():Promise<void>;
}
export const DEMO_ACCOUNTS:Record<AccountId,Account>={
 amara:{id:'amara',name:'Amara',address:'demo:amara',role:'contributor'},
 baraka:{id:'baraka',name:'Baraka',address:'demo:baraka',role:'contributor'},
 chidi:{id:'chidi',name:'Chidi',address:'demo:chidi',role:'contributor'},
 verifier:{id:'verifier',name:'Verifier',address:'demo:verifier',role:'verifier'},
 recipient:{id:'recipient',name:'Project operator',address:'demo:recipient',role:'recipient'},
 admin:{id:'admin',name:'Admin',address:'demo:admin',role:'admin'},
 wallet:{id:'wallet',name:'Connected wallet',address:'',role:'contributor'},
};

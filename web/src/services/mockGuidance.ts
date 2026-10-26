import type {Account,AccountId,Project} from '../types.js';
import {available,released,status} from './mock.js';
import {usdc} from '../format.js';

type GuidanceTab='Contributors'|'Milestones'|'Spending'|'Refunds'|'Activity';
export type MockGuidance={title:string;body:string;buttonLabel:string;tab:GuidanceTab;account?:AccountId;connect?:boolean};

export function mockGuidance(project:Project,account:Account|null):MockGuidance{
 const poolStatus=status(project);
 const next=project.milestones.findIndex(milestone=>milestone.status==='pending');
 const free=available(project);
 const allRefunded=project.rejected&&project.contributions.every(contribution=>contribution.claimed||contribution.amount===0n);
 if(project.rejected){
  const contributor=project.contributions.find(item=>!item.claimed&&item.amount>0n);
  if(allRefunded)return {title:'The funding journey is complete',body:'All eligible demo refunds have been claimed. Review the activity trail or reset the demo to try a different outcome.',buttonLabel:'View activity ↗',tab:'Activity'};
  const contributorId=contributor?.address.split(':')[1] as AccountId|undefined;
  const target=contributor&&account?.address!==contributor.address?contributorId:undefined;
  return {title:'Claim the unreleased funding',body:'Each contributor can claim their proportional share of unreleased funding once. Previously approved allocations remain available for permitted supplier payments.',buttonLabel:target?`Switch to ${contributor!.name} ↗`:`Review ${contributor?.name??'your'} refund ↗`,tab:'Refunds',account:target};
 }
 if(poolStatus==='Complete'){
  if(free>0n){
   const amount=usdc(free);
   const isOperator=account?.role==='recipient';
   return {title:'All milestone allocations are approved',body:`All ${project.milestones.length} milestones are approved. ${amount} USDC remains available for permitted supplier payments within the approved category caps.`,buttonLabel:isOperator?'Open supplier payments ↗':account?'Switch to project operator ↗':'Connect to manage payments ↗',tab:'Spending',account:account&&!isOperator?'recipient':undefined,connect:!account};
  }
  return {title:'All milestone allocations are complete',body:'Every milestone is approved and no approved funds remain unspent. Review the project activity for recorded supplier payments.',buttonLabel:'View activity ↗',tab:'Activity'};
 }
 if(project.raised<project.goal){
  if(!account)return {title:'Bring the contributors together',body:'Connect a demo contributor account to try a simulated contribution toward the 1,000 USDC goal.',buttonLabel:'Start the demo ↗',tab:'Contributors',connect:true};
  const nextContributor=project.contributions.find(contribution=>contribution.amount===0n);
  const target=nextContributor?.address.split(':')[1] as AccountId|undefined;
  return {title:'Bring the contributors together',body:'Contributions bring the shared pool toward its goal. No funds are released until the verifier reviews a milestone.',buttonLabel:target&&target!==account.id?`Continue as ${nextContributor!.name} ↗`:'Review contributors ↗',tab:'Contributors',account:target&&target!==account.id?target:undefined};
 }
 if(account?.role==='recipient'&&free>0n)return {title:'Pay approved suppliers',body:`${usdc(free)} USDC is approved but unspent. Supplier payments must remain within the approved milestone category caps.`,buttonLabel:'Open supplier payments ↗',tab:'Spending'};
 if(poolStatus==='Funded'&&next>=0&&account?.role==='verifier')return {title:`Review milestone ${next+1}`,body:`Milestone ${next+1} is awaiting verifier review. You may approve it or reject it; rejection is available only for this next pending milestone.`,buttonLabel:`Review milestone ${next+1} ↗`,tab:'Milestones'};
 if(poolStatus==='Funded'&&next>=0)return {title:`Milestone ${next+1} awaits verifier review`,body:'The verifier can approve or reject the next pending milestone. Released funds remain subject to their category caps.',buttonLabel:'Switch to verifier ↗',tab:'Milestones',account:'verifier'};
 if(free>0n)return {title:'Approved funds are available',body:`${usdc(free)} USDC remains approved but unspent for permitted supplier payments.`,buttonLabel:account?'Switch to project operator ↗':'Connect to manage payments ↗',tab:'Spending',account:account?'recipient':undefined,connect:!account};
 return {title:'Review project activity',body:'Follow verified milestone decisions and supplier payments in the project activity trail.',buttonLabel:'View activity ↗',tab:'Activity'};
}

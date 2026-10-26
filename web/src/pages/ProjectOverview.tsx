import type {Account,Project} from '../types';
import {available,released} from '../services/mock';
import {DATA_MODE} from '../services';
import {percent,usdc} from '../format';

type Props={project:Project;account:Account|null;busy:boolean;next:number;onTab:(tab:string)=>void;onConnect:()=>void;onReviewMilestone:(kind:'approve'|'reject',index:number)=>void};

export function ProjectOverview({project:p,account,busy,next,onTab,onConnect,onReviewMilestone}:Props){
 const paid=p.categories.reduce((sum,category)=>sum+category.spent,0n);
 const awaiting=p.raised-released(p)-p.contributions.reduce((sum,contribution)=>sum+contribution.refunded,0n);
 const roleLabel=account?.role==='verifier'?'Verifier workspace':account?.role==='recipient'?'Project operator workspace':account?.role==='contributor'?'Contributor view':'Project overview';
 const verifierCanReview=account?.role==='verifier'&&p.demoEnabled&&next>=0&&!p.rejected;
 const milestoneStatus=(index:number)=>{const milestone=p.milestones[index];return milestone.status==='pending'?p.rejected?'Not approved':'Awaiting review':milestone.status};
 return <div className="project-overview">
  <div className="overview-intro">
   <div><span className="eyebrow">{p.category} · {p.demoEnabled?'INTERACTIVE DEMO':'ILLUSTRATIVE PROJECT'}</span><h2>{p.name}</h2><p>{p.description}</p><div className="overview-location"><span aria-hidden="true">⌖</span>{p.location}<span className="overview-revenue">Revenue source: {p.revenue}</span></div></div>
   <div className="overview-photo"><img src={`/assets/${p.image}`} alt={`Illustrative photograph for ${p.name}`}/><span>Illustrative photograph · Not an actual Chama Pool project</span></div>
  </div>
  <div className="overview-metrics" aria-label="Project funding summary">
   <article><span>Funds pooled</span><strong>{usdc(p.raised)} <small>USDC</small></strong><div className="progress" role="progressbar" aria-label="Funding goal progress" aria-valuenow={percent(p.raised,p.goal)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${percent(p.raised,p.goal)}%`}}/></div><small>{percent(p.raised,p.goal)}% of {usdc(p.goal)} USDC goal</small></article>
   <article><span>{p.rejected?'Unreleased balance':'Awaiting approval'}</span><strong>{usdc(awaiting)} <small>USDC</small></strong><small>Not yet available for supplier payments</small></article>
   <article><span>Approved but unspent</span><strong>{usdc(available(p))} <small>USDC</small></strong><small>Available within approved category caps</small></article>
   <article><span>Supplier payments</span><strong>{usdc(paid)} <small>USDC</small></strong><small>Payments recorded in the mock</small></article>
  </div>
    {p.demoEnabled&&<section className="overview-role" aria-label={roleLabel}><div><span className="eyebrow">{roleLabel} · {DATA_MODE==='live'?'LIVE TESTNET':'SIMULATED'}</span><strong>{account?.role==='verifier'?'Review milestone progress':account?.role==='recipient'?'Manage approved supplier payments':account?.role==='contributor'?'Your contribution to the pool':account?.role==='admin'?'Admin read-only view':'Try the funding demo'}</strong><p>{account?.role==='verifier'?'Approve or reject the next milestone when the pool is funded.':account?.role==='recipient'?'Choose an approved supplier and pay within the milestone category budget.':account?.role==='contributor'?`Your contribution: ${usdc(p.contributions.find(contribution=>contribution.address===account.address)?.amount??0n)} USDC.`:account?.role==='admin'?'Review project balances and activity. This role cannot contribute, approve milestones or pay suppliers.':DATA_MODE==='live'?'Connect a Freighter wallet to read your contribution and role permissions from the contract.':'Connect a demo contributor account to review and simulate a contribution.'}</p></div>
    {account?.role==='verifier'?<button className="btn lime" disabled={busy||!verifierCanReview||statusLabel(p)!=='Funded'} onClick={()=>onTab('Milestones')}>Review milestone {next>=0?next+1:''} ↗</button>:account?.role==='recipient'?<button className="btn lime" disabled={busy||!p.milestones.some(milestone=>milestone.status==='approved')} onClick={()=>onTab('Spending')}>Open supplier payments ↗</button>:account?.role==='contributor'?<button className="btn lime" onClick={()=>onTab('Contributors')}>View contributors ↗</button>:account?.role==='admin'?<button className="btn lime" onClick={()=>onTab('Activity')}>View activity ↗</button>:<button className="btn lime" onClick={onConnect}>{DATA_MODE==='live'?'Connect Freighter ↗':'Connect demo account ↗'}</button>}
  </section>}
  <section className="overview-timeline" aria-labelledby="overview-timeline-title"><div className="overview-section-heading"><div><span className="eyebrow">FUNDING PLAN · {p.milestones.length} MILESTONES</span><h3 id="overview-timeline-title">Progress and category budgets</h3></div><button className="textbtn" onClick={()=>onTab('Milestones')}>Milestone details ↗</button></div>
   {p.milestones.map((milestone,index)=><details className="overview-milestone" key={milestone.title} open={index===next||index===0&&next<0}><summary><span className="overview-step">{String(index+1).padStart(2,'0')}</span><span className="overview-milestone-name"><strong>{milestone.title}</strong><small>{usdc(milestone.amount)} USDC · {milestone.bps/100}% of goal</small></span><span className={`overview-status ${milestone.status}`}>{milestoneStatus(index)}</span><span className="overview-chevron" aria-hidden="true">⌄</span></summary>
    <div className="overview-categories">{p.categories.filter(category=>category.milestone===index).map(category=><div className="overview-category" key={category.symbol}><div><strong>{category.name}</strong><span>{usdc(category.spent)} spent · {usdc(category.cap-category.spent)} remaining</span></div><div className="progress" role="progressbar" aria-label={`${category.name} spending against its cap`} aria-valuenow={percent(category.spent,category.cap)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${percent(category.spent,category.cap)}%`}}/></div><small>Cap {usdc(category.cap)} USDC</small></div>)}</div>
    {verifierCanReview&&index===next&&<div className="overview-milestone-actions"><span>Verifier action · simulated</span><div><button className="btn green" disabled={busy||statusLabel(p)!=='Funded'} onClick={()=>onReviewMilestone('approve',index)}>Approve milestone {index+1}</button><button className="btn outline" disabled={busy||statusLabel(p)!=='Funded'} onClick={()=>onReviewMilestone('reject',index)}>Reject milestone {index+1}</button></div></div>}
   </details>)}
  </section>
  <p className="overview-disclaimer">{DATA_MODE==='live'?'Live testnet state from the configured Soroban contract. Approved funds remain subject to category caps; no returns are available.':'Figures are simulated. Approved funds remain subject to category caps; no live contract transactions or returns are available.'}</p>
 </div>
}
function statusLabel(project:Project){return project.rejected?'Failed':project.milestones.every(milestone=>milestone.status==='approved')?'Complete':project.raised===project.goal?'Funded':'Open'}

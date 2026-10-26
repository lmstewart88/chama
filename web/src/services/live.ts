import {getNetworkDetails,requestAccess,signTransaction as freighterSignTransaction} from '@stellar/freighter-api';
import {Client,Errors} from 'chama-generated-bindings';
import type {Account,AccountId,Category,FundingService,Milestone,PoolStatus,Project,Transaction} from '../types';
import {initialProjects} from '../data';
import {ONE} from '../format';
import {EXPECTED_CONTRACT_ID,EXPECTED_TOKEN_ID,liveConfig} from './config';
import {FundingError} from './mock';

let connectedAddress:string|null=null;
let connectedConfig:{admin:string;verifier:string;recipient:string;token:string}|null=null;

function client(){
 const address=connectedAddress??undefined;
 return new Client({
  rpcUrl:liveConfig.rpcUrl,
  networkPassphrase:liveConfig.networkPassphrase,
  publicKey:address,
  signTransaction:address?async(xdr,options)=>{
   const result=await freighterSignTransaction(xdr,{networkPassphrase:options?.networkPassphrase??liveConfig.networkPassphrase,address});
   if(result.error)throw new Error(result.error.message);
   if(!result.signedTxXdr)throw new Error('Freighter did not return a signed transaction.');
    if(result.signerAddress&&result.signerAddress!==address)throw new Error('Freighter signed with a different account.');
    return {signedTxXdr:result.signedTxXdr,signerAddress:result.signerAddress};
  }:undefined,
  errorTypes:Errors,
  contractId:liveConfig.contractId,
 });
}

function accountRole(address:string,config:{admin:string;verifier:string;recipient:string;token:string}):{id:AccountId;name:string;role:Account['role']} {
 if(address===config.admin)return {id:'admin',name:'Admin wallet',role:'admin'};
 if(address===config.verifier)return {id:'verifier',name:'Verifier wallet',role:'verifier'};
 if(address===config.recipient)return {id:'recipient',name:'Project operator wallet',role:'recipient'};
 return {id:'wallet',name:'Connected contributor',role:'contributor'};
}

export async function connectLiveWallet():Promise<Account>{
 const access=await requestAccess();
 if(access.error)throw new Error(access.error.message);
 if(!access.address)throw new Error('Freighter did not return a public address.');
 const network=await getNetworkDetails();
 if(network.error)throw new Error(network.error.message);
 if(network.networkPassphrase!==liveConfig.networkPassphrase)throw new Error('Switch Freighter to Stellar testnet before continuing.');
 connectedAddress=access.address;
 const [admin,verifier,recipient,token]=await client().get_config().then(tx=>tx.result);
 connectedConfig={admin,verifier,recipient,token};
 return {address:access.address,...accountRole(access.address,connectedConfig)};
}
export function disconnectLiveWallet(){connectedAddress=null;connectedConfig=null;}
export function currentLiveAddress(){return connectedAddress;}
export function liveRoleFor(address:string,config=connectedConfig){return config?accountRole(address,config):{id:'wallet' as AccountId,name:'Connected contributor',role:'contributor' as const};}
export async function verifyLiveReadOnly(){
 if(!liveConfig.enabled)throw new Error('Live contract and token IDs are not configured.');
 if(liveConfig.contractId!==EXPECTED_CONTRACT_ID)throw new Error(`Configured contract mismatch. Expected ${EXPECTED_CONTRACT_ID}; configured ${liveConfig.contractId}.`);
 if(liveConfig.tokenId!==EXPECTED_TOKEN_ID)throw new Error(`Configured token mismatch. Expected ${EXPECTED_TOKEN_ID}; configured ${liveConfig.tokenId}.`);
 const api=client();
 const [[poolStatus,goal,totalRaised,releasedAmount,nextMilestone],[admin,verifier,recipient,token],milestoneCount]=await Promise.all([api.get_state().then(tx=>tx.result),api.get_config().then(tx=>tx.result),api.get_milestone_count().then(tx=>tx.result)]);
 if(token!==liveConfig.tokenId)throw new Error(`Configured token does not match contract token. Expected ${liveConfig.tokenId}; contract reports ${token}.`);
 return {contractId:liveConfig.contractId,tokenId:token,roles:{admin,verifier,recipient},status:statusValue(poolStatus),goal:asBigInt(goal),totalRaised:asBigInt(totalRaised),released:asBigInt(releasedAmount),nextMilestone:Number(nextMilestone),milestoneCount:Number(milestoneCount)};
}

function statusValue(value:{tag:string;values?:unknown}):PoolStatus{
 if(['Open','Funded','Complete','Failed'].includes(value.tag))return value.tag as PoolStatus;
 throw new Error(`Unexpected contract pool status: ${value.tag}`);
}
function asBigInt(value:bigint|number|string){return typeof value==='bigint'?value:BigInt(value);}
async function confirmed<T>(tx:import('chama-generated-bindings').ContractTransaction<T>,description:string,amount?:bigint):Promise<Transaction>{
 const sent=await tx.signAndSend();
 const response=sent.getTransactionResponse;
 if(response?.status!=='SUCCESS')throw new Error(response?.status==='FAILED'?'Transaction failed on Stellar testnet.':'Transaction was submitted but did not confirm. No success was recorded.');
 const hash=sent.sendTransactionResponse?.hash??response.txHash;
 return {id:hash,hash,description,timestamp:new Date().toISOString(),amount,simulated:false};
}
function requireAddress(account:Account){
 if(!connectedAddress||connectedAddress!==account.address)throw new Error('Connect the wallet for the selected account before signing.');
}
function requireRole(account:Account,role:Account['role']){
 requireAddress(account);
 const resolved=connectedConfig?accountRole(account.address,connectedConfig).role:'contributor';
 if(resolved!==role)throw new Error(`Connected wallet is not configured as the ${role}.`);
}
function contractError(error:unknown):never{
 const text=error instanceof Error?error.message:String(error);
 const match=text.match(/(?:Error\(Contract,\s*#|contract error\s*#?)(\d+)/i);
 const code=match?Number(match[1]):undefined;
 if(code===7)throw new FundingError(7,'The category cap would be exceeded. No money moved.');
 if(code===12)throw new FundingError(12,'This wallet is not on the approved supplier list. No money moved.');
 if(code&&code>=1&&code<=12)throw new FundingError(code as 1|2|3|4|5|6|8|9|10|11,text);
 throw error instanceof Error?error:new Error(text);
}
async function write<T>(operation:()=>Promise<import('chama-generated-bindings').ContractTransaction<T>>,description:string,amount?:bigint):Promise<Transaction>{
 try{return await confirmed(await operation(),description,amount)}catch(error){return contractError(error)}
}
async function state(){const [status,goal,raised,released,nextMilestone]=await client().get_state().then(tx=>tx.result);return {status:statusValue(status),goal:asBigInt(goal),totalRaised:asBigInt(raised),released:asBigInt(released),nextMilestone:Number(nextMilestone)}}
async function loadProject(template:Project):Promise<Project>{
 const api=client();
 const [pool,config,count]=await Promise.all([api.get_state().then(tx=>tx.result),api.get_config().then(tx=>tx.result),api.get_milestone_count().then(tx=>tx.result)]);
 const [poolStatus,goal,raised,releasedAmount,nextMilestone]=pool;
 connectedConfig={admin:config[0],verifier:config[1],recipient:config[2],token:config[3]};
 if(config[3]!==liveConfig.tokenId)throw new Error(`Configured token does not match contract token. Expected ${liveConfig.tokenId}; contract reports ${config[3]}.`);
 const milestones:Milestone[]=await Promise.all(Array.from({length:Number(count)},async(_,index)=>{
  const [bps,amount,approved]=await api.get_milestone({idx:index}).then(tx=>tx.result);
  const rejected=poolStatus.tag==='Failed'&&index===Number(nextMilestone);
  return {title:template.milestones[index]?.title??`Milestone ${index+1}`,bps:Number(bps),amount:asBigInt(amount),status:rejected?'rejected':approved?'approved':'pending'};
 }));
 const categories:Category[]=await Promise.all(milestones.flatMap((_,milestone)=>['equipment','installation'].map(async symbol=>{
  const [cap,spent]=await Promise.all([api.get_cap({idx:milestone,category:symbol}).then(tx=>tx.result),api.get_spent({idx:milestone,category:symbol}).then(tx=>tx.result)]);
  return {name:symbol==='equipment'?'Equipment':'Installation',symbol,milestone,cap:asBigInt(cap),spent:asBigInt(spent)};
 })));
 const contributions=connectedAddress?[{address:connectedAddress,name:liveRoleFor(connectedAddress).name,amount:asBigInt(await api.get_contribution({addr:connectedAddress}).then(tx=>tx.result)),refunded:0n,claimed:poolStatus.tag==='Failed'&&asBigInt(await api.get_refundable({addr:connectedAddress}).then(tx=>tx.result))===0n}]:[];
 const status=statusValue(poolStatus);
 return {...template,goal:asBigInt(goal),raised:asBigInt(raised),milestones,categories,contributions,suppliers:[],activity:[],rejected:status==='Failed',refundReserve:status==='Failed'?asBigInt(raised)-asBigInt(releasedAmount):0n,fundingAtRejection:status==='Failed'?asBigInt(raised):0n};
}

export const liveFundingService:FundingService={
 async listProjects(){const template=initialProjects().find(project=>project.id==='enterprise')!;return [await loadProject(template)]},
 async getProject(id){const project=initialProjects().find(item=>item.id===id);if(!project)throw new Error('Project was not found.');return project.id==='enterprise'?loadProject(project):project},
 async getState(){return state()},
 async getContribution(_id,address){return asBigInt(await client().get_contribution({addr:address}).then(tx=>tx.result))},
 async getRefundable(_id,address){return asBigInt(await client().get_refundable({addr:address}).then(tx=>tx.result))},
 async getMilestoneCount(){return Number(await client().get_milestone_count().then(tx=>tx.result))},
 async getMilestone(_id,index){const [bps,amount,approved]=await client().get_milestone({idx:index}).then(tx=>tx.result);return {title:initialProjects()[1].milestones[index]?.title??`Milestone ${index+1}`,bps:Number(bps),amount:asBigInt(amount),status:approved?'approved':'pending'}},
 async getCap(_id,index,category){return asBigInt(await client().get_cap({idx:index,category}).then(tx=>tx.result))},
 async getSpent(_id,index,category){return asBigInt(await client().get_spent({idx:index,category}).then(tx=>tx.result))},
 async getRemaining(_id,index,category){return asBigInt(await client().get_remaining({idx:index,category}).then(tx=>tx.result))},
 async isSupplier(_id,address){return client().is_supplier({addr:address}).then(tx=>tx.result)},
 async getConfig(){const [admin,verifier,recipient,token]=await client().get_config().then(tx=>tx.result);return {admin,verifier,recipient,token}},
 async contribute(id,amount,account){if(id!=='enterprise')throw new Error('Only the Fresh Food Cold Storage pool is deployed.');requireRole(account,'contributor');return write(()=>client().contribute({from:account.address,amount}),`${account.name} contributed`,amount)},
 async approveMilestone(id,index,account){if(id!=='enterprise')throw new Error('Only the Fresh Food Cold Storage pool is deployed.');requireRole(account,'verifier');return write(()=>client().approve_milestone({idx:index}),`Milestone ${index+1} approved`)},
 async rejectMilestone(id,index,account){if(id!=='enterprise')throw new Error('Only the Fresh Food Cold Storage pool is deployed.');requireRole(account,'verifier');return write(()=>client().reject_milestone({idx:index}),`Milestone ${index+1} rejected`)},
 async spend(id,index,category,to,amount,account){if(id!=='enterprise')throw new Error('Only the Fresh Food Cold Storage pool is deployed.');requireRole(account,'recipient');return write(()=>client().spend({idx:index,category,to,amount}),`Supplier payment to ${to}`,amount)},
 async claimRefund(id,account){if(id!=='enterprise')throw new Error('Only the Fresh Food Cold Storage pool is deployed.');requireRole(account,'contributor');return write(()=>client().refund({contributor:account.address}),`${account.name} claimed a refund`)},
 async reset(){throw new Error('Reset is disabled in live mode. Use the backend reset script only when explicitly authorized.')},
};

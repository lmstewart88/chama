import {useEffect,useState} from 'react';
import {verifyLiveReadOnly} from '../services/live';
import {DATA_MODE} from '../services';
import {usdc} from '../format';

type Result=Awaited<ReturnType<typeof verifyLiveReadOnly>>;
export function LiveReadStatus(){
 const [state,setState]=useState<{result?:Result;error?:string;loading:boolean}>({loading:true});
 useEffect(()=>{let active=true;verifyLiveReadOnly().then(result=>{if(active)setState({result,loading:false})}).catch(error=>{if(active)setState({error:(error as Error).message,loading:false})});return()=>{active=false}},[]);
 if(DATA_MODE!=='live')return null;
 if(state.loading)return <span className="live-read-status" role="status">Checking testnet reads…</span>;
 if(state.error)return <span className="live-read-status failed" role="alert">Testnet read failed · {state.error}</span>;
 const result=state.result!;
 return <span className="live-read-status" role="status">Testnet read verified · {result.status} · {usdc(result.totalRaised)} / {usdc(result.goal)} USDC · {result.milestoneCount} milestones</span>;
}

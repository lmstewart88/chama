declare module 'chama-generated-bindings' {
 export interface ContractStatus {tag:'Open'|'Funded'|'Complete'|'Failed';values?:unknown}
 export interface ClientOptions {contractId:string;networkPassphrase:string;rpcUrl:string;publicKey?:string;signTransaction?:((xdr:string,options?:{networkPassphrase?:string;address?:string})=>Promise<{signedTxXdr:string;signerAddress?:string;error?:{message:string}} >);errorTypes?:Record<number,{message:string}>}
 export interface ContractTransaction<T>{result:T;signAndSend():Promise<{sendTransactionResponse?:{hash?:string};getTransactionResponse?:{status:string;txHash:string}}>;}
 export class Client {
  constructor(options:ClientOptions);
  get_state():Promise<ContractTransaction<readonly [ContractStatus,bigint,bigint,bigint,number]>>;
  get_config():Promise<ContractTransaction<readonly [string,string,string,string]>>;
  get_milestone_count():Promise<ContractTransaction<number>>;
  get_milestone(args:{idx:number}):Promise<ContractTransaction<readonly [number,bigint,boolean]>>;
  get_cap(args:{idx:number;category:string}):Promise<ContractTransaction<bigint>>;
  get_spent(args:{idx:number;category:string}):Promise<ContractTransaction<bigint>>;
  get_remaining(args:{idx:number;category:string}):Promise<ContractTransaction<bigint>>;
  get_contribution(args:{addr:string}):Promise<ContractTransaction<bigint>>;
  get_refundable(args:{addr:string}):Promise<ContractTransaction<bigint>>;
  is_supplier(args:{addr:string}):Promise<ContractTransaction<boolean>>;
  contribute(args:{from:string;amount:bigint}):Promise<ContractTransaction<null>>;
  approve_milestone(args:{idx:number}):Promise<ContractTransaction<null>>;
  reject_milestone(args:{idx:number}):Promise<ContractTransaction<null>>;
  spend(args:{idx:number;category:string;to:string;amount:bigint}):Promise<ContractTransaction<null>>;
  refund(args:{contributor:string}):Promise<ContractTransaction<null>>;
 }
 export const Errors:Record<number,{message:string}>;
}

export const ONE=10_000_000n;
const MAX_I128=(1n<<127n)-1n;
export function parseUSDC(value:string):bigint {const s=value.trim();if(!/^\d+(\.\d{1,7})?$/.test(s))throw new Error('Enter a positive amount with at most seven decimal places.');const [whole,frac='']=s.split('.');const amount=BigInt(whole)*ONE+BigInt(frac.padEnd(7,'0'));if(amount<=0n||amount>MAX_I128)throw new Error('Enter a valid positive USDC amount.');return amount;}
export function usdc(value:bigint):string{const negative=value<0n,a=negative?-value:value;const whole=(a/ONE).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');const frac=(a%ONE).toString().padStart(7,'0').replace(/0+$/,'');return `${negative?'-':''}${whole}${frac?'.'+frac:''}`;}
export const percent=(part:bigint,total:bigint)=>total>0n?Number(part*10000n/total)/100:0;

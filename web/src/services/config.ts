const contractId=import.meta.env.VITE_CHAMA_CONTRACT_ID?.trim()??'';
const tokenId=import.meta.env.VITE_TOKEN_CONTRACT_ID?.trim()??'';
export const EXPECTED_CONTRACT_ID='CCIN5YYNDCAKI5L25MVCXUX3N4ROHI6ZPJUPWDYUFF2KBEL6NHOVKCRE';
export const EXPECTED_TOKEN_ID='CCFFHHB6VMBBJWP5FWFNLTB4AUQLSTMVYTO5CN4BMU3BWACOQMLB4G6Z';

export const liveConfig={
 contractId,
 tokenId,
 rpcUrl:import.meta.env.VITE_RPC_URL?.trim()||'https://soroban-testnet.stellar.org',
 networkPassphrase:import.meta.env.VITE_NETWORK_PASSPHRASE?.trim()||'Test SDF Network ; September 2015',
 network:import.meta.env.VITE_NETWORK?.trim()||'testnet',
 explorerTx:(hash:string)=>`https://stellar.expert/explorer/testnet/tx/${encodeURIComponent(hash)}`,
 enabled:Boolean(contractId&&tokenId),
 matchesExpected:contractId===EXPECTED_CONTRACT_ID&&tokenId===EXPECTED_TOKEN_ID,
};

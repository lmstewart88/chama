import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const sdk = fileURLToPath(new URL('./node_modules/@stellar/stellar-sdk/lib/esm', import.meta.url));

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: [
			{ find: /^buffer$/, replacement: fileURLToPath(new URL('./node_modules/buffer/index.js', import.meta.url)) },
			{ find: 'chama-generated-bindings', replacement: fileURLToPath(new URL('../packages/bindings/src/index.ts', import.meta.url)) },
			{ find: /^@stellar\/stellar-sdk$/, replacement: `${sdk}/index.js` },
			{ find: /^@stellar\/stellar-sdk\/(contract|rpc)$/, replacement: `${sdk}/$1/index.js` },
			{ find: /^@stellar\/stellar-sdk\/(.+)$/, replacement: `${sdk}/$1.js` },
		],
	},
	root,
	server: { allowedHosts: ['terminal.local'] } // Retaining the original server configuration
});

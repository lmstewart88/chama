# Continue in Codex

Open the team repository with this project under `web/` and use this prompt:

> Work in web/. Read README.md and docs/BACKEND_HANDOFF.md. This is the React
> Chama Pool frontend with mock funding behavior. Preserve the current design
> and component structure. Preserve the approved homepage as the default route. Run npm ci, npm test and npm run build. Start the app
> with npm run dev. Do not add real wallet payments until the backend contract
> interface is provided. When available, connect it through src/services/index.ts.
> Keep mock mode explicit and do not represent simulated activity as onchain.

The backend lead owns contracts/. Do not change their contract or assume the
mock function names and cap/refund semantics are already agreed.

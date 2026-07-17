# CUVoC Presentation

The Presentation phase is a responsive Next.js dashboard for CookUnity Voice of Customer findings. It opens with a compact overview, then renders six curated analysis views and their written findings from `data/dashboard.json`, through the typed interface in `data/dashboard.ts`. The same allowlisted data grounds a small OpenAI-powered assistant, so its answers stay aligned with the visible dashboard.

## Application structure

- `app/` contains the dashboard page, styles, and `POST /api/chat` route.
- `components/` contains the dashboard, Plotly chart, and chat interfaces.
- `data/dashboard.json` is the non-sensitive aggregate artifact exported by Analysis.
- `data/dashboard.ts` is the typed interface for displayed and assistant-accessible findings.
- `lib/dashboard-assistant.ts` defines the assistant context, instructions, and request validation.
- `public/` contains the CookUnity brand asset.

The committed data contains curated aggregate outputs that are safe to display and send to OpenAI. Raw tickets and customer messages remain outside the Presentation phase and outside cloud inference requests.

## Local setup

The application requires Node.js 22 through 24 and npm.

```bash
cd presentation
npm install
```

Create `presentation/.env` manually with these variables:

```dotenv
OPENAI_API_KEY=<project-api-key>
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` is required for the assistant. `OPENAI_MODEL` is optional because the server defaults to `gpt-5-mini`. Never prefix the API key with `NEXT_PUBLIC_`, since that exposes it to the browser. The repository ignores `.env`, and credentials must never be committed.

Start and verify the application from `presentation/`:

```bash
npm run check
npm run build
npm run dev
```

The development server normally opens at `http://localhost:3000`.

## OpenAI setup

API billing is separate from ChatGPT and Codex subscriptions. Configure the API account at the [OpenAI Platform](https://platform.openai.com/).

1. Add API billing or prepaid credits under the organization billing settings. For a small public demo, an initial balance with auto recharge and a monthly recharge limit reduces the chance of interruption while bounding exposure. OpenAI documents the available controls in its [prepaid billing guide](https://help.openai.com/en/articles/8264644-manage-your-chatgpt-subscription).
2. Create a dedicated project for this deployment. A separate project isolates keys, usage reporting, budgets, and model limits from other applications.
3. Open the project Limits page. Enable `gpt-5-mini`, review its request and token rate limits, set a monthly budget, and add notification thresholds. Project budgets are soft alerts rather than hard spending caps, as described in [OpenAI project management](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform).
4. Create a project API key. Give it a descriptive name such as `Vercel Production` and select **Restricted** permissions.
5. Grant **Write** access only to **Model capabilities → Responses (`/v1/responses`)**. Leave List models, every other model capability, Assistants, Threads, Evals, Fine-tuning, Files, Videos, Vector Stores, Prompts, Batch, Tunnels, and Datasets set to **None**.
6. Copy the secret once and store it as `OPENAI_API_KEY` locally and in Vercel. Never share one personal key across teammates. OpenAI recommends distinct project keys for auditable collaboration in its [API key safety guidance](https://help.openai.com/en/articles/5008148).

The server uses the OpenAI Responses API through Vercel AI SDK. It disables OpenAI response storage, uses low reasoning effort and medium text verbosity, and allows up to 8,192 combined reasoning and answer tokens. The assistant receives only the latest validated question and the allowlisted aggregate dashboard context.

## Vercel deployment

Import the Git repository as a Vercel project and use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `presentation` |
| Install Command | Default, `npm install` |
| Build Command | Default, `npm run build` |
| Output Directory | Default, managed by Next.js |
| Production Branch | The branch containing `presentation`, currently `feat/dashboard` |

The Root Directory is `presentation`, not `root/presentation`. Vercel treats pushes to the Production Branch as Production deployments and pushes to other branches as Preview deployments. Configure branch tracking under **Project Settings → Environments → Production → Branch Tracking**. Vercel describes this behavior in its [Git deployment documentation](https://vercel.com/docs/git#production-branch).

Add these variables under **Project Settings → Environment Variables**:

| Variable | Value | Environments |
| --- | --- | --- |
| `OPENAI_API_KEY` | The restricted OpenAI project key | Production, plus Preview only when chat testing is required there |
| `OPENAI_MODEL` | `gpt-5-mini` | Production, plus Preview when used there |

Environment variable changes apply only to new deployments. Redeploy after adding, changing, or rotating a key. Vercel documents environment scopes and redeployment behavior in its [environment variable guide](https://vercel.com/docs/environment-variables).

Assign a production domain only after a Production deployment reaches **Ready**. Confirm that the deployment metadata shows the expected branch and commit. A Preview deployment from a branch without `presentation/` fails because the configured Root Directory does not exist on that branch.

Verify a new instance after deployment:

1. Open `/` and confirm that the dashboard renders.
2. Ask the assistant a specific factual question and a broad overview question.
3. Ask an unrelated question and confirm that the fixed scope response appears.
4. Check the Vercel function logs for `/api/chat` if the interface reports an error.

## Public endpoint protection

`POST /api/chat` is public and incurs OpenAI usage. The application limits input shape, question length, context fields, and output size, but those controls do not replace infrastructure rate limiting.

In the Vercel project, open **Firewall → Configure** and add a rate-limit rule for request path `/api/chat`. A practical demo setting is 10 requests per minute per source IP with a `429` response after the limit. Adjust the threshold for the expected audience and plan. Vercel provides a dedicated [AI endpoint rate-limiting guide](https://vercel.com/kb/guide/add-rate-limiting-vercel).

Monitor OpenAI project usage and Vercel function logs during public demonstrations. If a key is exposed, create a replacement, update the Vercel environment variable, redeploy, verify the new deployment, and revoke the old key.

## Assistant behavior

The assistant answers only from dashboard content. Broad questions receive a short conversational synthesis of the most relevant themes, outcomes, and trends. Focused questions receive brief factual answers. Unsupported dashboard questions return an insufficient-data response, and unrelated questions return the fixed scope response.

Chat history exists only in browser memory. Closing the panel or reloading the page discards it. The server sends only the latest question to OpenAI and does not persist responses.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Vercel reports that `presentation` does not exist | The deployment used a branch that does not contain the configured Root Directory. Select the correct Git branch. |
| The production domain returns `404: NOT_FOUND` | Confirm that the latest Production deployment is Ready and that the domain is assigned to the Production environment. |
| The assistant reports that it is unavailable | Confirm that `OPENAI_API_KEY` exists in the deployment environment, then redeploy because variable changes do not affect existing deployments. |
| OpenAI rejects the request | Confirm API credit, `gpt-5-mini` model access, project rate limits, and Write permission for `/v1/responses`. |
| A broad question never emits answer text | Confirm that the deployed commit includes the 8,192-token output ceiling and low reasoning effort. |

# GCP IPAM (MVP)

Projeto inicial para um IPAM interno com API serverless e dashboard em React.

## Estrutura
- `api/`: FastAPI com endpoints de alocação e verificação de blocos.
- `dashboard/`: React + MUI para visualizar alocações.

## Rodar localmente

### API
```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

Acesse `http://localhost:5173`.

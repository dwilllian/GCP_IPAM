# Testing log (2026-01-29)

## Commands and outputs

### `cd services/ipam-control-plane && npm install`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

added 18 packages, and audited 362 packages in 11s

70 packages are looking for funding
  run `npm fund` for details

1 moderate severity vulnerability

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

### `cd services/ipam-control-plane && npm run lint`
```
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

> ipam-control-plane@0.1.0 lint
> eslint . --ext .ts
```

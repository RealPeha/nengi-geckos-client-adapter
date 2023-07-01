# [geckos.io](https://github.com/geckosio/geckos.io) client network adapter for nengi v2

> **Warning**
> This adapter is written and tested only on nengi v2.0.0-alpha.133, this is an unstable version, the api of which may change in the future

### Install

```bash
npm i nengi-geckos-client-adapter
```

### Usage

#### Client-side

```ts
import { Client, Context } from "nengi";
import { GeckosClientAdapter } from "nengi-geckos-client-adapter";

const serverTickRate = 20;
const ctx = new Context();
// <...>
const client = new Client(ctx, GeckosClientAdapter, serverTickRate);

await client.connect("http://localhost:9001");
```

Or if you want to pass additional options to the geckos.io client use an alternative connection method:

```ts
const geckosOptions = {};
await(client.adapter as GeckosClientAdapter).connect(
  "http://localhost:9001",
  {}, // handshake
  geckosOptions
);
```

All available client options is described here https://github.com/geckosio/geckos.io#client-1

#### Server-side

For server-side you need [nengi-geckos-server-adapter](https://github.com/RealPeha/nengi-geckos-server-adapter)

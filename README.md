# URL preflight before publishing

Original dependency-free JavaScript example. Run with Node 22.23.3:

```sh
node --test check.test.mjs
node --input-type=module -e "import {check} from './check.mjs'; console.log(check('http://localhost:3000/api/contact', 'https://site.example.invalid/'))"
```

Supply one actual request reference and the page URL against which the browser resolves it. This example performs **no network requests**, does not scan files and never changes a URL. All example domains and values are synthetic.

`LOOPBACK_TARGET` means the URL points to the visitor's own machine. `UNSPECIFIED_TARGET` identifies a listening address that should not be used as the public destination. A server may correctly listen on `0.0.0.0` while the browser must request a public hostname. Do not replace server bind addresses indiscriminately.

`REVIEW_HTTP_TARGET` only parses a URL: it does not prove public DNS, TLS, an existing API, CORS, authentication or successful submission. Relative `/api/contact` stays on the page origin; publishing frontend files alone does not create that backend. A hostname containing the word localhost, such as localhost.example.invalid, is not thereby a loopback hostname. DNS names can still resolve to private addresses; no DNS security guarantee is made.

The result omits origins, paths, credentials and query values. Do not paste production secrets into a shell command. The example covers common localhost/IPv4 loopback/IPv6 ::1 spellings, not every possible private or mapped address. A base URL must be valid when supplied.

References: [MDN URL](https://developer.mozilla.org/en-US/docs/Web/API/URL), [MDN same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy).

Eight Node tests passed. A real Chrome session independently evaluated five URL cases (IPv4 shortened/numeric loopback, IPv6 loopback, relative same-origin and unspecified address), with zero network requests. This proves URL parsing only; no API or rendered application was tested. Independent review, public repository publication and production guide integration remain pending.

## Isolated API diagnostic essay

On macOS with Google Chrome installed at its standard application path, run `node scripts/api-essay.mjs`. It starts two owned loopback HTTP servers and a private headless Chrome profile, then checks a wrong local service, missing 404 route, HTML 200 fallback and intended JSON API using GET only. Processes, servers and temporary files are removed on exit. These synthetic HTTP cases demonstrate diagnostics, not public HTTPS delivery, a deployed Hostbrid backend, successful form submission or inbox receipt.

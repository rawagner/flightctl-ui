# Flight Control UI

Monorepo containing UIs for [flightctl](https://github.com/flightctl/flightctl)

### Prerequisites:
* `git`, `nodejs:18`, `npm:10`, `rsync`

## Building

### Checkout the repo and from within the repo run:

```
npm ci
npm run build
```

## Running

### Copy the flightctl-server certs to proxy the API requests
```
mkdir certs
cat ~/.flightctl/client.yaml | yq '.authentication.client-key-data' | base64 -d > certs/front-cli.key
cat ~/.flightctl/client.yaml | yq '.authentication.client-certificate-data' | base64 -d > certs/front-cli.crt
cat ~/.flightctl/client.yaml | yq '.service.certificate-authority-data' | base64 -d > certs/ca.crt
```

### Running Standalone UI

```
npm run dev
```

### Running UI as OCP plugin

Login to OCP cluster and run:

```
npm run dev:ocp 
```

### (Optional) Configure Keycloak:
- Go to the flightctl Realm clients view like: http://localhost:9080/admin/master/console/#/flightctl/clients
- select the ClientID "flightctl-ui"
- Set the Access settings URLs and redirect URIs for your UI instance
- In the left Menu, go to Users and Create the first one
- Once the user is created, go to its Credentials tab
- Set the user password
- Create the ".env" file with your values like this:
```
# flightctl-ui/.env
KEYCLOAK_AUTHORITY="http://localhost:9080/realms/flightctl"
KEYCLOAK_CLIENTID="flightctl-ui"
KEYCLOAK_REDIRECT="http://localhost:9000"
```
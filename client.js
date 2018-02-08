const WebSocket = require('ws');
const CircularJSON = require('circular-json');
const Request = require('request');
const Commander = require('commander');
const URL = require('url').URL;
const version = require('./package.json').version;

Commander
    .version(version, '-v, --version')
    .option('-s, --secure', 'Use SSL/TLS')
    .option('-n, --name <name>',  'Set application name')
    .option('-r, --remotehost <remotehost:port>', 'Set noncloud server', 'noncloud.herokuapp.com')
    .option('-l, --localhost <localhost:port>',  'Tunnel traffic to this host', 'localhost:80')
    .parse(process.argv);

if (Commander.name && Commander.localhost) {
    const websocketclient = new WebSocket(`ws${Commander.secure ? 's' : ''}://${Commander.remotehost}`);
    websocketclient.once('open', ()=>{
        websocketclient.send(Commander.name);
        websocketclient.on('message', (data)=>{
            const websocketrequest = CircularJSON.parse(data);
            websocketrequest.headers.host = new URL(Commander.localhost).host;
            Request({
                url: websocketrequest.params[0] || '/',
                baseUrl: `http://${Commander.localhost}`,
                method: websocketrequest.method,
                headers: websocketrequest.headers,
                qs: websocketrequest.query,
                body: websocketrequest.body.data && Buffer.from(websocketrequest.body.data)
            }, (error, response, body)=>{
                websocketclient.send(CircularJSON.stringify(response));
            });
        });
    });
}
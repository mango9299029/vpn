// @ts-ignore
import { connect } from 'cloudflare:sockets';

// How to generate your own UUID:
// [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = 'd342d11e-d424-4583-b36e-524ab1f0afa4';

const พร็อกซีไอพีs = ['cdn.xn--b6gac.eu.org', 'cdn-all.xn--b6gac.eu.org', 'workers.cloudflare.cyou'];

// if you want to use ipv6 or single พร็อกซีไอพี, please add comment at this line and remove comment at the next line
let พร็อกซีไอพี = พร็อกซีไอพีs[Math.floor(Math.random() * พร็อกซีไอพีs.length)];
// use single พร็อกซีไอพี instead of random
// let พร็อกซีไอพี = 'cdn.xn--b6gac.eu.org';
// ipv6 พร็อกซีไอพี example remove comment to use
// let พร็อกซีไอพี = "[2a01:4f8:c2c:123f:64:5:6810:c55a]"

let dohURL = 'https://freedns.controld.com/p0'; // https://github.com/serverless-dns/serverless-dns OR xxx.xxx.workers.dev [README.md]

if (!isValidUUID(userID)) {
        throw new Error('uuid is invalid');
}

export default {
        /**
         * @param {import("@cloudflare/workers-types").Request} request
         * @param {{UUID: string, พร็อกซีไอพี: string, DNS_RESOLVER_URL: string, NODE_ID: int, API_HOST: string, API_TOKEN: string}} env
         * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
         * @returns {Promise<Response>}
         */
        async fetch(request, env, ctx) {
                // uuid_validator(request);
                try {
                        userID = env.UUID || userID;
                        พร็อกซีไอพี = env.พร็อกซีไอพี || พร็อกซีไอพี;
                        dohURL = env.DNS_RESOLVER_URL || dohURL;
                        let userID_Path = userID;
                        if (userID.includes(',')) {
                                userID_Path = userID.split(',')[0];
                        }
                        const upgradeHeader = request.headers.get('Upgrade');
                        if (!upgradeHeader || upgradeHeader !== 'websocket') {
                                const url = new URL(request.url);
                                switch (url.pathname) {
                                        case `/cf`: {
                                                return new Response(JSON.stringify(request.cf, null, 4), {
                                                        status: 200,
                                                        headers: {
                                                                "Content-Type": "application/json;charset=utf-8",
                                                        },
                                                });
                                        }
                                        case `/${userID_Path}`: {
                                                const วเลสConfig = getวเลสConfig(userID, request.headers.get('Host'));
                                                return new Response(`${วเลสConfig}`, {
                                                        status: 200,
                                                        headers: {
                                                                "Content-Type": "text/html; charset=utf-8",
                                                        }
                                                });
                                        };
                                        case `/sub/${userID_Path}`: {
                                                const url = new URL(request.url);
                                                const searchParams = url.searchParams;
                                                const วเลสSubConfig = สร้างวเลสSub(userID, request.headers.get('Host'));
                                                // Construct and return response object
                                                return new Response(btoa(วเลสSubConfig), {
                                                        status: 200,
                                                        headers: {
                                                                "Content-Type": "text/plain;charset=utf-8",
                                                        }
                                                });
                                        };
                                        case `/bestip/${userID_Path}`: {
                                                const headers = request.headers;
                                                const url = `https://sub.xf.free.hr/auto?host=${request.headers.get('Host')}&uuid=${userID}&path=/`;
                                                const bestSubConfig = await fetch(url, { headers: headers });
                                                return bestSubConfig;
                                        };
                                        default:
                                                // return new Response('Not found', { status: 404 });
                                                // For any other path, reverse proxy to 'ramdom website' and return the original response, caching it in the process
                                                const randomHostname = cn_hostnames[Math.floor(Math.random() * cn_hostnames.length)];
                                                const newHeaders = new Headers(request.headers);
                                                newHeaders.set('cf-connecting-ip', '1.2.3.4');
                                                newHeaders.set('x-forwarded-for', '1.2.3.4');
                                                newHeaders.set('x-real-ip', '1.2.3.4');
                                                newHeaders.set('referer', 'https://www.google.com/search?q=edtunnel');
                                                // Use fetch to proxy the request to 15 different domains
                                                const proxyUrl = 'https://' + randomHostname + url.pathname + url.search;
                                                let modifiedRequest = new Request(proxyUrl, {
                                                        method: request.method,
                                                        headers: newHeaders,
                                                        body: request.body,
                                                        redirect: 'manual',
                                                });
                                                const proxyResponse = await fetch(modifiedRequest, { redirect: 'manual' });
                                                // Check for 302 or 301 redirect status and return an error response
                                                if ([301, 302].includes(proxyResponse.status)) {
                                                        return new Response(`Redirects to ${randomHostname} are not allowed.`, {
                                                                status: 403,
                                                                statusText: 'Forbidden',
                                                        });
                                                }
                                                // Return the response from the proxy server
                                                return proxyResponse;
                                }
                        } else {
                                return await วเลสOverWSHandler(request);
                        }
                } catch (err) {
                        /** @type {Error} */ let e = err;
                        return new Response(e.toString());
                }
        },
};

export async function uuid_validator(request) {
        const hostname = request.headers.get('Host');
        const currentDate = new Date();

        const subdomain = hostname.split('.')[0];
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        // const daliy_sub = formattedDate + subdomain
        const hashHex = await hashHex_f(subdomain);
        // subdomain string contains timestamps utc and uuid string TODO.
        console.log(hashHex, subdomain, formattedDate);
}

export async function hashHex_f(string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        return hashHex;
}

/**
 * Handles วเลส over WebSocket requests by creating a WebSocket pair, accepting the WebSocket connection, and processing the วเลส header.
 * @param {import("@cloudflare/workers-types").Request} request The incoming request object.
 * @returns {Promise<Response>} A Promise that resolves to a WebSocket response object.
 */
async function วเลสOverWSHandler(request) {
        const webSocketPair = new WebSocketPair();
        const [client, webSocket] = Object.values(webSocketPair);
        webSocket.accept();

        let address = '';
        let portWithRandomLog = '';
        let currentDate = new Date();
        const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
                console.log(`[${currentDate} ${address}:${portWithRandomLog}] ${info}`, event || '');
        };
        const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

        const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

        /** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
        let remoteSocketWapper = {
                value: null,
        };
        let udpStreamWrite = null;
        let isDns = false;

        // ws --> remote
        readableWebSocketStream.pipeTo(new WritableStream({
                async write(chunk, controller) {
                        if (isDns && udpStreamWrite) {
                                return udpStreamWrite(chunk);
                        }
                        if (remoteSocketWapper.value) {
                                const writer = remoteSocketWapper.value.writable.getWriter()
                                await writer.write(chunk);
                                writer.releaseLock();
                                return;
                        }

                        const {
                                hasError,
                                message,
                                portRemote = 443,
                                addressRemote = '',
                                rawDataIndex,
                                วเลสVersion = new Uint8Array([0, 0]),
                                isUDP,
                        } = processวเลสHeader(chunk, userID);
                        address = addressRemote;
                        portWithRandomLog = `${portRemote} ${isUDP ? 'udp' : 'tcp'} `;
                        if (hasError) {
                                // controller.error(message);
                                throw new Error(message); // cf seems has bug, controller.error will not end stream
                        }

                        // If UDP and not DNS port, close it
                        if (isUDP && portRemote !== 53) {
                                throw new Error('UDP proxy only enabled for DNS which is port 53');
                                // cf seems has bug, controller.error will not end stream
                        }

                        if (isUDP && portRemote === 53) {
                                isDns = true;
                        }

                        // ["version", "附加信息长度 N"]
                        const วเลสResponseHeader = new Uint8Array([วเลสVersion[0], 0]);
                        const rawClientData = chunk.slice(rawDataIndex);

                        // TODO: support udp here when cf runtime has udp support
                        if (isDns) {
                                const { write } = await handleUDPOutBound(webSocket, วเลสResponseHeader, log);
                                udpStreamWrite = write;
                                udpStreamWrite(rawClientData);
                                return;
                        }
                        handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, วเลสResponseHeader, log);
                },
                close() {
                        log(`readableWebSocketStream is close`);
                },
                abort(reason) {
                        log(`readableWebSocketStream is abort`, JSON.stringify(reason));
                },
        })).catch((err) => {
                log('readableWebSocketStream pipeTo error', err);
        });

        return new Response(null, {
                status: 101,
                webSocket: client,
        });
}

/**
 * Handles outbound TCP connections.
 *
 * @param {any} remoteSocket 
 * @param {string} addressRemote The remote address to connect to.
 * @param {number} portRemote The remote port to connect to.
 * @param {Uint8Array} rawClientData The raw client data to write.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to pass the remote socket to.
 * @param {Uint8Array} วเลสResponseHeader The วเลส response header.
 * @param {function} log The logging function.
 * @returns {Promise<void>} The remote socket.
 */
async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, วเลสResponseHeader, log,) {

        /**
         * Connects to a given address and port and writes data to the socket.
         * @param {string} address The address to connect to.
         * @param {number} port The port to connect to.
         * @returns {Promise<import("@cloudflare/workers-types").Socket>} A Promise that resolves to the connected socket.
         */
        async function connectAndWrite(address, port) {
                /** @type {import("@cloudflare/workers-types").Socket} */
                const tcpSocket = connect({
                        hostname: address,
                        port: port,
                });
                remoteSocket.value = tcpSocket;
                log(`connected to ${address}:${port}`);
                const writer = tcpSocket.writable.getWriter();
                await writer.write(rawClientData); // first write, nomal is tls client hello
                writer.releaseLock();
                return tcpSocket;
        }

        /**
         * Retries connecting to the remote address and port if the Cloudflare socket has no incoming data.
         * @returns {Promise<void>} A Promise that resolves when the retry is complete.
         */
        async function retry() {
                const tcpSocket = await connectAndWrite(พร็อกซีไอพี || addressRemote, portRemote)
                tcpSocket.closed.catch(error => {
                        console.log('retry tcpSocket closed error', error);
                }).finally(() => {
                        safeCloseWebSocket(webSocket);
                })
                remoteSocketToWS(tcpSocket, webSocket, วเลสResponseHeader, null, log);
        }

        const tcpSocket = await connectAndWrite(addressRemote, portRemote);

        // when remoteSocket is ready, pass to websocket
        // remote--> ws
        remoteSocketToWS(tcpSocket, webSocket, วเลสResponseHeader, retry, log);
}

/**
 * Creates a readable stream from a WebSocket server, allowing for data to be read from the WebSocket.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer The WebSocket server to create the readable stream from.
 * @param {string} earlyDataHeader The header containing early data for WebSocket 0-RTT.
 * @param {(info: string)=> void} log The logging function.
 * @returns {ReadableStream} A readable stream that can be used to read data from the WebSocket.
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
        let readableStreamCancel = false;
        const stream = new ReadableStream({
                start(controller) {
                        webSocketServer.addEventListener('message', (event) => {
                                const message = event.data;
                                controller.enqueue(message);
                        });

                        webSocketServer.addEventListener('close', () => {
                                safeCloseWebSocket(webSocketServer);
                                controller.close();
                        });

                        webSocketServer.addEventListener('error', (err) => {
                                log('webSocketServer has error');
                                controller.error(err);
                        });
                        const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
                        if (error) {
                                controller.error(error);
                        } else if (earlyData) {
                                controller.enqueue(earlyData);
                        }
                },

                pull(controller) {
                        // if ws can stop read if stream is full, we can implement backpressure
                        // https://streams.spec.whatwg.org/#example-rs-push-backpressure
                },

                cancel(reason) {
                        log(`ReadableStream was canceled, due to ${reason}`)
                        readableStreamCancel = true;
                        safeCloseWebSocket(webSocketServer);
                }
        });

        return stream;
}

// https://xtls.github.io/development/protocols/วเลส.html
// https://github.com/zizifn/excalidraw-backup/blob/main/v2ray-protocol.excalidraw

/**
 * Processes the วเลส header buffer and returns an object with the relevant information.
 * @param {ArrayBuffer} วเลสBuffer The วเลส header buffer to process.
 * @param {string} userID The user ID to validate against the UUID in the วเลส header.
 * @returns {{
 *  hasError: boolean,
 *  message?: string,
 *  addressRemote?: string,
 *  addressType?: number,
 *  portRemote?: number,
 *  rawDataIndex?: number,
 *  วเลสVersion?: Uint8Array,
 *  isUDP?: boolean
 * }} An object with the relevant information extracted from the วเลส header buffer.
 */
function processวเลสHeader(วเลสBuffer, userID) {
        if (วเลสBuffer.byteLength < 24) {
                return {
                        hasError: true,
                        message: 'invalid data',
                };
        }

        const version = new Uint8Array(วเลสBuffer.slice(0, 1));
        let isValidUser = false;
        let isUDP = false;
        const slicedBuffer = new Uint8Array(วเลสBuffer.slice(1, 17));
        const slicedBufferString = stringify(slicedBuffer);
        // check if userID is valid uuid or uuids split by , and contains userID in it otherwise return error message to console
        const uuids = userID.includes(',') ? userID.split(",") : [userID];
        // uuid_validator(hostName, slicedBufferString);


        // isValidUser = uuids.some(userUuid => slicedBufferString === userUuid.trim());
        isValidUser = uuids.some(userUuid => slicedBufferString === userUuid.trim()) || uuids.length === 1 && slicedBufferString === uuids[0].trim();

        console.log(`userID: ${slicedBufferString}`);

        if (!isValidUser) {
                return {
                        hasError: true,
                        message: 'invalid user',
                };
        }

        const optLength = new Uint8Array(วเลสBuffer.slice(17, 18))[0];
        //skip opt for now

        const command = new Uint8Array(
                วเลสBuffer.sl

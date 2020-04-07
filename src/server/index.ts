import { createServer, Server as NodeHttpServer, ServerOptions as NodeHttpServerOptions, IncomingMessage, ServerResponse, IncomingHttpHeaders, OutgoingHttpHeaders, OutgoingMessage } from "http";
export type HttpServerOptions = NodeHttpServerOptions & {
    displayName?: string, server?: NodeHttpServer, hostname?: string, verbose?: boolean, logger?: Function,
    useBufferToSend?: boolean
};
export type Method = 'get' | 'post' | 'put' | 'delete' | 'head' | 'patch' | 'options' | string;
export type NextFunction = (error?: any) => void;
const ROUTER_SYMBOLS = {
    QUERY_PARAMETER: Symbol('QUQERY_PARAMETER'),
    STATIC_SERVE: Symbol('STATIC'),
    ANY:  Symbol('ANY')
}
// const QUERY_PARAMETER = Symbol('QUQERY_PARAMETER');
// {
//     get: {
//         routes: {
//             api: {
//                 handlers:[],
//                 routes:{
//                     users: {
//                         routes: {
//                             [QUERY_PARAMETER]:{
//                                 routes: {
//                                     cars: {
//                                         routes: {
//                                             [QUERY_PARAMETER]: {
//                                                 routeDeclaration: '/api/users/:id/cars/:carId',
//                                                 handlerPool:[function(req, res, next){ parseQueryParameter(req.url, '/api/users/:id/cars/:carId'); next(); }, /* ...UDHandlers de: app.get('', UDHandlers) */]
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }

interface File {

}
interface Files extends Array<File> {
    
}
export interface Request {
    headers(): IncomingHttpHeaders;
    rawHeaders(): Array<string>;
    rawBody(): string;
    files(): Files;
    file(name: string): File;
    body?: any;
    params?: any;
    query?: any;
    _msg: IncomingMessage;
}
export interface Response {
    send(responseBody?: any);
    headers(): OutgoingHttpHeaders;
    status(number): Response;
    status(): number;
    send(data: any): Response;
    json(data: any): Response;
    xml(data: any): Response;
    appendHeader(key: string, value: string): Response;
    appendHeader(keyValue: string): Response;
    sent(): boolean
}
type ErrorHandlingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => void;
type CommonMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type Middleware = CommonMiddleware | ErrorHandlingMiddleware;
interface IHandlerMapping {
    middlewares: Array<Middleware>;
};
interface PreRouteHandlers extends Array<Middleware> {

}
type HandlerMappings = { [id: string]: IHandlerMapping };
function defaultHandler(_: Request, res: Response) {
    res.status(404).send();
}
function generateMatcherForRoute(routeDefinition: string){
    return new RegExp('^'+routeDefinition
    .replace(/\/*$/,'')//removes the '/' at the end of the route definition
    .replace(/\/\/+/g,'/')//remove all additional adjacent '/'
    .replace(/^([^\/*].+)/, '/$1')//adds a '/' at the beginning of the route definition
    .replace(/\*+/g, '.+')//transforms all '*' into a match for anything
    .replace(/\//g, '\\/')//transforms all '/ into a matcher for it
    .replace(/\/:([^\/]+)/g, '\/(.+)')+'\\/?$');//transforms :field into a matcher for it
}
export class Router {
    private parameters: 
}
export default class Server {
    private http: NodeHttpServer;
    private options: HttpServerOptions;
    private port: number;
    private handlerMappings: HandlerMappings = {};
    private preRouteHandlers: PreRouteHandlers = Array();
    private state: string = 'created';
    constructor(port: number | string, options: HttpServerOptions) {
        this.options = options || {};
        const { server = createServer(options, this.requestListener) } = options;
        this.http = server;
        if (server.listening) this.state = 'listening';
        this.port = parseInt(`${port}`);
        server.prependOnceListener('request', (...args) => {
            this.log('new request', ...args);
        });
        this.http.on('connection', (socket) => {
            const { verbose } = this.options;
            this.log('new connection', socket.remoteFamily, socket.remoteAddress, socket.remotePort);
        });
        this.http.on('close', (...args) => {
            const { verbose } = this.options;
            this.log('client disconnected', args);
            this.state = 'stoped';

        });
        this.http.on('error', (error) => {
            this.log('error', error);
        });
        this.http.on('listening', (...args) => {
            this.log('is now listening...');
            this.state = 'listening';
        });
    }
    private requestListener(...args) {
        ((req: IncomingMessage, res: ServerResponse) => {
            const handlerMap = this.handlerMappings[req.method];
            const middlewares = [...this.preRouteHandlers];
            let current = -1;
            const request = {
                headers: () => req.headers,
                rawHeaders: () => req.rawHeaders,

            } as Request;
            var sent = false;
            const response = {
                sent: () => sent,
                send: (data) => {
                    if (typeof data !== 'string' && res.getHeader('content-type').toString().match(/^.+\..*json.*$/)) return response.json(data);
                    if (typeof data !== 'string' && res.getHeader('content-type').toString().match(/^.+\..*xml.*$/)) return response.xml(data);
                    const { useBufferToSend = false } = this.options;
                    if (useBufferToSend) {
                        const buffer = new Buffer(data);
                        res.setHeader('Content-Length', buffer.length);
                        res.write(buffer);
                    }
                    else {
                        res.setHeader('Content-Length', data.length);
                        res.write(data);
                    }
                    res.end(() => {
                        sent = true;
                    })
                    return response;
                },
                json: (data) => {
                    try {
                        if (data === null || data === undefined) {
                            data = '';
                        }
                        else {
                            const prototype = Object.getPrototypeOf(data);
                            const dataType = typeof data;
                            if ((dataType === 'object' || dataType === 'string' || prototype === Date.prototype)) {
                                data = JSON.stringify(data);
                            }
                            else if (dataType === 'boolean') {
                                data = `${JSON.stringify(data)}`;
                            }
                            else if (dataType === 'bigint') {
                                data = `${(data as bigint).toString()}`
                            }
                            else if (typeof data === 'number') {
                                if (isNaN(data)) {
                                    data = ''
                                }
                                else {
                                    data = `${data}`;
                                }
                            }
                            else data = '';
                        }
                    } catch (e) {
                        data = '';
                    }
                    response.send(data);
                    return response;
                },
                xml: (data) => { throw new Error('Not implemented'); return response; },
                appendHeader: (...args) => {
                    if (args.length >= 2) {
                        if (res.hasHeader(args[0])) {
                            res.removeHeader(args[0]);
                        }
                        res.setHeader(args[0], args[1]);
                    }
                    else if (args.length === 1) {
                        if (/:/.test(args[0])) {
                            const split = args[0].split(':');
                            return response.appendHeader(split[0], split.slice(1).join(':'));
                        }
                    }
                    return response;
                }
            } as Response;
            async function next(err?: any) {
                current++;
                const handler = handlerMap.middlewares[current];
                if (handler.length === 4) {
                    await (handler as ErrorHandlingMiddleware)(err, request, response, next);
                }
                else await (handler as CommonMiddleware)(request, response, next);
            }
            next().catch(e => { console.error(e); })
            res.end();
        })(args[0], args[1]);
    }
    private log(...args) {
        let { verbose, logger = console.log, displayName = 'HttpServer' } = this.options;
        if (verbose && typeof logger !== 'function') logger = console.log;
        logger(displayName, ...args);
    }
    listen(callback?: (port: number, hostname: string, options: HttpServerOptions) => void) {
        let { hostname = '0.0.0.0' } = this.options;
        if (this.state === 'listening' || this.state === 'trying-to-listen') {
            throw new Error('Server is already listening!');
        }
        this.state = 'trying-to-listen';
        this.http.listen(this.port, hostname, () => {
            this.log(`We are live on http://127.0.0.1:${this.port}/`);
            if (typeof callback === 'function') callback(this.port, hostname, this.options);
        });
    }
    stop(callback?: (err: Error) => void) {
        this.http.close(callback);
    }
    private initializeHandlerMapping(method: string) {
        if (!(method in this.handlerMappings)) {
            //this.handlerMappings[method] = [];
        }
    }
    all(...args) {
        this.head(...args);
        this.get(...args);
        this.post(...args);
        this.put(...args);
        this.patch(...args);
        this.delete(...args);
    }
    head(arg0,...args) {
        this.initializeHandlerMapping('head');
        if (typeof arg0 === 'string') {
            
        }
        else if(typeof arg0 === 'function'){

        }
    }
    get(...args) {
        this.initializeHandlerMapping('get');
        if (typeof args[0] === 'string') {

        }
    }
    put(...args) {
        this.initializeHandlerMapping('put');
        if (typeof args[0] === 'string') {

        }
    }
    post(...args) {
        this.initializeHandlerMapping('post');
        if (typeof args[0] === 'string') {

        }
    }
    delete(...args) {
        this.initializeHandlerMapping('delete');
        if (typeof args[0] === 'string') {

        }
    }
    patch(...args) {
        this.initializeHandlerMapping('patch');
        if (typeof args[0] === 'string') {

        }
    }
}
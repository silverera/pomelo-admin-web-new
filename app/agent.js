const Nacos = require('./nacos');
const logger = require('pomelo-logger').getLogger('pomelo');
const admin = require("pomelo-admin");
const servers = require('../config/servers.json');
const config = require('../config/config.json');

class Agent {
    constructor(server) {
        this.server = server;
        this.adminClient = null;
        this.adminServers = [];
        if (config.nacos) {
            this.nacos = new Nacos(this);
        } else {
            this.adminServers = servers;
        }
    }

    async start() {
        if (this.nacos) {
            await this.nacos.start();
        }

        try {
            const io = require('socket.io')(this.server);
            io.on('connection', socket => {
                socket.emit('connect', {hello: 'world'});

                socket.on('register', msg => {
                    //{"type":"client","id":"browser-1493706728889","username":"monitor","password":"monitor","md5":false}
                    logger.debug('register %j', JSON.stringify(msg));
                    this.registerInfo = msg;
                });

                socket.on('client', req => {
                    // 控制台打印连接信息
                    logger.debug("socket:" + req)
                    this.handleModuleReq(req, socket);
                });

                socket.on('list servers', msg => {
                    io.emit("list servers", this.adminServers);
                    if (this.isConnected(this.adminClient)) {
                            io.emit("connected server", {host: this.adminClient.socket.host,
                                port: this.adminClient.socket.port});
                    }
                })

                socket.on('connect server', msg => {
                    if (this.isConnected(this.adminClient)) {
                        this.adminClient.socket.disconnect();
                    }

                    this.adminClient = new admin.adminClient({
                        username: config['pomelo-admin'].username,
                        password: config['pomelo-admin'].password
                    })

                    this.adminClient.connect(this.registerInfo.id, msg.host, msg.port, err => {
                        if (err) {
                            console.log(err);
                        }
                        io.emit('connect server', msg);
                    })

                    this.adminClient.on('close', () => {
                        // socket.adminClient = null;
                        logger.debug('disconnect from master %s:%s', this.adminClient.socket.host,
                            this.adminClient.socket.port);
                    });

                    this.adminClient.on('error', err => {
                        logger.error('socket is error %j', err);
                    });
                })
            });
        } catch (e) {

        }
    }

    isConnected(adminClient) {
        return adminClient && adminClient.socket.connected;
    }

    /**
     * 处理模块请求
     * @param req
     * @param socket
     */
    handleModuleReq(req, socket) {
        if (!this.isConnected(this.adminClient)) {
            return;
        }

        req = JSON.parse(req);
        //ep.emit('req_socket',socket);
        if (!!req.reqId) {
            this.adminClient.request(req.moduleId, req.body, (err, data, msg) => {
                const resp = {
                    respId: 0,
                    body: ''
                }
                resp.respId = req.reqId;
                resp.body = data;
                socket.emit('client', JSON.stringify(resp));
            })
        } else {
            this.adminClient.notify(req.moduleId, req.body);
        }
        // if (req.moduleId === 'scripts') {
        //     this.adminClient.request(req.moduleId, req.body, (err, data, msg) => {
        //         const resp = {
        //             respId: 0,
        //             body: ''
        //         }
        //         resp.respId = req.reqId;
        //         resp.body = data;
        //         socket.emit('client', JSON.stringify(resp));
        //     })
        // } else {
        //     this.adminClient.request(req.moduleId, req.body, (err, data, msg) => {
        //         //ep.emit('req_data',data);
        //         const resp = {
        //             respId: 0,
        //             body: ''
        //         }
        //         resp.respId = req.reqId;
        //         resp.body = data;
        //         socket.emit('client', JSON.stringify(resp));
        //     });
        // }
    }
}

module.exports = Agent;
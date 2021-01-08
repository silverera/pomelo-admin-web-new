const NacosNamingClient = require('nacos-node').NacosNamingClient;
const NacosConfigClient = require('nacos-node').NacosConfigClient;
const nacosConfig = require('../config/nacos.json');
const logger = require('pomelo-logger').getLogger('pomelo');

class Nacos {
    constructor(agent) {
        this.agent = agent;
    }

    async start() {
        const nacosLogger = require('pomelo-logger').getLogger('nacos');
        this.namingClient = new NacosNamingClient({
            logger: nacosLogger,
            serverList: nacosConfig.servers,
            namespace: nacosConfig.namespace || 'public',
            username: nacosConfig.username || '',
            password: nacosConfig.password || ''
        });
        await this.namingClient.ready();

        this.namingClient.subscribe('master', hosts => {
            logger.debug(`=====>>>>>${hosts.length}`);
            logger.debug('%j', hosts);
            this.agent.adminServers = hosts;
        });
    }
}

module.exports = Nacos;
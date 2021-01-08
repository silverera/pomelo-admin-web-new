Ext.require('Ext.chart.*');
Ext.onReady(function(){

    Ext.BLANK_IMAGE_URL ='../ext-4.0.7-gpl/resources/themes/images/default/tree/s.gif';

    var serversStore = Ext.create('Ext.data.Store', {
        id:'reqStoreId',
        autoLoad:false,
        pageSize:5,
        fields:['serverId', 'serverIP'],
        proxy: {
            type: 'memory',
            reader: {
                type: 'json',
                root: 'requests'
            }
        }
    });

    /**
     * gridPanel,detail message
     */
    var serversGrid=Ext.create('Ext.grid.Panel', {
        id:'serversGridId',
        region:'center',
        store: serversStore,
        columns:[
            // {header:'source',dataIndex:'source',width:150},
            {xtype:'rownumberer',width:40,sortable:false},
            {text:'ip',width:130,dataIndex:'ip'},
            {text:'port',width:130,dataIndex:'port'},
            {text:'serverId',width:130,dataIndex:'serverId'},
        ],
        tbar:[
            {
                xtype:'button',
                text:'refresh',
                handler:refresh
            },
            {
                xtype:'button',
                text:'connect',
                handler:connect
            }
        ]
    });
    var viewport=new Ext.Viewport({
        layout:'border',
        items:[{
            region:'north',
            height:30,
            contentEl:serversInfo
        }, serversGrid]
    });
    refresh();
});

function refresh(){
    window.parent.client.socket.emit('list servers');
    window.parent.client.socket.on('list servers', msg=> {
        const list = [];
        for(const item of msg){
            const ip = item.ip || item.host;
            list.push({
                ip: ip,
                port: item.port,
                serverId: item.metadata && item.metadata.id ||
                    `master-server-${ip}:${item.port}`,
            });
        }
        const store = Ext.getCmp('serversGridId').getStore();
        store.loadData(list);
    });
    window.parent.client.socket.on('connected server', msg => {
        document.getElementById("connectedServer").innerHTML = msg.host + ":" + msg.port;
    });
}

function connect() {
    const data = Ext.getCmp('serversGridId').getSelectionModel().getSelection()[0].data
    window.parent.client.socket.emit('connect server', {host: data.ip, port: data.port});
    window.parent.client.socket.on('connect server', msg => {
        document.getElementById("connectedServer").innerHTML = msg.host + ":" + msg.port;
    });
}
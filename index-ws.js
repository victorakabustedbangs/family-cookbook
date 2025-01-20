const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', function(req, res) {
    res.sendFile('index.html', {root: __dirname});
});

server.on('request', app);
server.listen(3000, function () {console.log("Server started on port 3000");});

/* this is the 'CTRL+C', and SIGINT is a signal interrupt */
process.on('SIGINT', () => {
    console.log('sigint');
    /* Ran into error: We never closed our web socket connection hence our sigint never worked. */
    wss.clients.forEach(function each(client) {
        client.close();
    });
    server.close(() => {
        shutdownDB();
    }); 
});

/** begin websocket */
const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({server:server});

/** Handling states of the websocket (on, off, error) */
wss.on('connection', function connection(ws) {
    const numClients = wss.clients.size;
    console.log('Clients connected', numClients);
    wss.broadcast(`Current visitors ${numClients}`);

    if (ws.readyState === ws.OPEN) {
        ws.send('Welcome to my server');
    };

    db.run(`INSERT INTO visitors (count, time)
            VALUES (${numClients}, datetime('now'))
        `);


    ws.on('close', function close() {
        wss.broadcast(`Current visitors ${numClients}`);
        console.log('A client has disconnected');
    })
})
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    }); 
}

/* end websockets */ 

/* begin database */
const sqlite = require('sqlite3'); 
const db = new sqlite.Database(':memory:'); 
/* Can also save to a file by changing line 40: ... new sqlite.Database('./fsfe.db'); */

/* set up a table */
db.serialize(() => {
    /* We now need to create a table called visitors with two fields and it's types count, and time */
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT 
        )
    `)

});

/* we're going to create a shorthand function so I don't have to repeat SQL queries over and over */

function getCounts() {
    /* we want the output of every single row, we want to know how many visitors
     at every single time interval, so we can use .each() is gonna say every row, do something */
    db.each("SELECT * FROM visitors", (err, row) => {
        console.log(row);
    })
}

function shutdownDB() {
    getCounts(); 
    console.log("Shutting down db");
    db.close(); 
}
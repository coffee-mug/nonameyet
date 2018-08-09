const http = require('http')
const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')


const STATIC_FOLDER = "/"

const server = new http.createServer((req, res) => {
    var sendThrough;
    switch(true){
        case req.url === "/":
            sendThrough = fs.createReadStream('./index.html')
            sendThrough.pipe(res)
            break;
        case /\.css$|\.js$|\.html$/.test(req.url):
            try {
                var lookPath = path.join(__dirname, STATIC_FOLDER, req.url.split('/').slice(-1)[0])
                console.log("Lookign for file at %s", lookPath)
                sendThrough = fs.createReadStream(lookPath)
                sendThrough.pipe(res)
                break;
            } catch (e) {
                console.error(e)
                res.statusCode =  500
                res.end()
            }
        default:
            res.statusCode = 404
            res.end()

    }
    console.log(req.url)
})
const wss = new WebSocket.Server({server})

let lastReceived = Date.now();

wss.on('connection', function connection(ws){
    console.log("YOLOO new conn")
    ws.on('message', function incoming(message){
        // naive request rate limiting
        if (lastReceived && (Date.now() - lastReceived) > 5 * 1000) {
            console.log('A new video to share has been received %s', message)

            wss.clients.forEach( (client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message)
                }
            })
        }
        lastReceived = Date.now()
    })
})

server.listen(8000)

module.exports = () => server
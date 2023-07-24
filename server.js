const express = require("express");
const ws = require('ws');

const app = express();

const port = 8000;

const server = app.listen(port, () => {
  console.log(
    `##### server is running on http://localhost:8000. ${new Date().toLocaleString()} #####`
  );
});

app.use("/", (req, res)=>{ 
    res.sendFile('index.html', { root: __dirname }) 
});

const webSocketServer = new ws.Server( 
    {
        server: server,
    }
);

webSocketServer.on('connection', (ws, request)=>{

    // 1) 연결 클라이언트 IP 취득
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    
    console.log(`새로운 클라이언트[${ip}] 접속`);
    
    // 2) 클라이언트에게 메시지 전송
    if(ws.readyState === ws.OPEN){ // 연결 여부 체크
        ws.send(`클라이언트[${ip}] 접속을 환영합니다 from 서버`); // 데이터 전송
    }
    
    // 3) 클라이언트로부터 메시지 수신 이벤트 처리
    ws.on('message', (msg)=>{
        console.log(`클라이언트[${ip}]에게 수신한 메시지 : ${msg}`);
        ws.send('메시지 잘 받았습니다! from 서버')
    })
    
    // 4) 에러 처러
    ws.on('error', (error)=>{
        console.log(`클라이언트[${ip}] 연결 에러발생 : ${error}`);
    })
    
    // 5) 연결 종료 이벤트 처리
    ws.on('close', ()=>{
        console.log(`클라이언트[${ip}] 웹소켓 연결 종료`);
    })
});
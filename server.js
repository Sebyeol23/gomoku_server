const express = require("express");
const ws = require('ws');

const app = express();

const port = 8000;

const gameRooms = {};

const server = app.listen(port, () => {
  console.log(
    `##### server is running on https://port-0-gomoku-server-cu6q2blkgm7b0f.sel4.cloudtype.app. ${new Date().toLocaleString()} #####`
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
        ws.send(JSON.stringify({type: "msg", msg: `클라이언트[${ip}] 접속을 환영합니다 from 서버`})); // 데이터 전송
    }
    
    // 3) 클라이언트로부터 메시지 수신 이벤트 처리
    ws.on('message', (msg)=>{
        console.log(`${msg} 메시지를 수신하였습니다`);
        const data = JSON.parse(msg);
        console.log(`data => ${data}`);
        console.log(`data type => ${data.type}`);
        switch (data.type) {
        case 'create_room':
            createRoom(ws);
            break;
        case 'join_room':
            joinRoom(ws, data.roomId);
            break;
        case 'game_move':
            handleGameMove(ws, data);
            break;
        // 다른 타입의 메시지 처리...
        }
    })
    
    // 4) 에러 처러
    ws.on('error', (error)=>{
        console.log(`클라이언트[${ip}] 연결 에러발생 : ${error}`);
    })
    
    // 5) 연결 종료 이벤트 처리
    ws.on('close', ()=>{
        removePlayerFromRoom(ws);
        console.log(`클라이언트[${ip}] 웹소켓 연결 종료`);
    })
});

function createRoom(ws) {
    const roomId = Math.random().toString(36).substr(2, 5);
    const room = {
      id: roomId,
      player1: ws,
      player2: null,
      gameStarted: false,
      currentPlayer: 'Black',
      // 게임 로직과 상태를 추가로 구현...
    };
    gameRooms[roomId] = room;
  
    ws.send(JSON.stringify({ type: 'room_created', roomId }));
  }
  
  function joinRoom(ws, roomId) {
    const room = gameRooms[roomId];
    if (room && !room.gameStarted && !room.player2) {
      room.player2 = ws;
      ws.send(JSON.stringify({ type: 'joined_room', roomId }));
      room.player1.send(JSON.stringify({ type: 'player_joined' }));
      startGame(roomId);
    } else {
      ws.send(JSON.stringify({ type: 'join_failed' }));
    }
  }
  
  function removePlayerFromRoom(ws) {
    for (const roomId in gameRooms) {
      const room = gameRooms[roomId];
      if (room.player1 === ws) {
        if (room.player2) {
          room.player2.send(JSON.stringify({ type: 'opponent_left' }));
        }
        delete gameRooms[roomId];
      } else if (room.player2 === ws) {
        room.player1.send(JSON.stringify({ type: 'opponent_left' }));
        room.player2 = null;
        room.gameStarted = false;
      }
    }
  }
  
  // 게임 로직 관련 함수 구현...
  // 이동, 승리 조건 등을 처리합니다.
  
  // 게임 시작
  function startGame(roomId) {
    const room = gameRooms[roomId];
    if (room && room.player1 && room.player2) {
      room.gameStarted = true;
      room.player1.send(JSON.stringify({ type: 'game_start', currentPlayer: room.currentPlayer }));
      room.player2.send(JSON.stringify({ type: 'game_start', currentPlayer: room.currentPlayer }));
    }
  }
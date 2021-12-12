const io = require("socket.io")(3000, {
  cors: {
    origin: "*",
  },
});
console.log("start");
type User = {
  userId: string | null;
  displayName: string | null;
  photoURL: string | null;
  side: string;
};
type Room = {
  roomId: string;
  players: User[];
  gameStarted: boolean;
  currentTurn: string;
  board: Array<any>;
};
let rooms: Record<string, Room> = {};

function addPlayerToRoom(roomdId: string, user: User) {
  //Check if player is in room
  let playerInRoom = false;
  rooms[roomdId].players.map((player) => {
    if (player.userId === user.userId) playerInRoom = true;
  });
  if (typeof user.side === "undefined") user.side = "";
  if (!playerInRoom) rooms[roomdId].players.push(user);
}

function findUserBySide(roomId: string, findNextTurn: boolean): User {
  let turn: User;
  rooms[roomId].players.map((p) => {
    if (findNextTurn) {
      if (rooms[roomId].currentTurn !== p.side) {
        turn = p;
      }
    } else {
      if (rooms[roomId].currentTurn === p.side) {
        turn = p;
      }
    }
  });
  return turn;
}
function clearEmptyRooms(){
  Object.keys(rooms).map(r=>{
    if(rooms[r].players.length===0) delete rooms[r]
  })

}

io.on("connection", (socket: any) => {
  console.log("connected", socket.id);
  socket.on("get-rooms", () => {
    clearEmptyRooms()
    socket.emit("available-rooms", rooms);
  });
  socket.on("disconnect", (m: any) => console.log("room closed"));
  socket.on("create-room", () => {
    rooms[socket.id] = {
      roomId: socket.id,
      players: [],
      gameStarted: false,
      currentTurn: "king",
      board: [],
    };
    socket.emit("room-created", socket.id, rooms[socket.id]);
  });
  socket.on("join-room", (roomId: string, user: User) => {
    if (rooms[roomId]) {
      addPlayerToRoom(roomId, user);
      let currentTurn = findUserBySide(roomId, false);

      socket.join(roomId);
      io.to(roomId).emit(
        "joined-room",
        rooms[roomId].players,
        rooms[roomId].board,
        rooms[roomId].gameStarted,
        currentTurn
      );
    } else {
      socket.emit("room-closed");
    }
  });
  socket.on("get-room-info", (roomId) => {
    io.to(roomId).emit("room-info", rooms[roomId].players);
  });

  socket.on("select-side", (side: string, playerId: string, roomId: string) => {
    rooms[roomId].players.map((player) => {
      if (player.userId === playerId) {
        player.side = side;
      }
    });
    io.to(roomId).emit("joined-room", rooms[roomId].players);
  });

  socket.on(
    "start-game",
    (roomId: string, firstMove: string, board: Array<any>) => {
      console.log(rooms[roomId]);
      rooms[roomId].gameStarted = true;
      rooms[roomId].board = [...board];
      let firstMoveBy: User;
      rooms[roomId].players.map((p) => {
        if (firstMove == p.side) {
          rooms[roomId].currentTurn = firstMove;
          firstMoveBy = p;
        }
      });
      io.to(roomId).emit("game-started", firstMoveBy,board);
    }
  );
  socket.on("update-board", (board, id: string, victory: boolean) => {

    let nextTurn = findUserBySide(id, !victory);
    rooms[id].currentTurn = nextTurn.side;
    rooms[id].board = [...board];
    io.to(id).emit("board-updated", board, nextTurn,victory);
    if(victory) delete rooms[id]
  });
  socket.on("restart-game",(roomId:string,users:User[],board: Array<any>)=>{
    rooms[roomId] = {
      roomId: roomId,
      players: users,
      gameStarted: true,
      currentTurn: "king",
      board: board,
    }
    let nextTurn = findUserBySide(roomId, false);
    io.to(roomId).emit("board-updated", board,nextTurn,false,true);

  })
});

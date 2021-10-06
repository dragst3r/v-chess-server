const io = require("socket.io")(3000, {
  cors: {
    origin: ["http://localhost:3001"],
  },
});
console.log("start2");
type User = {
  id: string;
  side: string;
};
type Room = {
  roomId: string;
  players: User[];
};
let rooms: Room[] = [];

function addPlayerToRoom(id: string, player: User) {
  for (let i = 0; i <= rooms.length; i++) {
    if (rooms[i].roomId === id) {
      rooms[i].players.push(player);
      break;
    }
  }
}

function checkIfRoomsIsOpen(id:string):boolean{
  let roomFound = false
  rooms.map(r=>{if(r.roomId===id){
    roomFound =  true
  }})
  return roomFound
}
io.on("connection", (socket: any) => {
  socket.on("get-rooms", () => {
    socket.emit("available-rooms", rooms);
  });
  socket.on("disconnect", (m: any) => console.log("room closed"));
  socket.on("create-room", () => {
    rooms.push({ roomId: socket.id, players: [] });
    socket.emit("room-created", socket.id, rooms[socket.id]);
  });
  socket.on("join-room", (roomId: string, userId: string) => {
    if (checkIfRoomsIsOpen(roomId)) {
      addPlayerToRoom(roomId, { id: userId, side: "" });
      socket.join(roomId);
      socket.emit("joined-room", rooms[roomId]);
    } else {
      socket.emit("room-closed");
    }
  });
});

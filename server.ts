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

io.on("connection", (socket: any) => {
  console.log("connected", socket.id);
  socket.on("get-rooms", () => {
    socket.emit("available-rooms", rooms);
  });
  socket.on("disconnect", (m: any) => console.log("room closed"));
  socket.on("create-room", () => {
    rooms[socket.id] = { roomId: socket.id, players: [] };
    socket.emit("room-created", socket.id, rooms[socket.id]);
  });
  socket.on("join-room", (roomId: string, user: User) => {
    console.log("new join room");
    if (rooms[roomId]) {
      addPlayerToRoom(roomId, user);
      socket.join(roomId);
      console.log("joined room", rooms[roomId].players);
      io.to(roomId).emit("joined-room", rooms[roomId].players);
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
});

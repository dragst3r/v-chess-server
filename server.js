var io = require("socket.io")(3000, {
    cors: {
        origin: ["http://localhost:3001"],
    },
});
console.log("start");
var rooms = [];
function addPlayerToRoom(id, player) {
    for (var i = 0; i <= rooms.length; i++) {
        if (rooms[i].roomId === id) {
            rooms[i].players.push(player);
            break;
        }
    }
}
function checkIfRoomsIsOpen(id) {
    var roomFound = false;
    rooms.map(function (r) {
        if (r.roomId === id) {
            roomFound = true;
        }
    });
    return roomFound;
}
io.on("connection", function (socket) {
    socket.on("get-rooms", function () {
        console.log(rooms);
        socket.emit("available-rooms", rooms);
    });
    socket.on("disconnect", function (m) { return console.log("room closed"); });
    socket.on("create-room", function () {
        console.log("room created");
        rooms.push({ roomId: socket.id, players: [] });
        socket.emit("room-created", socket.id, rooms[socket.id]);
    });
    socket.on("join-room", function (roomId, userId) {
        if (checkIfRoomsIsOpen(roomId)) {
            console.log('there is room');
            addPlayerToRoom(roomId, { id: userId, side: "" });
            socket.join(roomId);
            socket.emit("joined-room", rooms[roomId]);
        }
        else {
            socket.emit("room-closed");
        }
    });
});
//# sourceMappingURL=server.js.map
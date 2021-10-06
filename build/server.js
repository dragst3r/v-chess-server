"use strict";
var io = require("socket.io")(3000, {
    cors: {
        origin: ["http://localhost:3001"],
    },
});
console.log("start");
var rooms = {};
io.on("connection", function (socket) {
    console.log(io.sockets.adapter.rooms);
    socket.emit("available-rooms", io.sockets.adapter.rooms);
    socket.on("disconnect", function (m) { return console.log(m); });
    socket.on("create-room", function () {
        rooms[socket.id] = [];
        socket.emit("room-created", socket.id, rooms[socket.id]);
    });
    socket.on("join-room", function (roomId, userId) {
        if (rooms[roomId]) {
            rooms[roomId].push({ id: userId, side: "" });
            socket.join(roomId);
            socket.emit("joined-room", rooms[roomId]);
        }
        else {
            socket.emit("room-closed");
        }
    });
});

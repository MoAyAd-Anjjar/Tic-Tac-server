const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow connections from anywhere
});

let board = Array(9).fill(""); // Game board
let turn = "X"; // Track turn
let players = {}; // Store connected players

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    // Assign "X" or "O" to the players
    if (!players.X) {
        players.X = socket.id;
        socket.emit("assign", "X");
    } else if (!players.O) {
        players.O = socket.id;
        socket.emit("assign", "O");
    } else {
        socket.emit("full");
        socket.disconnect();
        return;
    }

    // Send current game state to the new player
    socket.emit("updateBoard", { board, turn });

    // Handle player's move
    socket.on("makeMove", (data) => {
        if (players[turn] === socket.id && board[data.index] === "") {
            board[data.index] = turn;
            turn = turn === "X" ? "O" : "X";
            io.emit("updateBoard", { board, turn });
        }
    });

    // Handle game reset
    socket.on("reset", () => {
        board = Array(9).fill("");
        turn = "X";
        io.emit("updateBoard", { board, turn });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("A player disconnected:", socket.id);
        if (players.X === socket.id) delete players.X;
        if (players.O === socket.id) delete players.O;
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));

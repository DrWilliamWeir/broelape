const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { start } = require('repl');

const app = express();
const server = http.createServer(app);
const io = socketio(server); 

const port = process.env.PORT || 3000;

server.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));

// Set static folder
app.use(express.static(path.join(__dirname, '../public')));


// For amerikaner
const gameMembers = 2;
const gameRooms = [];
const gameState = ["waiting", "bidding", "choose trump", "first round", "play card", "last round"];
const numberDeck = [];
for (let i = 0; i < 52; i++) {
  numberDeck.push(i);
};


// When client connects
io.on("connection", socket => {

  socket.on("join server", data => {
  
    let user = { 
      deck : [],
      name: data.name,
      id: socket.id,
      isPlayerTurn: false,
      canBid: false,
      bid: "",
      roundScore: 0,
      totalScore: 0,
      sharedScore: false,
      gameState: "waiting",
      mustplay: false,
      mustcard: "",
      trickLeader: false,
      isTeam: false,
      contractLeader: false
    };

    // Filter for rooms with similar name
    let room = gameRooms.filter(room => room.roomID == data.room);

    // Push room if no users in room
    if (room.length == 0) {
      let roomObject = {
        roomID: "",
        users: [],
        trump: "",
        stikk: [],
        bids: [],
        trickCounter: 0,
        contract: 0 
      };
      roomObject.roomID = data.room;
      gameRooms.push(roomObject);
      user.isPlayerTurn = true;
      user.canBid = true;
    }

    let roomIndex = gameRooms.findIndex(roomName => roomName.roomID == data.room);

    // Add user to room
    if (roomIndex == -1) {
      console.log("Something went wrong, shouldnt be -1");
    } else if (gameRooms[roomIndex].users.length >= gameMembers) { 
        socket.emit("full room"); 
    } else {
      gameRooms[roomIndex].users.push(user);

    // Joining socket room
      socket.join(data.room);

    // Sending user information
      socket.emit("join game", { user: user, playerID: gameRooms[roomIndex].users.length -1 });

      let inRoom = gameRooms[roomIndex].users.length;

    // Start first round 
      if (inRoom == gameMembers) {
        deckRandomizer(roomIndex);
        let playerNames = [];
        for (let i = 0; i < gameMembers; i++) {
          playerNames[i] = gameRooms[roomIndex].users[i].name;
        }
        io.to(data.room).emit("begin game", playerNames);
      }
    }
  });

  // Incoming bids
  socket.on("made bid", data => {
    // test returns [x, y] where x is index room and y is index player
    let test = findIndexes(socket.id);
    if (test && gameRooms[test[0]].users[test[1]].id == socket.id && gameRooms[test[0]].users[test[1]].isPlayerTurn == true) {
      gameRooms[test[0]].bids.push(data.bid);
      gameRooms[test[0]].users[[test[1]]].canBid = false;
      gameRooms[test[0]].users[test[1]].isPlayerTurn = false;
      parseBids({ bid: data.bid, room: test[0], user: test[1], socket: socket.id});
    }
  });

  // Compulsory partner card
  socket.on("asking for", (data) => {
    trump = data.color;
    let askingCard = fullDeck.filter(card => card.color == data.color && card.value == data.value)[0];
    io.to(data.room).emit("Who wants to join the party?", { card: askingCard.number, winnerBid: contract, color: data.color, person: data.name });
  });
  // Update slave
  socket.on("slave!", (data) => {
    io.to(data.room).emit("slaveUpdateBoard", data.name);
  })
  // When card is played
  socket.on("cardPlayed", (data) => {
    // Remove last trick from table
    if (stikk.length == 0) {
      io.to(data.room).emit("remove cards");
    };

    let stikkInfo = data;
    stikk.push(stikkInfo);
    if (stikk.length == gameMembers) {
      trickCounter += 1;
      let roundWinner = calcRoundWinner(stikk);
      io.to(data.room).emit("next trick", { winner: roundWinner, spiltKort: data.cardNumber });
      if (trickCounter == 13) {
        bids = [];
        trickCounter = 0;

        // Calculate new score
        let combinedScore = 0;
        for (let i = 0; i < users.length; i++) {
          if (users[i].sharedScore) {
            combinedScore += users[i].roundScore;
          } else {
            users[i].totalScore += users[i].roundScore;
          }
        }
        for (let i = 0; i < users.length; i++) {
          if (users[i].sharedScore && combinedScore >= contract) {
            users[i].totalScore += combinedScore;
            users[i].sharedScore = false;
          } else if (users[i].sharedScore && combinedScore < contract) {
            users[i].totalScore -= contract;
            users[i].sharedScore = false;
          }
        }
        let scoreArray = [];
        for (i = 0; i < users.length; i++) {
          scoreArray[i] = users[i].totalScore;
          users[i].roundScore = 0;
        }

        let decks = deckRandomizer();
        let room = users.filter(user => user.room == data.room);
        for (let i = 0; i < room.length; i++) {
          io.to(room[i].id).emit("next round", { deck: decks[i], score: scoreArray });
        };
      }
    } else {
      let nextPlayer = data.player + 1;
      if (nextPlayer > gameMembers) {
        nextPlayer = 1;
      };
      let nextTurn = { spiller: nextPlayer, spiltKort: data.cardNumber, color: fullDeck[data.cardNumber].color };
      io.to(data.room).emit("updateBoard", nextTurn);
    };
  });

  socket.on("trick color", data => {
    io.to(data.room).emit("This trick color", data.color);
  })

  socket.on("shared score", data => { 
    users[data - 1].sharedScore = true;
  })

  socket.on("disconnect", () => { 
    // Find user in gameRoom array
    let roomIndex = findIndexes(socket.id);
    if (roomIndex) {
      let r = roomIndex[0];
      let u = roomIndex[1];
    // Splice room if room is empty, or user if room is not empty
      if (gameRooms[r].users.length == 1) {
        gameRooms.splice(roomIndex[r], 1);
      } else {
        gameRooms[roomIndex[r]].users.splice(roomIndex[u], 1);
        gameRooms[r].users[0].isPlayerTurn = true;
        for (let i = 0; i < gameRooms[r].users.length; i++) {
          gameRooms[r].users[i].gameState = "waiting";
        }
        io.to(gameRooms[r].roomID).emit("player left", "waiting");
        io.to(gameRooms[r].users[0].id).emit("true");
      } 
    } 
  });
});

function findIndexes (data) {
  for (let i = 0; i < gameRooms.length; i++) {
    for (let x = 0; x < gameMembers; x++) {
      if (gameRooms[i].users[x].id == data) {
        return [i, x]; 
      }
    } 
  }
}

// Crazy.. easier way to evaluate bids?
function parseBids(x) {
  // x contains { bid: data.bid, socket: socket.id, room: test[0], user: test[1]});
  gameRooms[x.room].users[x.user].bid = x.bid;
  let filterBids = 0;
  for (let i = 0; i < gameMembers; i++) {
    if (gameRooms[x.room].users[i].bid === "PASS") {
      filterBids += 1;
    }
  }
 
  if (filterBids == gameRooms[x.room].bids.length && filterBids < gameMembers) {
    let next = x.user + 1;
    if (next == gameMembers) {
      next = "0";
    };
    gameRooms[x.room].users[next].isPlayerTurn = true;
    gameRooms[x.room].users[next].canBid = true;
    io.to(gameRooms[x.room].roomID).emit("bid information", { bid: x.bid, nextPlayer: next });
    console.log("HEuuuuu");
    return
  } 
  
  // All pass
  if (filterBids == gameRooms[x.room].bids.length && filterBids == gameMembers) {
    scoreArray = [];
    
    gameRooms[x.room].bids = [];
   
    deckRandomizer(x.room);
    let next = x.user + 1;
    if (next == gameMembers) {
      next = 0;
    };
    gameRooms[x.room].users[next].isPlayerTurn = true;
    gameRooms[x.room].users[next].canBid = true;

    for (let i = 0; i < gameMembers; i++) {
      io.to(gameRooms[x.room].roomID).emit("next round", { score: scoreArray, startPlayer: next });
    }
    return
  }; 
  /*
  if (data.bid === "PASS" && filterBids.length == gameMembers - 1 && bids.length == gameMembers) {
    let filterWinner = bids.filter(bid => bid.bid !== "PASS");

    contract = filterWinner[0].bid;
    for (let i = 0; i < gameMembers; i++) {
      users[i].canBid = true;
    }
    io.to(data.room).emit("ask for card", { winnerBid: contract, roundMaster: filterWinner[0].player }); 
    return
  }
  
  if (data.bid !== "PASS" && filterBids.length == gameMembers - 1) {
    contract = data.bid;
    for (let i = 0; i < gameMembers; i++) {
      users[i].canBid = true;
    } 
    io.to(data.room).emit("ask for card", { winnerBid: contract, roundMaster: data.player }); 
    return
  }
  // All other none PASS bids
  if (data.bid !== "PASS") {
    let next = data.player + 1;
    if (next > gameMembers) {
      next = 1;
    } 
    while (!users[next - 1].canBid) {
      next += 1;
      if (next > gameMembers) {
        next = 1;
      } 
    }
    io.to(data.room).emit("bid information", { bid: data.bid, madeBid: data.player, nextPlayer: next });
        return
  }
  // All other PASS bids
  if (data.bid === "PASS") {
    let next = data.player + 1;
    if (next > gameMembers) {
      next = 1;
    } 
    while (!users[next - 1].canBid) {
      next += 1;
      if (next > gameMembers) {
        next = 1;
      } 
    }
    io.to(data.room).emit("bid information", { bid: data.bid, madeBid: data.player, nextPlayer: next });
    return
  } */
}

// Calculating round winner
function calcRoundWinner(el) {
  let stikkInfo = el;
  let firstCard = fullDeck[stikkInfo[0].cardNumber];
  let winP = stikkInfo[0].player;
  let winV = firstCard.value;
  let winC = firstCard.color;

  for (let i = 1; i < gameMembers; i++) {
    let nextCard = fullDeck[stikkInfo[i].cardNumber];
    let nextPlayer = stikkInfo[i].player;
    let nextValue = nextCard.value;
    let nextColor = nextCard.color;

    if (nextValue > winV && nextColor == winC) {
      winP = nextPlayer;
      winV = nextValue;
      winC = nextColor;
    };

    if (winC != trump && nextColor == trump) {
      winP = nextPlayer;
      winV = nextValue;
      winC = nextColor;
    };
  
  };

  let winner = [winP, winV, winC];
  users[winP - 1].roundScore += 1;
  stikk = [];
  return winP;
};

// Shuffle deck
function deckRandomizer(data) {
  var shuffled = shuffle(numberDeck);
  var deck1 = [];
  var deck2 = [];
  var deck3 = [];
  var deck4 = [];

  for (i = 0; i < 13; i++) {
    deck1.push(shuffled[i]);
  };

  for (i = 13; i < 26; i++) {
    deck2.push(shuffled[i]);
  };

  for (i = 26; i < 39; i++) {
    deck3.push(shuffled[i]);
  };

  for (i = 39; i < 52; i++) {
    deck4.push(shuffled[i]);
  };

  let allDecks = [deck1, deck2, deck3, deck4];

  for (let i = 0; i < gameMembers; i++) {
    gameRooms[data].users[i].deck = allDecks[i];
    io.to(gameRooms[data].users[i].id).emit("deck", allDecks[i]);
  }
};

function shuffle(array) {
    let shuffledArray = [];
    let usedIndexes = [];
  
    let i = 0;
    while (i < array.length) {
      let randomNumber = Math.floor(Math.random() * array.length);
        if (!usedIndexes.includes(randomNumber)) {
          shuffledArray.push(array[randomNumber]);
          usedIndexes.push(randomNumber);
          i++;
          }
      }
      return shuffledArray;
};

const fullDeck = [{
  color: "diamonds", value: 2, number: 0
},
{
  color: "diamonds", value: 3, number: 1
},
{
  color: "diamonds", value: 4, number: 2
},
{
  color: "diamonds", value: 5, number: 3
},
{
  color: "diamonds", value: 6, number: 4
},
{
  color: "diamonds", value: 7, number: 5
},
{
  color: "diamonds", value: 8, number: 6
},
{
  color: "diamonds", value: 9, number: 7
},
{
  color: "diamonds", value: 10, number: 8
},
{
  color: "diamonds", value: 11, number: 9
},
{
  color: "diamonds", value: 12, number: 10
},
{
  color: "diamonds", value: 13, number: 11
},
{
  color: "diamonds", value: 14, number: 12
},
{
  color: "clubs", value: 2, number: 13
},
{
  color: "clubs", value: 3, number: 14
},
{
  color: "clubs", value: 4, number: 15
},
{
  color: "clubs", value: 5, number: 16
},
{
  color: "clubs", value: 6, number: 17
},
{
  color: "clubs", value: 7, number: 18
},
{
  color: "clubs", value: 8, number: 19
},
{
  color: "clubs", value: 9, number: 20
},
{
  color: "clubs", value: 10, number: 21
},
{
  color: "clubs", value: 11, number: 22
},
{
  color: "clubs", value: 12, number: 23
},
{
    color: "clubs", value: 13, number: 24
},
{
    color: "clubs", value: 14, number: 25
},
{
  color: "hearts", value: 2, number: 26
},
{
  color: "hearts", value: 3, number: 27
},
{
  color: "hearts", value: 4, number: 28
},
{
  color: "hearts", value: 5, number: 29
},
{
  color: "hearts", value: 6, number: 30
},
{
  color: "hearts", value: 7, number: 31
},
{
  color: "hearts", value: 8, number: 32
},
{
  color: "hearts", value: 9, number: 33
},
{
  color: "hearts", value: 10, number: 34
},
{
  color: "hearts", value: 11, number: 35
},
{
  color: "hearts", value: 12, number: 36
},
{
  color: "hearts", value: 13, number: 37
},
{
  color: "hearts", value: 14, number: 38
},
{
  color: "spades", value: 2, number: 39
},
{
  color: "spades", value: 3, number: 40
},
{
  color: "spades", value: 4, number: 41
},
{
  color: "spades", value: 5, number: 42
},
{
  color: "spades", value: 6, number: 43
},
{
  color: "spades", value: 7, number: 44
},
{
  color: "spades", value: 8, number: 45
},
{
  color: "spades", value: 9, number: 46
},
{
  color: "spades", value: 10, number: 47
},
{
  color: "spades", value: 11, number: 48
},
{
  color: "spades", value: 12, number: 49
},
{
  color: "spades", value: 13, number: 50
},
{
  color: "spades", value: 14, number: 51
}];



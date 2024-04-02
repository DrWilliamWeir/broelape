// For app testing:
const socket = io();

// For dev env:
//const socket = io("http://localhost:3000");

// Login page
let loginInfo = document.getElementById("formSubmit");
loginInfo.addEventListener("click", function() { joinRoom() });

// Game variables
let person = {
  playerID : [],
  name: "",
  isPlayerTurn: false,
  deck: [],
  largeDeck: [],
  room: "",
  mustplay: false,
  mustcard: "",
  trickLeader: false,
  isTeam: false,
  contractLeader: false
};
let trump = "";
let players = [];
let currentBid = 0;
let leadingColor = "";

let opponentArr = [];





// Try room login
function joinRoom() {
  let txt1 = document.getElementById("text1").value;
  let txt2 = document.getElementById("text2").value;
  if (!txt1 || !txt2) {
    alert("Hello! Fill the forms, and chew with your mouth closed.. please! JFC!!!");
  } else {
  socket.emit("join server", { name: txt1, room: txt2 });
  }
};


// Full room response from server
socket.on("full room", () => {
  alert("Full room, I'm terribly sorry.");
});

socket.on("player information", (data) => {
  players = data;
  let headerText = document.getElementById("roomName");
  headerText.innerHTML = "Room: " + person.room;
  for (let i = 1; i < (data.length + 1); i++) {
    const a = document.getElementById("player" + i);
    a.innerHTML = players[i - 1];
  }
  for (let i = 5; i < (data.length + 5); i++) {
    const b = document.getElementById("player" + i);
    b.innerHTML = "Score: 0";
  } 
  initiateBidding();
});

// Join room response from server. New HTML this way to preserve socket connection
socket.on("join game", (data) => {
  document.body.innerHTML = 
  '<section id="gameContainer">' +
    '<div id="information">' +
      '<div class="jadda" id="roomName"> </div>' +
      '<div class="infobox" id="infob1">' +
        '<div class="picture" id="picture1"><img src="./assets/roy.jpg" class="picClass"></div>' +
        '<div class="textbox" id="playerInfo1">' +
          '<div class="txtb" id="player1"></div>' +
          '<div class="txtb" id="player5"></div>' +
        '</div>' +
      '</div>' + 
      '<div class="infobox" id="infob2">' +
        '<div class="picture" id="picture2"><img src="./assets/roy.jpg" class="picClass"></div>' +
        '<div class="textbox" id="playerInfo2">' +
          '<div class="txtb" id="player2"></div>' +
          '<div class="txtb" id="player6"></div>' +
        '</div>' +
      '</div>' + 
      '<div class="infobox" id="infob3">' +
        '<div class="picture" id="picture3"><img src="./assets/roy.jpg" class="picClass"></div>' +
        '<div class="textbox" id="playerInfo3">' +
          '<div class="txtb" id="player3"></div>' +
          '<div class="txtb" id="player7"></div>' +
        '</div>' +
      '</div>' + 
      '<div class="infobox" id="infob4">' +
        '<div class="picture" id="picture4"><img src="./assets/roy.jpg" class="picClass"></div>' +
        '<div class="textbox" id="playerInfo4">' +
          '<div class="txtb" id="player4"></div>' +
          '<div class="txtb" id="player8"></div>' +
        '</div>' +
      '</div>' +
      '<div class="tangerudbakken" id="infotainment"> Bingo Night </div>' +
    '</div>' +
    '<div id="fyll1"></div>' +
    '<div id="gameBoard">' +
    '</div>' +
    '<div id="fyll2"></div>' +
    '<div id="deckContainer">' +
    '</div>'  ;
  '</section>' ; 
  '<script src="../socket.io/socket.io.js"></script>' +
  '<script src="./js/main.js"></script>';
  person.room = data.room;
  person.name = data.name;
});

function boardManagement() {

}



function changeToGreen(data) {
  if (data) {  
    document.getElementById("infotainment").setAttribute("style", "background-color: rgb(22, 203, 76);");
  } else {
    document.getElementById("infotainment").setAttribute("style", "background-color: rgb(213, 95, 95);");
  }
} 

// Room is full. Game begins
socket.on("begin game",  data => {
  person.deck = data.deck;
  person.deck.sort(compareNumbers);
  makeLargeDeck(person.deck);
  person.playerID = data.playerID;
  if (data.playerID == 1) {
    person.isPlayerTurn = true;
    changeToGreen(true); 
  };
  startRound(person.deck);
});

function makeLargeDeck(data) {
  for (let i = 0; i < data.length; i++) {
    person.largeDeck[i] = fullDeck[data[i]];
  }
}

socket.on("next round", data => {
  cleanPlayerColors();
  if (data.startPlayer == person.playerID) {
    person.isPlayerTurn = true;
    changeToGreen(true);
  }
  let ele = document.getElementById("fyll2");
  ele.innerText = "";
  currentBid = "";
  person.deck = data.deck;
  person.deck.sort(compareNumbers);
  let newScores = data.score;
  updateScore(newScores);
  renskHand();
  startRound(person.deck);
  initiateBidding();
});

function updateScore (data) {
  //let a = data;
  for (let i = 5; i < (data.length + 5); i++) {
    let b = document.getElementById("player" + i); 
    console.log(b);
    b.innerHTML = "Score: " + data[i-5].toString();
  } 
}

function compareNumbers(a, b) {
  return a - b;
};

// Arranging cards in correct position for CSS to work
function startRound(startHand) { 
  let startCards = startHand;
  updateGridPlacement(startCards.length);
  for (let i = 0; i < startCards.length; i++) {
    let newCard = new Image();
    newCard.src = "./assets/" + startCards[i] + ".png";
    newCard.alt = startCards[i];
    newCard.setAttribute("class", "cards");
    newCard.setAttribute("download", person.deck[i]);
    if (i==0) {
      newCard.setAttribute("id", "card0");
      document.getElementById("deckContainer").appendChild(newCard);
    } else {
      document.getElementById("deckContainer").appendChild(newCard);
    };
  };
};

// Bidding graphics
function initiateBidding() {
  let bidding = document.getElementById("gameBoard");
  bidding.innerHTML = '<div id="biddingContainer">' +
                      '<div id="displayBids">' +
                        '<div class="bids">' + 
                          '<div id="textBid">Current bid: <br></div>' +
                          '<div id="bid1"> 0 </div>' +
                        '</div>' +
                      '</div>' +
                      '<div id="possible">' +
                        '<input type="submit" class="possibleBids" id="7" value="7" />' +
                        '<input type="submit" class="possibleBids" id="8" value="8" />' +
                        '<input type="submit" class="possibleBids" id="9" value="9" />' +
                        '<input type="submit" class="possibleBids" id="10" value="10" />' +
                        '<input type="submit" class="possibleBids" id="11" value="11" />' +
                        '<input type="submit" class="possibleBids" id="12" value="12" />' +
                        '<input type="submit" class="possibleBids" id="13" value="13" />' +
                        '<input type="submit" class="possibleBids" id="pass" value="PASS" />' +
                      '</div>';
    addEventBidding();
};

function addEventBidding() {
  let elements = document.getElementsByClassName("possibleBids");
  for (let i=0; i < elements.length; i++) {
    elements[i].addEventListener("click", function(){ makeBid(this) });
  };
}

function makeBid(data) {
  let bidSize = data.value;
  if (person.isPlayerTurn) {
    if (data.value === "PASS") {
      person.isPlayerTurn = false;
      changeToGreen(false);
      socket.emit("made bid", { bid: bidSize, player: person.playerID, room: person.room });
      for (let i = 7; i < 14; i++) {
        let elements = document.getElementById(i);
        elements.classList.remove("possibleBids");
        elements.classList.add("impossibleBids");
      };
      let element = document.getElementById("pass");
      element.classList.remove("possibleBids");
      element.classList.add("impossibleBids");
    }
    if (bidSize !== "PASS") {
      if (Number(bidSize) > Number(currentBid)) {
        person.isPlayerTurn = false;
        changeToGreen(false);
        socket.emit("made bid", { bid: bidSize, player: person.playerID, room: person.room });
        console.log("bidding done");
      }
    }
  }
};

socket.on("ask for card", (data) => {
  if (data.roundMaster == person.playerID) {
    person.isPlayerTurn = true;
    changeToGreen(true);
    person.trickLeader = true;
    person.contractLeader = true;
    person.isTeam = true;

    socket.emit("shared score", person.playerID);
    let updateBoard = document.getElementById("gameBoard");
    updateBoard.innerHTML = 
      '<div id="slavemaster">' +
      '<fieldset required>' +
      '<legend>Choose wanted card</legend>' +
      '<div>' +
        '<input type="radio" name="radiob" class="radiobtn" id="spades"><label for="spades">Spades</label><br>' +
        '<input type="radio" name="radiob" class="radiobtn" id="hearts"><label for="hearts">Hearts</label><br>' +
        '<input type="radio" name="radiob" class="radiobtn" id="clubs"><label for="clubs">Clubs</label><br>' +
        '<input type="radio" name="radiob" class="radiobtn" id="diamonds"><label for="diamonds">Diamonds</label>' +
      '</div>' +
      '<div>' +
        '<br>' +
        '<input type="text" id="text3" placeholder="Number:" maxlength="2" minlength="1">' +
        '<br>' + 
      '</div>' +
      '<div>' +
        '<input type="submit" value="Lets Go!" id="bidSubmit">' +
      '</div>' +
      '</fieldset>' +
      '<div>' ;
      let bidInfo = document.getElementById("bidSubmit");
      bidInfo.addEventListener("click", function() { chosenPartner() });
  } else {
    person.isPlayerTurn = false;
    changeToGreen(false);
  }
  
})

// Ask for card
function chosenPartner() {
  let txt1 = document.querySelector('input[name="radiob"]:checked');
  let txt2 = document.getElementById("text3").value;
  if (txt1 && txt2) {
    let legality = checkBid({ deck: person.deck, value: txt2, color: txt1.getAttribute("id") });
    if (txt2 < 15 && txt2 > 1 && legality) {
      socket.emit("asking for", { value: txt2, color: txt1.getAttribute("id"), room: person.room, name: person.name });   
    } else {
    alert("Spill som et menneske..");
    }
  }
};

// Round initiazion with passed partner card
socket.on("Who wants to join the party?", (data) => {
  trump = data.color;
  let cleanse = document.getElementById("gameBoard");
  cleanse.innerHTML = "";
  let updateBoard = document.getElementById("fyll2");
  updateBoard.innerHTML = 
  '<div> <h2 id="contract"> Contract: </h2></div>' +
  '<div id="askedCard"></div>' + 
  '<div id="master"></div>' + 
  '<div id="slave">Partner:</div>';
  let newCard = new Image();
  newCard.src = "./assets/" + data.card + ".png";
  console.log(newCard.src);
  newCard.setAttribute("id", "jesusCard");
  let updateInnerBoard = document.getElementById("askedCard");
  updateInnerBoard.appendChild(newCard);
  let updateContract = document.getElementById("contract");
  updateContract.innerHTML = "Contract: " + data.winnerBid;
  let updateMaster = document.getElementById("master");
  updateMaster.innerHTML = "Leader: " + data.person;
  addEventL(); 
  // If player has asked partner card in deck
  let compulsory = person.deck.filter(card => card == data.card);
  if (compulsory.length == 1) {
    person.mustplay = true;
    person.mustcard = data.card;
    console.log(person.mustcard);
    person.isTeam = true;

    socket.emit("shared score", person.playerID);
  }
});

socket.on("bid information", (data) => {
  
  if (person.playerID == data.nextPlayer) {
    person.isPlayerTurn = true;
    changeToGreen(true);
  }
  if (data.bid !== "PASS") {
    currentBid = data.bid;
    let highestBid = document.getElementById("bid1");
    highestBid.innerHTML = currentBid;
  }
  // Update graphics
  if (data.bid !== "PASS") {
    for (i = 7; i <= data.bid; i++) {
      let element = document.getElementById(i);
      element.classList.remove("possibleBids");
      element.classList.add("impossibleBids");
    };
  };
});

function addEventL() {
  let elements = document.getElementsByClassName("cards");
  for (let i=0; i < elements.length; i++) {
    elements[i].addEventListener("click", function(){ playCard(this) });
  }; 
};
socket.on("slaveUpdateBoard", data => {
  let updateSlave = document.getElementById("slave");
  updateSlave.innerHTML = "Slave: " + data; 
})

// When a player tries clicking a card 
function playCard(card) {

  let playedC = fullDeck[card.alt];
  if (!person.isPlayerTurn) {
    console.log("vent på tur!!")
    return
  } 
  if (person.mustplay && Number(card.alt) !== Number(person.mustcard)) {
    return
  }
  if (person.mustplay && Number(card.alt) == Number(person.mustcard)) {
    person.mustplay = false;
    person.mustcard = "";
    socket.emit("slave!", { room: person.room, name: person.name});
    playItForReal(card);
    return
  }
  if (person.contractLeader) {
    if (checkTrump(playedC)) {
      playItForReal(card);
      person.contractLeader = false;
      person.trickLeader = false;
      socket.emit("trick color", { room: person.room, color: playedC.color }); 
      return
    } else {
      return;
    }
  }
  if (person.trickLeader) {
    playItForReal(card);
    socket.emit("trick color", { room: person.room, color: playedC.color }); 
    person.trickLeader = false;
  } else {
    let checkForColor = cardVerification(playedC);
    if (checkForColor) {
      playItForReal(card);
    }
  }
}

socket.on("This trick color", data => {
  leadingColor = data;
});

 // Check for correct color
function cardVerification(data)  {
  if (data.color == leadingColor) {
    return true;
  }
  console.log("HEEEEEI");
  let x = person.largeDeck;
  console.log(x);
  let y = x.filter(card => card.color == leadingColor);
  //let checker = person.largeDeck.filter(card => card.color == leadingColor);
  console.log(y);
  if (y.length > 0 && data.color !== leadingColor) {
    return false;
  } 
  return true;
}

function playItForReal(card) {
  // The next lines for graphics update
  let element = card;
  element.remove();
  let cardsInHand = document.querySelectorAll(".cards");
  updateGridPlacement(cardsInHand.length);
  if (element.id == "card0" && cardsInHand.length != 0) {
    updateCardId();
  };
  let message = { cardNumber: card.alt, player: person.playerID, room: person.room };
  person.isPlayerTurn = false;
  changeToGreen(false);

  // Deleting card from hand arrays
  let cardIndex = person.deck.findIndex(el => el == card.alt);;
  let updatedDeck = person.deck.toSpliced(cardIndex, 1);
  person.deck = updatedDeck;
  let updatedLargeDeck = person.largeDeck.toSpliced(cardIndex, 1);
  person.largeDeck = updatedLargeDeck;

  socket.emit("cardPlayed", message);
};



// Place played cards on game board
function boardUpdate(card) {
  let newCard = new Image();
  newCard.src = "./assets/" + card + ".png";
  newCard.setAttribute("class", "playedCards");
  document.getElementById("gameBoard").appendChild(newCard);
;}

// Remove cards for next trick
socket.on("remove cards", () => {
  renskBord();
  cleanPlayerColors();
});

function cleanPlayerColors() {
  let arr = document.getElementsByClassName("infobox");
  for (let i = 0; i < arr.length; i++) {
    arr[i].setAttribute("style", "background-color: rgba(138, 145, 179, 0.617);");
  }
}

// Update on opponent plays card
socket.on("updateBoard", data => {
  if (data.spiller == person.playerID) {
      person.isPlayerTurn = true;
      changeToGreen(true);
  };
  let helperVar = data.spiller - 1;
  if (data.spiller == 1) {
    let playerDisplay = document.getElementById("infob" + players.length);
    playerDisplay.setAttribute("style", "background-color: rgba(231, 235, 252, 0.617);");
  } else {
    let playerDisplay = document.getElementById("infob" + helperVar);
    playerDisplay.setAttribute("style", "background-color: rgba(231, 235, 252, 0.617);");
  }
  boardUpdate(data.spiltKort);
}); 

// ???? Rule check.. If winner of last round, still lead player??
socket.on("next trick", data => {
  if (data.winner == person.playerID) {
    person.isPlayerTurn = true;
    changeToGreen(true);
    person.trickLeader = true;
  } else {
    person.isPlayerTurn = false;
    changeToGreen(false);
  };
  boardUpdate(data.spiltKort);
});

function renskBord() {
  document.querySelectorAll(".playedCards").forEach(e => e.remove());
};

function renskHand() {
  document.querySelectorAll(".cards").forEach(e => e.remove());
}

// Arranging cards in correct position for CSS to work
function updateGridPlacement(length) {
    var grid = 
    ["auto 200px auto", 
    "auto 30px 200px auto",
    "auto 30px 30px 200px auto",
    "auto 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 200px auto",
    "auto 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 30px 200px auto"];
    document.getElementById("deckContainer").style.gridTemplateColumns = grid[length-1];
}

function updateCardId() {
    const parentDOM = document.getElementById("deckContainer");
    var change = parentDOM.getElementsByClassName("cards")[0];
    change.setAttribute("id", "card0");
}

function roundStart() {
  let lengthHand =  person.deck.length;
  for (let i=0; i<lengthHand; i++) {
    let dealCard = document.createElement("IMG");
    dealCard.src = person.deck[i] + ".png";
    dealCard.setAttribute("class", "cards");
    if (i == 0) {
      dealCard.setAttribute("id", "card0");
      document.getElementById("deckContainer").appendChild(dealCard);
    } else {
      document.getElementById("deckContainer").appendChild(dealCard);
    }
  }
  updateGridPlacement(lengthHand);
};

function checkBid(data) {
  let originalDeck = [];
  for (let i = 0; i < data.deck.length; i++) {
    originalDeck[i] = fullDeck[data.deck[i]];
  }
  let colorFilter = originalDeck.filter(card => card.color == data.color);
  let numberFilter = originalDeck.filter(card => card.value == data.value && card.color == data.color);
  if (colorFilter.length !== 0 && numberFilter.length == 0) {
    return true;
  }
}

function checkTrump(data) {
  if (data.color == trump) {
    return true;
  }
}

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

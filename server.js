var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const port = process.env.PORT || 3000;
app.get('/', function(req, res) {
   res.sendFile(path.join(__dirname,'index.html'));
});
app.use('/static',express.static('static'));



http.listen(port, function() {
   console.log('listening on:'+port);
});

//game

var player_lst=[];
var bullet_array = [];
var Player = function(startX,startY,startAngle){
    this.x = startX;
    this.y = startY;
    this.angle = startAngle;
}

function onNewplayer(data){
    var newPlayer = new Player(data.x, data.y, data.angle);
    console.log(newPlayer);
    console.log("created new player with id"+this.id);
    newPlayer.id = this.id;
    this.emit("my_id",newPlayer.id);

    //info send to all except sender
    var current_info = {
        id: newPlayer.id,
        x: newPlayer.x,
        y:newPlayer.y,
        angle: newPlayer.angle
    };

    //send to new player about everyone already present.
    for (i=0;i<player_lst.length;i++){
        existingPlayer = player_lst[i]; 
        var player_info = {
            id: existingPlayer.id,
            x: existingPlayer.x,
            y: existingPlayer.y,
            angle: existingPlayer.angle
        };
        this.emit("new_enemyPlayer", player_info); // to sender-client only

    }

    this.broadcast.emit('new_enemyPlayer', current_info);
    player_lst.push(newPlayer);
}

function onMovePlayer(data){
    var movePlayer = find_playerid(this.id);
    movePlayer.x = data.x;
    movePlayer.y = data.y;
    movePlayer.angle = data.angle;
    var movePlayerData = {
        id: movePlayer.id,
        x: movePlayer.x,
        y: movePlayer.y,
        angle: movePlayer.angle
    };
    this.broadcast.emit('enemy_move',movePlayerData);
}

function onClientdisconnect(){
    var removePlayer = find_playerid(this.id);
    if(removePlayer){
        player_lst.splice(player_lst.indexOf(removePlayer),1);

    }
    this.broadcast.emit('remove_player',{id: this.id});
}

function find_playerid(id){
    for(var i =0;i<player_lst.length;i++){
        if(player_lst[i].id == id){
            return player_lst[i];
        }
    }
    return false;
}

function shootBullet(data){
    var bulletPlayer = find_playerid(this.id);
    if(bulletPlayer == false){
        return;
    }
    var bullet = data;
    data.owner_id = bulletPlayer.id;
    bullet_array.push(bullet);
}

function playerDied(id){
    var removePlayer = find_playerid(id);
    if(removePlayer){
        player_lst.splice(player_lst.indexOf(removePlayer),1);
    }
    io.emit('died_player',id);
}

//loop

function ServerGameLoop(){
    for(var i=0;i<bullet_array.length;i++){
      var bullet = bullet_array[i];
      bullet.x += bullet.speed_x; 
      bullet.y += bullet.speed_y; 
      
      var dr1 = {x:1674.5,y:247.5}
          var dr2 = {x:689.5,y:412.5}
          var dr3 = {x:295.5,y:907.5}
          var dr4 = {x:1871.5,y:1072.5}
          var dr5 = {x:1083.5,y:1237.5}
          var dr6 = {x:2462.5,y:1402.5}
          var dist_dr1 = Math.sqrt((dr1.x - bullet.x)*(dr1.x - bullet.x) + (dr1.y - bullet.y)*(dr1.y - bullet.y));
          var dist_dr2 = Math.sqrt((dr2.x - bullet.x)*(dr2.x - bullet.x) + (dr2.y - bullet.y)*(dr2.y - bullet.y));
          var dist_dr3 = Math.sqrt((dr3.x - bullet.x)*(dr3.x - bullet.x) + (dr3.y - bullet.y)*(dr3.y - bullet.y));
          var dist_dr4 = Math.sqrt((dr4.x - bullet.x)*(dr4.x - bullet.x) + (dr4.y - bullet.y)*(dr4.y - bullet.y));
          var dist_dr5 = Math.sqrt((dr5.x - bullet.x)*(dr5.x - bullet.x) + (dr5.y - bullet.y)*(dr5.y - bullet.y));
          var dist_dr6 = Math.sqrt((dr6.x - bullet.x)*(dr6.x - bullet.x) + (dr6.y - bullet.y)*(dr6.y - bullet.y));   
          
          if(dist_dr1<=82.5 || dist_dr2<=82.5 || dist_dr3<=82.5 || dist_dr4<=82.5 || dist_dr5<=82.5 || dist_dr6<=82.5){
            bullet_array.splice(i,1);
            i--;
          }
      // Check if this bullet is close enough to hit any player 
      for(var j=0;j<player_lst.length;j++){
        if(bullet.owner_id != player_lst[j].id){
          // And your own bullet shouldn't kill you
          var dx = (player_lst[j].x) - bullet.x; 
          var dy = (player_lst[j].y) - bullet.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          
          if((dist < 20)){
            //player hit
            bullet_array.splice(i,1);
            io.emit('player-hit',player_lst[j].id); // Tell everyone this player got hit
          }
        }
      }
      
      // Remove if it goes too far off screen 
      if(bullet.x < 0 || bullet.x > 2758 || bullet.y < 0 || bullet.y > 1650){
          bullet_array.splice(i,1);
          i--;
      }
          
    }
    // Tell everyone where all the bullets are by sending the whole array
    io.emit("bullets-update",bullet_array);
  }
  
  setInterval(ServerGameLoop, 16); 


//connections

io.on('connection', function(socket) {
    socket.on('disconnect', onClientdisconnect);
    socket.on('new_player',onNewplayer);
    socket.on('move_player', onMovePlayer);
    socket.on('shoot-bullet',shootBullet);
    socket.on('player_died',playerDied);
    //on message recieve
    socket.on("message",sendMessage);
 });

 //chat services
 
function sendMessage(msg,name){
    //Broadcast to everyone except the sender
    this.broadcast.emit("recieve_message",msg,name);
}

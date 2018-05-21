var socket = io();

var enemies =[];
var bullet_array = [];

function onRemovePlayer(data){
    var removePlayer = findplayerbyid(data.id);
    if(!removePlayer){
        console.log('Player not found:',data.id);
        return;
    }
    removePlayer.player.destroy();
    enemies.splice(enemies.indexOf(removePlayer),1);
}

function createPlayer(){
    let spawn_locations = [
        {x:50,y:50},
        {x:50,y:1600},
        {x:2700,y:50},
        {x:2700,y:1600},
        {x:1350,y:800},
        {x:800,y:1350}
    ];
    let num = Math.floor(Math.random()*6);
    console.log(`x coord:${spawn_locations[num].x}, y coord:${spawn_locations[num].y}`);
    player = game.add.sprite(spawn_locations[num].x,spawn_locations[num].y,'player');
    player.anchor.setTo(0.5,0.5);
    console.log("x:"+player.x+"y:"+player.y);
    console.log("width:"+player.height+" height:"+player.width);
    game.physics.p2.enable(player);
    game.global.health = 100;
    game.camera.follow(player);
    console.log('original player made');
    socket.emit('new_player',{x: game.width/2, y: game.height/2, angle:0});
    playerCollisionGroup = game.physics.p2.createCollisionGroup();
    player.body.setCollisionGroup(playerCollisionGroup);
    player.body.collides(rockCollisionGroup);
    player.body.collides(playerCollisionGroup);
    player.body.collides(healthCollisionGroup,hitHealth, this);

}

function hitHealth(rocket, healthBar) {
    if(healthBar.sprite === null){
        return;
    }
    console.log("collided with health");
    game.global.health = 100;
    healthBar.sprite.destroy();
}

var remote_player = function(id,startx,starty,startangle){
    this.x=startx;
    this.y=starty;
    this.angle = startangle;
    this.id = id;   
    this.player = game.add.sprite(this.x,this.y,'enemy');
    this.player.anchor.setTo(0.5,0.5);
    game.physics.p2.enable(this.player);
    this.player.body.setCollisionGroup(playerCollisionGroup);
    this.player.body.collides(playerCollisionGroup);
    this.player.body.collides(rockCollisionGroup);
    this.player.body.collideWorldBounds = true;
}

function onNewPlayer(data){
    console.log("New player added:" + "id:"+ data.id +"x:" + data.x +"y:"+ data.y+"angle:"+data.angle);
    var new_enemy = new remote_player(data.id, data.x, data.y, data.angle);
    enemies.push(new_enemy);
}

function onEnemyMove(data){
    var movePlayer = findplayerbyid(data.id);
    if(!movePlayer){
        return;
    }
    movePlayer.player.body.x = data.x; 
	movePlayer.player.body.y = data.y; 
	movePlayer.player.body.angle = data.angle; 
}

function findplayerbyid(id){
    for(var i =0;i<enemies.length;i++){
        if(enemies[i].id == id){
            return enemies[i];
        }
    }
}

function bulletUpdate(server_bullet_array){
for(var i=0;i<server_bullet_array.length;i++){
    if(bullet_array[i] == undefined){
        bullet_array[i] = game.add.sprite(server_bullet_array[i].x,server_bullet_array[i].y,'bullet');
    }
    else{
        bullet_array[i].x = server_bullet_array[i].x;
        bullet_array[i].y = server_bullet_array[i].y;
    }
}
for(var i=server_bullet_array.length;i<bullet_array.length;i++){
    bullet_array[i].destroy();
    bullet_array.splice(i,1);
    i--;
}
}

function playerHit(id){
    if(player.id == id){
    game.global.health -=10;
    healthLabel.text='Health:'+game.global.health;
    }
    if(game.global.health == 0){
        player.kill();
        socket.emit('player_died',player.id);
    }
}

function myid(id){
    player.id = id;
}

function diedPlayer(id){
    if(player.id == id){
        console.log("You Died!");
    }
    else{
    var removePlayer = findplayerbyid(id);
    if(!removePlayer){
        return;
    }
    removePlayer.player.destroy();
    enemies.splice(enemies.indexOf(removePlayer),1);
}
}

//game object

var playState = {
    preload:function(){
        game.load.image('player','static/player.png');
        game.load.image('enemy','static/enemy.png');
        game.load.image('bullet','static/bullet.png');
        game.load.image('background','static/assets/space-background.jpg');
        game.load.image('tileset','static/assets/maps/tileset.png');
        game.load.tilemap('map','static/assets/maps/space_map.json',null,Phaser.Tilemap.TILED_JSON);
        game.load.image('health','static/assets/health.png');
    },

    create:function(){
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.setImpactEvents(true);
        game.add.image(0,0,'background');
        game.add.image(1024,0,'background');
        game.add.image(0,1024,'background');
        game.add.image(1024,1024,'background');
        game.add.image(2048,0,'background');
        game.add.image(2048,1024,'background');
        healthCollisionGroup = game.physics.p2.createCollisionGroup();
        
        game.world.setBounds(0, 0, 2758, 1650);
        map = game.add.tilemap('map');
        map.addTilesetImage('tileset');
        layer = map.createLayer('Tile Layer 1');
        layer.resizeWorld();
        map.setCollision(1);
        rocks = game.physics.p2.convertTilemap(map, layer);
        game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
        game.stage.disableVisibilityChange = true;
        
        game.renderer.renderSession.roundPixels = true;

        
        rockCollisionGroup = game.physics.p2.createCollisionGroup();
        //player creation
        console.log("client started");
        createPlayer();

        h_positions = [{x:120,y:120},{x:150,y:1500},{x:2600,y:130},{x:2500,y:1600},{x:1250,y:800}];
        setInterval(function(){
            let h_num = Math.floor(Math.random()*5);
            health = game.add.sprite(h_positions[h_num].x,h_positions[h_num].y,'health');
            console.log("Created health at:",h_positions[h_num].x,h_positions[h_num].y);
            game.physics.p2.enable(health);
            health.body.kinematic = "true";
            health.body.setCollisionGroup(healthCollisionGroup);
            health.body.collides(playerCollisionGroup);    
        },60000)

        
        for(var i = 0; i < rocks.length; i++ ){
            rockBody = rocks[i];
            console.log("rockBody:",rockBody.x,rockBody.y);
            rockBody.setCollisionGroup(rockCollisionGroup);
            rockBody.collides(playerCollisionGroup);
        }
        game.physics.p2.setBoundsToWorld(true,true,true,true,false);
        game.physics.p2.updateBoundsCollisionGroup();
       

        socket.on("new_enemyPlayer", onNewPlayer);
        socket.on("enemy_move", onEnemyMove);
        socket.on("remove_player", onRemovePlayer);
        socket.on("bullets-update",bulletUpdate);
        socket.on("player-hit",playerHit);
        socket.on("my_id",myid);
        socket.on("died_player",diedPlayer);
        this.cursor = game.input.keyboard.createCursorKeys();
        healthLabel=game.add.text(30,30,'Health:'+game.global.health,{font:'25px Arial',fill:'#ffffff'});
        healthLabel.fixedToCamera = true;
        upKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_8);
        leftKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_4);
        rightKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_6);
        fireButton = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_0);
    },

    update:function(){
        this.movePlayer();
        if(fireButton.isDown && !this.shot){
            var speed_x = Math.cos(player.rotation - Math.PI/2) * 20;
            var speed_y = Math.sin(player.rotation - Math.PI/2) * 20;
            this.shot=true;
            socket.emit('shoot-bullet',{x:player.x,y:player.y,speed_x:speed_x,speed_y:speed_y});
        }
        if(!fireButton.isDown){
            this.shot = false;
        }
        if(game.global.health == 0 && !this.death){
            
            let dieText = this.game.add.text(game.camera.width/2,game.camera.height/2,"You died, reload for a new game.", {font: "30px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 3});
            dieText.anchor.setTo(0.5,0.5);
            dieText.fixedToCamera = true;
            this.death = true;
        }

        
    healthLabel.text='Health:'+game.global.health;
        
       
    },

    movePlayer:function(){
        
        
        if (leftKey.isDown) {player.body.rotateLeft(100);}   //ship movement
        else if (rightKey.isDown){player.body.rotateRight(100);}
        else {player.body.setZeroRotation();}
        if (upKey.isDown){player.body.thrust(100);}
        socket.emit('move_player',{x:player.x,y:player.y,angle:player.angle});
    }
};

var game = new Phaser.Game(1300,650,Phaser.AUTO,'gameDiv');
game.global={
	health:100
};
game.state.add('play', playState);

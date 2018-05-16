//CURRENT PROBLEMS - buttons are clicked outside game environment

var socket = io();
socket.on('vinayak', function(data){console.log(data)});

var enemies =[];
var bullet_array = [];
//on connection in socket

/*function onsocketConnected(){
    
    ("connected to server");
    createPlayer();
    socket.emit('new_player',{x: game.width/2, y: game.height/2});
}
*/

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
    //player.body.immovable = true;
    game.camera.follow(player);
    console.log('original player made');
    socket.emit('new_player',{x: game.width/2, y: game.height/2, angle:0});
    playerCollisionGroup = game.physics.p2.createCollisionGroup();
    player.body.setCollisionGroup(playerCollisionGroup);
    player.body.collides(rockCollisionGroup);
    player.body.collides(playerCollisionGroup);
    player.body.collides(healthCollisionGroup,hitHealth, this); //, hitRock, this);
    //player.body.collides(layer,hitRock,this);
    //player.body.collideWorldBounds = true;

}

function hitHealth(rocket, healthBar) {
    if(healthBar.sprite === null){
        return;
    }
    console.log("collided with health");
    game.global.health = 100;
    //console.log(`healthbar : ${healthBar}`);
    healthBar.sprite.destroy();

    //rocket.sprite.body.velocity.x = 0;            
    //rocket.sprite.body.velocity.y = 0;
    //rock.sprite.body.velocity.x = 0;            
    //rock.sprite.body.velocity.y = 0;

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
    //this.player.body.immovable = true;
    this.player.body.collideWorldBounds = true;
}

function onNewPlayer(data){
    console.log("New player added:" + "id:"+ data.id +"x:" + data.x +"y:"+ data.y+"angle:"+data.angle);
    var new_enemy = new remote_player(data.id, data.x, data.y, data.angle);
    enemies.push(new_enemy);
}

function onEnemyMove(data){
    //console.log("Moving player:"+"id:"+data.id+"x:"+data.x+"y:"+data.y+"angle:"+data.angle);
    //console.log(enemies);
    var movePlayer = findplayerbyid(data.id);
    if(!movePlayer){
        return;
    }
    //movePlayer.player.x = data.x;  //body.x is readonly use x directly
    //movePlayer.player.y = data.y;  //body.y is readonly use y directly
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
    console.log("bullet hit player:"+id);
    //console.log("my id:"+player.id);
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
    console.log("My id is:"+ id);
    player.id = id;
}

function diedPlayer(id){
    if(player.id == id){
        console.log("You Died!");
    }
    else{
    var removePlayer = findplayerbyid(id);
    if(!removePlayer){
        console.log('Player not found:',id);
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
        game.physics.p2.setImpactEvents(true); //collision callback
        //game.stage.backgroundColor = '#000000';
        game.add.image(0,0,'background');
        game.add.image(1024,0,'background');
        game.add.image(0,1024,'background');
        game.add.image(1024,1024,'background');
        game.add.image(2048,0,'background');
        game.add.image(2048,1024,'background');
        //health
        /*{x:50,y:50},
        {x:50,y:1600},
        {x:2700,y:50},
        {x:2700,y:1600},
        {x:1350,y:800},
        {x:800,y:1350} */
        healthCollisionGroup = game.physics.p2.createCollisionGroup();
        
        //remotePlayerCollisionGroup = game.physics.p2.createCollisionGroup();
        
        
        //background.scale.setTo(2758,1650);
        game.world.setBounds(0, 0, 2758, 1650);
        map = game.add.tilemap('map');
        map.addTilesetImage('tileset');
        layer = map.createLayer('Tile Layer 1');
        layer.resizeWorld();
        map.setCollision(1);
        rocks = game.physics.p2.convertTilemap(map, layer);
        //game.physics.p2.enable(layer);
        //layer.body.kinematic = "true";
        game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
        game.stage.disableVisibilityChange = true;
        
        game.renderer.renderSession.roundPixels = true;

        //rocks 
        /*
        rock = game.add.sprite(300,300,'meteor');
        game.physics.p2.enable(rock);
        rock.body.kinematic = "true";
        */
        //rock.body.enable = true;
        //rock.body.immovable = true;
        //rock.body.moves = false;
        
        
        
        

        //bullet creation

        //bullet = game.add.group;
        
        //weapon = game.add.weapon(40,'bullet');
        //weapon.setBulletFrames(0,80,true);
        //weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
        //weapon.bulletSpeed = 400;
        //weapon.fireRate = 100;
        //weapon.angle = 30; 
        //weapon.bulletAngleOffset = 90;

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
        //rock.body.collides(playerCollisionGroup);
        game.physics.p2.updateBoundsCollisionGroup();
        //bullet
        //weapon.trackSprite(player, 0, 0);
        //fireButton = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);


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
        //see about controls
        //this.controlLabel=game.add.text(600,30,'Controls: Arrow Keys \nLaser: Space',{font:'18px Arial',fill:'#ffffff'});
        //this.controlLabel.fixedToCamera = true;
        upKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_8);
        leftKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_4);
        rightKey = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_6);
        fireButton = game.input.keyboard.addKey(Phaser.KeyCode.NUMPAD_0);
    },

    update:function(){
        /*if(suicideButton.isDown){
            console.log(`Died location x:${game.world.centerX}`);
            player.destroy();
            let dieText = this.game.add.text(game.camera.width/2,game.camera.height/2,"You died, reload for a new game.", {font: "30px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 3});
            dieText.anchor.setTo(0.5,0.5);
            dieText.fixedToCamera = true;
            return;
        }*/
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
        if(game.global.health == 0){
            //this.game.add.text(game.world.centerX,game.world.centerY, "You died, reload for a new game.", {font: "30px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 3});
            //this.reloadLabel = game.add.text(280,340,'You died, Reload for a new game.',{font:'35px Arial',fill:'#ffffff'});
        
            let dieText = this.game.add.text(game.camera.width/2,game.camera.height/2,"You died, reload for a new game.", {font: "30px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 3});
            dieText.anchor.setTo(0.5,0.5);
            dieText.fixedToCamera = true;
        }

        
    healthLabel.text='Health:'+game.global.health;
        
       /* if(fireButton.isDown){
            weapon.fireAngle = player.angle - 90;
            weapon.fire();
        }*/
        //for(i=0;i<enemies.length;i++){
        //game.physics.arcade.collide(player,enemies[i].player);
        //}
    },

    movePlayer:function(){
        
        //player.body.velocity.x = 0;
        //player.body.velocity.y = 0;
        //player.body.angularVelocity = 0;

        if (leftKey.isDown) {player.body.rotateLeft(100);}   //ship movement
        else if (rightKey.isDown){player.body.rotateRight(100);}
        else {player.body.setZeroRotation();}
        if (upKey.isDown){player.body.thrust(100);}
        socket.emit('move_player',{x:player.x,y:player.y,angle:player.angle});
    }
};

var game = new Phaser.Game(1300,650,Phaser.AUTO,'gameDiv'); //w=2732, h=1536
game.global={
	health:100
};
game.state.add('play', playState);
game.state.start('play');

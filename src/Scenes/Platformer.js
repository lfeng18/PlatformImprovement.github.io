class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        this.score = 0;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // EC1(a): 查找出生点
        const spawnPoints = this.map.filterObjects("Objects", obj => obj.name === "spawnPoint");
const spawnPoint = spawnPoints.length > 0 ? spawnPoints[0] : {x: 30, y: 345};

// 创建玩家角色（这是唯一创建玩家的地方）
my.sprite.player = this.physics.add.sprite(
    spawnPoint.x, 
    spawnPoint.y, 
    "platformer_characters", 
    "tile_0000.png"
);
my.sprite.player.setCollideWorldBounds(true);
this.physics.add.collider(my.sprite.player, this.groundLayer);

        //EC1(b): 添加跳跃增强道具
        // 创建道具组
this.powerups = this.map.createFromObjects("Objects", {
    name: "powerup",
    key: "tilemap_sheet",
    frame: 67  // 使用不同的帧
});

this.physics.world.enable(this.powerups, Phaser.Physics.Arcade.STATIC_BODY);
this.powerupGroup = this.add.group(this.powerups);

// 添加碰撞检测
this.physics.add.overlap(my.sprite.player, this.powerupGroup, (player, powerup) => {
    powerup.destroy();
    // 增加跳跃高度
    this.JUMP_VELOCITY = -800;
    // 5秒后恢复
    this.time.delayedCall(5000, () => {
        this.JUMP_VELOCITY = -600;
    });
});

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // TODO: Add turn into Arcade Physics here
         // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            // 播放粒子效果
            my.vfx.coinCollect.emitParticleAt(obj2.x, obj2.y);
            // 增加分数
            this.score += 10;
            obj2.destroy(); // remove coin on overlap
        });


        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

          

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        

        this.scoreText = this.add.text(
    10,  // 固定距离左侧10像素
    10,  // 固定距离顶部10像素
    'Score: 0', 
    {
        fontSize: '32px',
        fill: '#ffffff',    // 改为白色
        backgroundColor: '#000000AA',
        padding: { x: 10, y: 5 },
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 2
    }
)
.setScrollFactor(0)
.setDepth(1000)
.setOrigin(0, 0);
    


        //EC2: 硬币收集效果和计分系统
        my.vfx.coinCollect = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_04.png', 'star_05.png'],
            scale: {start: 0.1, end: 0.3},
            lifespan: 500,
            speed: 100,
            gravityY: 200,
            alpha: {start: 1, end: 0},
            quantity: 5,
            blendMode: 'ADD'
        });
        my.vfx.coinCollect.stop();

     
        
        // 为所有硬币应用动画
        this.coinGroup.getChildren().forEach(coin => {
        coin.anims.play('coinSpin');
        });

        // 获取所有水面瓦片
        const waterSprites33 = this.map.createFromTiles(33, 0, {key: 'tilemap_sheet'});
        const waterSprites53 = this.map.createFromTiles(53, 0, {key: 'tilemap_sheet'});

// 合并两个数组
const waterSprites = waterSprites33.concat(waterSprites53);

// 遍历所有水精灵播放动画
waterSprites.forEach(sprite => {
    sprite.anims.play('waterFlow');
    sprite.setDepth(0); // 确保在合适层级
});

        //EC4: 水中粒子效果和重生
        

        my.vfx.waterSplash = this.add.particles(0, 0, "kenny-particles", {
    frame: ['smoke_09.png', 'smoke_10.png'],
    scale: {start: 0.2, end: 0.5},
    lifespan: 10,
    speed: 100,
    gravityY: -100,
    alpha: {start: 1, end: 0},
    quantity: 10,
    blendMode: 'ADD'
});
my.vfx.waterSplash.stop();

    }

    update() {
        this.scoreText.setText(`Score: ${this.score}`);

        if (my.sprite.player.y > this.map.heightInPixels - 50) { // 假设水面在底部
    // 播放水中粒子效果
    my.vfx.waterSplash.emitParticleAt(my.sprite.player.x, my.sprite.player.y);
    
    // 延迟重生玩家
    this.time.delayedCall(20, () => {
        // 查找重生点
        const spawnPoints = this.map.filterObjects("Objects", obj => obj.name === "spawnPoint");
        const spawnPoint = spawnPoints.length > 0 ? spawnPoints[0] : {x: 30, y: 345};
        
        // 重置玩家位置
        my.sprite.player.x = spawnPoint.x;
        my.sprite.player.y = spawnPoint.y;
        my.sprite.player.setVelocity(0, 0);
    });
}

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        
    }
}
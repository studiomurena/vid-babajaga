const config = {
    type: Phaser.AUTO,
    width: 1080,
    height: 1350, // Rapporto 4:5
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// --- BASTONE MAGICO ---
const MODALITA_TEST = false; 
const mTempo = MODALITA_TEST ? 0.1 : 1; 

// Variabili di Scena
let bg1, bg2, bg3, bg4;
let sky1; 
let pav1, pav2, pav3, pav4;
let flashRect, lampoRect, dreamOverlay;

// Attori
let bandSprites = {};
let poliziotti = [];
let baba, furgone;
let ostacoliBosco = [];
let stregheBosco = []; 
let spawnStregheEvent;

let faseVideo = 1; 
let velocitaScorrimento = 2; 
let bossFightBosco = false; 

// Variabili globali per le dimensioni
let W, H, CX, CY, yPavimento, yBand;

// --- ROSTER V2 E NEMICI CONFERMATI (Senza Freaks in gabbia) ---
const membri = ['carma2', 'ferraz2', 'mauri2', 'nan2', 'falcon2'];
const guardie = ['cop', 'copzombie']; 
const nemici = ['drogato', 'strega']; // Mantenuti solo per il Bosco
const animazioni = ['idle', 'run', 'walk', 'attack', 'jump', 'hurt', 'fall', 'hit_react', 'dance'];

function preload() {
    this.load.image('sky1', 'assets/cielo1.png');       
    this.load.image('bg1', 'assets/skyline1.png');     
    this.load.image('bg2', 'assets/boschetto2.png');
    this.load.image('bg3', 'assets/metro-baba3.png');
    this.load.image('bg4', 'assets/skyline10.png');     
    this.load.image('pav1', 'assets/pavimento-milano-baba.png');
    this.load.image('pav2', 'assets/pavimento-boschetto.png');
    this.load.image('pav3', 'assets/pavimento-metro.png');
    this.load.image('pav4', 'assets/pavimento-milano-baba2.png');
    this.load.image('palo', 'assets/obj-palo.png');

    this.load.spritesheet('furgone_idle', 'assets/furgone-idle.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('furgone_run', 'assets/furgone-run.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('furgone_spins', 'assets/furgone-spins.png', { frameWidth: 256, frameHeight: 256 });

    ['idle', 'attack', 'run', 'walk', 'jump', 'hurt', 'fall'].forEach(a => {
        this.load.spritesheet(`baba_${a}`, `assets/baba-${a}.png`, { frameWidth: 256, frameHeight: 256 });
    });

    let tutti = [...membri, ...guardie, ...nemici];
    tutti.forEach(char => {
        animazioni.forEach(anim => {
            this.load.spritesheet(`${char}_${anim}`, `assets/${char}-${anim}.png`, { 
                frameWidth: 256, frameHeight: 256 
            });
        });
    });
}

function create() {
    W = this.cameras.main.width;
    H = this.cameras.main.height;
    CX = W / 2;
    CY = H / 2;
    yPavimento = H - 150; 
    yBand = yPavimento - 150;
    
    // ==========================================================================================
    // --- 1. SETTAGGIO SFONDI, CIELI E PAVIMENTI ---
    
    // ZONA 1: Milano Parallax 1
    sky1 = this.add.tileSprite(CX, CY, W, H, 'sky1').setDepth(-2).setAlpha(0.8);
    let fb1 = this.add.rectangle(CX, CY, W, H, 0x1a1a1a).setDepth(-1).setVisible(false);
    bg1 = this.textures.exists('bg1') ? this.add.tileSprite(CX, CY, W, H, 'bg1') : fb1;
    bg1.setDepth(-1); 
    let fp1 = this.add.rectangle(CX, yPavimento, W, 300, 0x333333).setDepth(2);
    pav1 = this.textures.exists('pav1') ? this.add.tileSprite(CX, yPavimento, W, 300, 'pav1') : fp1;
    pav1.setDepth(2);

    // ZONA 2: Bosco
    let fb2 = this.add.rectangle(CX, CY, W, H, 0x051105).setDepth(0).setVisible(false);
    bg2 = this.textures.exists('bg2') ? this.add.tileSprite(CX, CY, W, H, 'bg2') : fb2;
    let fp2 = this.add.rectangle(CX, yPavimento, W, 300, 0x1c2b1c).setDepth(2).setVisible(false);
    pav2 = this.textures.exists('pav2') ? this.add.tileSprite(CX, yPavimento, W, 300, 'pav2') : fp2;
    bg2.setDepth(0).setAlpha(0.6).setVisible(false); pav2.setDepth(2).setVisible(false);

    // ZONA 3: Metro
    let fb3 = this.add.rectangle(CX, CY, W, H, 0x0d1b2a).setDepth(0).setVisible(false);
    bg3 = this.textures.exists('bg3') ? this.add.tileSprite(CX, CY, W, H, 'bg3') : fb3;
    let fp3 = this.add.rectangle(CX, yPavimento, W, 300, 0x415a77).setDepth(2).setVisible(false);
    pav3 = this.textures.exists('pav3') ? this.add.tileSprite(CX, yPavimento, W, 300, 'pav3') : fp3;
    bg3.setDepth(0).setAlpha(0.5).setVisible(false); pav3.setDepth(2).setVisible(false);

    // ZONA 4: Solo Skyline
    let fb4 = this.add.rectangle(CX, yPavimento/2, W, yPavimento, 0x111111).setDepth(0).setVisible(false);
    bg4 = this.textures.exists('bg4') ? this.add.tileSprite(CX, yPavimento/2, W, yPavimento, 'bg4') : fb4;
    bg4.setDepth(0).setVisible(false); 
    
    let fp4 = this.add.rectangle(CX, yPavimento, W, 300, 0x222222).setDepth(2).setVisible(false);
    pav4 = this.textures.exists('pav4') ? this.add.tileSprite(CX, yPavimento, W, 300, 'pav4') : fp4;
    pav4.setDepth(2).setVisible(false);

    // --- TRICK DELL'OMBRA ---
    let ombraSfondo = this.add.graphics();
    ombraSfondo.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 1, 1);
    ombraSfondo.fillRect(0, yPavimento - 180, W, 180); 
    ombraSfondo.setDepth(1.5); 
    
    let ombraPavimento = this.add.graphics();
    ombraPavimento.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.9, 0.9, 0, 0); 
    ombraPavimento.fillRect(0, yPavimento, W, 70); 
    ombraPavimento.setDepth(2.1); 

    // --- EFFETTI SPECIALI ---
    flashRect = this.add.rectangle(CX, CY, W, H, 0xffffff).setDepth(100).setAlpha(0);
    dreamOverlay = this.add.rectangle(CX, CY, W, H, 0x440066).setDepth(90).setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN);
    lampoRect = this.add.rectangle(CX, CY, W, H, 0xffaa00).setDepth(90).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    
    this.time.addEvent({
        delay: Phaser.Math.Between(1000, 2000) * mTempo, // Più frequente visti i tempi brevi
        loop: true,
        callback: () => {
            if (faseVideo === 1) {
                lampoRect.fillColor = Phaser.Math.RND.pick([0xff8800, 0xffaa00, 0xffee88]);
                this.tweens.add({ targets: lampoRect, alpha: 0.35, duration: 60, yoyo: true, repeat: Phaser.Math.Between(1, 3) });
            }
        }
    });

    // --- 2. GENERAZIONE ANIMAZIONI ---
    let tuttiAsset = [...membri, ...guardie, ...nemici, 'baba'];
    tuttiAsset.forEach(char => {
        animazioni.forEach(anim => {
            if (this.textures.exists(`${char}_${anim}`)) {
                this.anims.create({
                    key: `${char}_${anim}_anim`,
                    frames: this.anims.generateFrameNumbers(`${char}_${anim}`),
                    frameRate: 15, repeat: (anim === 'fall' || anim === 'fall2') ? 0 : -1
                });
            }
        });
    });

    if (this.textures.exists('furgone_run')) this.anims.create({ key: 'furgone_run_anim', frames: this.anims.generateFrameNumbers('furgone_run'), frameRate: 20, repeat: -1 });
    if (this.textures.exists('furgone_idle')) this.anims.create({ key: 'furgone_idle_anim', frames: this.anims.generateFrameNumbers('furgone_idle'), frameRate: 10, repeat: -1 });

    // --- 3. INSERIMENTO ATTORI ---
    let gap = 100;
    let posizioniBandX = { 
        'carma2': CX - (gap * 2), 
        'ferraz2': CX - gap, 
        'mauri2': CX, 
        'nan2': CX + gap, 
        'falcon2': CX + (gap * 2) 
    };
    
    membri.forEach(m => {
        bandSprites[m] = this.add.sprite(posizioniBandX[m], yBand, `${m}_walk`).setDepth(4).setScale(2);
        let startAnim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : (this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_run_anim`);
        if (startAnim) bandSprites[m].play(startAnim);
    });

    baba = this.add.sprite(W + 300, yBand - 30, 'baba_idle').setDepth(5).setScale(2.5).setFlipX(true);
    furgone = this.add.sprite(W + 600, yBand - 130, 'furgone_run').setDepth(6).setScale(4.5).setFlipX(true).setVisible(false);

    // Ostacoli solo per il Bosco
    for(let i=0; i<4; i++) {
        let p = this.add.image(W + 200 + (i*800), yBand - 180, 'palo').setDepth(1).setScale(1.5).setVisible(false);
        let d = this.add.sprite(W + 500 + (i*800), yBand, 'drogato_walk').setDepth(3).setScale(1.8).setFlipX(true).setVisible(false); 
        if (this.anims.exists('drogato_walk_anim')) d.play('drogato_walk_anim');
        ostacoliBosco.push(p, d); 
    }

    spawnStregheEvent = this.time.addEvent({
        delay: 800 * mTempo, 
        loop: true,
        callback: () => {
            if (faseVideo === 2 && !bossFightBosco) {
                let pioveDalCielo = Math.random() > 0.5;
                
                if (pioveDalCielo) {
                    let startX = Phaser.Math.Between(50, W - 100); 
                    let strega = this.add.sprite(startX, -200, 'strega_run').setDepth(4).setScale(2);
                    strega.setFlipX(false); 
                    if (this.anims.exists('strega_run_anim')) strega.play('strega_run_anim');
                    
                    this.time.addEvent({
                        delay: 90, loop: true,
                        callback: () => {
                            if (strega && strega.active) {
                                if (Math.random() > 0.5) strega.setTint(0xff00ff, 0x00ffff, 0xffffff, 0xffffff);
                                else strega.clearTint();
                                strega.alpha = Math.random() > 0.8 ? 0.4 : 1;
                            }
                        }
                    });

                    this.tweens.add({
                        targets: strega, y: yBand, duration: 400 * mTempo, ease: 'Quad.easeIn',
                        onComplete: () => {
                            this.tweens.add({ targets: strega, x: startX + 100, duration: 1000 * mTempo });
                            this.tweens.add({ targets: strega, alpha: 0, duration: 500 * mTempo, delay: 500 * mTempo, onComplete: () => strega.destroy() });
                        }
                    });
                } else {
                    let startX = Phaser.Math.Between(W + 100, W + 500); 
                    let strega = this.add.sprite(startX, yBand, 'strega_idle').setDepth(4).setScale(2);
                    strega.setFlipX(true); 
                    if (this.anims.exists('strega_idle_anim')) strega.play('strega_idle_anim');
                    strega.customState = 'waiting';
                    
                    this.time.addEvent({
                        delay: 90, loop: true,
                        callback: () => {
                            if (strega && strega.active) {
                                if (Math.random() > 0.5) strega.setTint(0xff00ff, 0x00ffff, 0xffffff, 0xffffff);
                                else strega.clearTint();
                                strega.alpha = Math.random() > 0.8 ? 0.4 : 1;
                            }
                        }
                    });

                    let flame = this.add.circle(startX, yBand, 80, 0xff00ff).setDepth(4.1).setBlendMode(Phaser.BlendModes.ADD); 
                    this.tweens.add({ targets: flame, scale: 2.5, alpha: 0, duration: 600 * mTempo, onComplete: () => flame.destroy() });
                    
                    stregheBosco.push(strega); 
                }
            }
        }
    });

    // ==========================================
    // --- 4. LA REGIA DEL VIDEO (40 SECONDI TOTALI) ---
    // ==========================================

    // SECONDO 4: Cops arrivano e Band inizia a correre
    this.time.delayedCall(4000 * mTempo, () => {
        velocitaScorrimento = 5; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_run_anim`) ? `${m}_run_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });
        
        for(let i=0; i<3; i++) {
            let cop = this.add.sprite(-200 - (i*150), yBand, 'cop_run').setDepth(4).setScale(2);
            if (this.anims.exists('cop_run_anim')) cop.play('cop_run_anim');
            poliziotti.push(cop);
            this.tweens.add({ targets: cop, x: 50 + (i*80), duration: 2000 * mTempo, ease: 'Linear' });
        }
    });

    // SECONDO 7: Baba entra in scena (Milano 1)
    this.time.delayedCall(7000 * mTempo, () => {
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        this.tweens.add({ targets: baba, x: W - 150, duration: 1500 * mTempo, ease: 'Power2' });
    });

    // SECONDO 9: Baba attacca prima del flash
    this.time.delayedCall(9000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
    });

    // SECONDO 10: Flash bianco e passaggio in ZONA 2 (Bosco)
    this.time.delayedCall(10000 * mTempo, () => {
        this.tweens.add({
            targets: flashRect, alpha: 1, duration: 300 * mTempo,
            onComplete: () => {
                faseVideo = 2;
                velocitaScorrimento = 5; 
                baba.x = W + 600; 

                sky1.setVisible(false); bg1.setVisible(false); pav1.setVisible(false);
                bg2.setVisible(true); pav2.setVisible(true);
                ostacoliBosco.forEach(o => o.setVisible(true));

                poliziotti.forEach(p => p.destroy()); poliziotti = [];
                
                this.time.delayedCall(200 * mTempo, () => {
                    this.tweens.add({ targets: flashRect, alpha: 0, duration: 300 * mTempo });
                });
            }
        });
    });

    // SECONDO 16: Boss Fight Bosco (Stop scroll e Streghe spariscono)
    this.time.delayedCall(16000 * mTempo, () => {
        bossFightBosco = true; 
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        stregheBosco.forEach(s => {
            if(s.active) this.tweens.add({targets: s, alpha: 0, duration: 300, onComplete: () => s.destroy()});
        });
        stregheBosco = [];

        ostacoliBosco.forEach(o => {
            this.tweens.add({targets: o, alpha: 0, duration: 500 * mTempo, onComplete: () => o.setVisible(false)});
        });

        baba.x = W - 200;
        baba.setScale(3); 
        baba.setTint(0xff00ff); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        
        this.tweens.add({ targets: baba, x: '+=20', y: '-=10', duration: 50, yoyo: true, repeat: -1 });
    });

    // SECONDO 18: Baba attacca e Band viene colpita
    this.time.delayedCall(18000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
        
        membri.forEach(m => {
            if (this.anims.exists(`${m}_hurt_anim`)) bandSprites[m].play(`${m}_hurt_anim`);
            this.tweens.add({ targets: bandSprites[m], x: '-=50', duration: 200 * mTempo });
        });
    });

    // SECONDO 19: Band cade a terra
    this.time.delayedCall(19000 * mTempo, () => {
        membri.forEach(m => {
            if (this.anims.exists(`${m}_fall_anim`)) bandSprites[m].play(`${m}_fall_anim`);
        });
    });

    // SECONDO 20: Zoom e transizione Dream Overlay verso Metro (ZONA 3)
    this.time.delayedCall(20000 * mTempo, () => {
        this.cameras.main.zoomTo(3, 1000 * mTempo); 
        this.tweens.add({ targets: dreamOverlay, alpha: 1, duration: 1000 * mTempo });
        
        this.time.delayedCall(1000 * mTempo, () => {
            this.tweens.add({
                targets: flashRect, alpha: 1, duration: 300 * mTempo,
                onComplete: () => {
                    faseVideo = 3;
                    bossFightBosco = false;
                    velocitaScorrimento = 2.5; 
                    
                    this.cameras.main.setZoom(1);
                    this.cameras.main.setAngle(0);
                    this.tweens.killTweensOf(baba);
                    baba.setTint(0xffffff); 
                    
                    baba.setAlpha(0);
                    baba.x = W + 600;

                    membri.forEach(m => { 
                        bandSprites[m].x = posizioniBandX[m]; 
                        let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`;
                        if (anim) bandSprites[m].play(anim); 
                    });

                    bg2.setVisible(false); pav2.setVisible(false);
                    bg3.setVisible(true); pav3.setVisible(true);
                    
                    this.time.delayedCall(300 * mTempo, () => {
                        this.tweens.add({ targets: flashRect, alpha: 0, duration: 300 * mTempo });
                    });
                }
            });
        });
    });

    // SECONDO 25: BABA SCIVOLA DAL BUIO IN METRO (Senza Freaks)
    this.time.delayedCall(25000 * mTempo, () => {
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        baba.x = W + 400; 
        baba.setScale(4.0); 
        baba.setAlpha(0); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        
        this.tweens.add({
            targets: baba, x: W - 300, alpha: 1, duration: 2000 * mTempo, ease: 'Power2'
        });
    });

    // SECONDO 28: ATTACCO DI GRUPPO DELLA BAND E MORTE ESPLOSIVA
    this.time.delayedCall(28000 * mTempo, () => {
        membri.forEach(m => {
            if (this.anims.exists(`${m}_attack_anim`)) bandSprites[m].play(`${m}_attack_anim`);
        });

        if (this.anims.exists('baba_hurt_anim')) baba.play('baba_hurt_anim');
        
        this.tweens.add({ targets: baba, x: '+=40', y: '-=20', duration: 40, yoyo: true, repeat: 75 }); 
        
        this.time.addEvent({
            delay: 100 * mTempo, repeat: 40,
            callback: () => baba.setTint(Phaser.Math.RND.pick([0xff0000, 0x000000, 0xffffff, 0xff00ff, 0xffaa00]))
        });

        let explEvent = this.time.addEvent({
            delay: 100 * mTempo, repeat: 20,
            callback: () => {
                let exX = baba.x + Phaser.Math.Between(-200, 200);
                let exY = baba.y + Phaser.Math.Between(-300, 200);
                let expl = this.add.circle(exX, exY, 20, Phaser.Math.RND.pick([0xffaa00, 0xff0000, 0xffffff])).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({ targets: expl, scale: 15, alpha: 0, duration: 400 * mTempo, onComplete: () => expl.destroy() });
            }
        });

        // Dissoluzione veloce
        this.tweens.add({ targets: baba, alpha: 0, scale: 0, duration: 1500 * mTempo, delay: 2000 * mTempo, ease: 'Back.easeIn' }); 
    });

    // SECONDO 33: FLASH E ULTIMA PASSEGGIATA (ZONA 4)
    this.time.delayedCall(33000 * mTempo, () => {
        this.tweens.add({
            targets: flashRect, alpha: 1, duration: 400 * mTempo,
            onComplete: () => {
                faseVideo = 4;
                velocitaScorrimento = 3; 
                
                membri.forEach(m => { 
                    let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`; 
                    if (anim) bandSprites[m].play(anim); 
                });

                bg3.setVisible(false); pav3.setVisible(false);
                bg4.setVisible(true); pav4.setVisible(true); 
                
                this.time.delayedCall(300 * mTempo, () => {
                    this.tweens.add({ targets: flashRect, alpha: 0, duration: 400 * mTempo });
                });
            }
        });
    });

    // SECONDO 36: Arriva il Furgone
    this.time.delayedCall(36000 * mTempo, () => {
        furgone.x = W + 600;
        furgone.setVisible(true); 
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: CX, duration: 1500 * mTempo, ease: 'Power2' }); 
    });

    // SECONDO 38: Furgone Inchioda, Band sale
    this.time.delayedCall(38000 * mTempo, () => {
        velocitaScorrimento = 0; 
        if (this.anims.exists('furgone_idle_anim')) furgone.play('furgone_idle_anim');
        
        membri.forEach(m => {
            if (this.anims.exists(`${m}_idle_anim`)) bandSprites[m].play(`${m}_idle_anim`);
            this.tweens.add({ targets: bandSprites[m], alpha: 0, y: yBand - 80, duration: 400 * mTempo });
        });
    });

    // SECONDO 40: Furgone schizza via
    this.time.delayedCall(40000 * mTempo, () => {
        furgone.setFlipX(false); 
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: -1000, duration: 1500 * mTempo, ease: 'Power2' });
    });
}

function update() {
    let intensity = {
        1: { z: 0.005, a: 0.1, alpha: 0.1 },   
        2: { z: 0.030, a: 0.6, alpha: 0.4 },   
        3: { z: 0.002, a: 0.05, alpha: 0.05 }, 
        4: { z: 0.001, a: 0.02, alpha: 0.02 }  
    };
    
    if (faseVideo !== 2 || !bossFightBosco) {
        let curInt = intensity[faseVideo];
        this.cameras.main.setZoom(1.0 + Math.abs(Math.sin(this.time.now * 0.002)) * curInt.z);
        this.cameras.main.setAngle(Math.sin(this.time.now * 0.001) * curInt.a);
        dreamOverlay.setAlpha(curInt.alpha + Math.sin(this.time.now * 0.005) * (curInt.alpha * 0.2));
    }

    if (faseVideo === 2 && !bossFightBosco) {
        for (let i = stregheBosco.length - 1; i >= 0; i--) {
            let s = stregheBosco[i];
            if (!s.active) {
                stregheBosco.splice(i, 1);
                continue;
            }
            if (s.customState === 'waiting') {
                s.x -= velocitaScorrimento * 3; 
                if (s.x < CX + 100) { 
                    s.customState = 'chasing';
                    s.setFlipX(false); 
                    if (this.anims.exists('strega_run_anim')) s.play('strega_run_anim');
                    
                    this.tweens.add({ targets: s, x: CX, duration: 1000 * mTempo, ease: 'Linear' });
                    this.tweens.add({ targets: s, alpha: 0, duration: 500 * mTempo, delay: 1000 * mTempo, onComplete: () => s.destroy() });
                }
            }
        }
    }

    if (faseVideo === 1) {
        sky1.tilePositionX += velocitaScorrimento * 0.2; 
        bg1.tilePositionX += velocitaScorrimento * 1; 
        pav1.tilePositionX += velocitaScorrimento * 3; 
    } else if (faseVideo === 2) {
        bg2.tilePositionX += velocitaScorrimento * 0.5;
        pav2.tilePositionX += velocitaScorrimento * 3;
        
        if (!bossFightBosco) {
            ostacoliBosco.forEach(o => {
                if(o.active && o.visible) {
                    o.x -= velocitaScorrimento * 4.5;
                    if (o.x < -200) o.x = W + 500 + Math.random() * 1000;
                }
            });
        }
    } else if (faseVideo === 3) {
        bg3.tilePositionX += velocitaScorrimento * 0.5;
        pav3.tilePositionX += velocitaScorrimento * 3;
    } else if (faseVideo === 4) {
        bg4.tilePositionX += velocitaScorrimento * 1; 
        pav4.tilePositionX += velocitaScorrimento * 3; 
    }
}

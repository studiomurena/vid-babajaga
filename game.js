const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// --- BASTONE MAGICO ---
// TRUE: Il video dura 18 secondi (test) | FALSE: Il video dura 3 minuti reali (live)
const MODALITA_TEST = false; 
const mTempo = MODALITA_TEST ? 0.1 : 1; 

// Variabili di Scena
let bg1, bg2, bg3, bg4;
let pav1, pav2, pav3, pav4;
let flashRect, lampoRect, dreamOverlay;

// Attori
let bandSprites = {};
let poliziotti = [];
let baba, furgone;
let creatureGabbie = [];
let ostacoliBosco = [];
let spawnZombieEvent;

let faseVideo = 1; // 1: Milano1, 2: Bosco, 3: Metro, 4: Milano2
let velocitaScorrimento = 2; 

// --- ROSTER V2 E FREAKS CONFERMATI ---
const membri = ['carma2', 'ferraz2', 'mauri2', 'nan2', 'falcon2'];
const guardie = ['cop', 'copzombie'];
const creature = ['drogato', 'murena', 'pigeon', 'beeman', 'franken', 'nano', 'ornitorincoman', 'orologioman', 'radioman'];
const animazioni = ['idle', 'run', 'walk', 'attack', 'jump', 'hurt', 'fall', 'hit_react', 'dance'];

function preload() {
    this.load.image('bg1', 'assets/milano-baba1.png');
    this.load.image('bg2', 'assets/boschetto2.png');
    this.load.image('bg3', 'assets/metro-baba3.png');
    this.load.image('bg4', 'assets/milano-baba4.png');

    this.load.image('pav1', 'assets/pavimento-milano-baba.png');
    this.load.image('pav2', 'assets/pavimento-boschetto.png');
    this.load.image('pav3', 'assets/pavimento-metro.png');
    this.load.image('pav4', 'assets/pavimento-milano-baba2.png');

    this.load.image('palo', 'assets/obj-palo.png');

    this.load.spritesheet('furgone_idle', 'assets/furgone-idle.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('furgone_run', 'assets/furgone-run.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('furgone_spins', 'assets/furgone-spins.png', { frameWidth: 256, frameHeight: 256 });

    ['idle', 'attack', 'run', 'walk', 'jump'].forEach(a => {
        this.load.spritesheet(`baba_${a}`, `assets/baba-${a}.png`, { frameWidth: 256, frameHeight: 256 });
    });

    let tutti = [...membri, ...guardie, ...creature];
    tutti.forEach(char => {
        animazioni.forEach(anim => {
            this.load.spritesheet(`${char}_${anim}`, `assets/${char}-${anim}.png`, { 
                frameWidth: 256, frameHeight: 256 
            });
        });
    });
}

function create() {
    let yPavimento = 930;
    
    // --- 1. SETTAGGIO SFONDI SCURI E PAVIMENTI ---
    let fb1 = this.add.rectangle(960, 540, 1920, 1080, 0x1a1a1a).setDepth(0);
    bg1 = this.textures.exists('bg1') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg1') : fb1;
    let fp1 = this.add.rectangle(960, yPavimento, 1920, 300, 0x333333).setDepth(2);
    pav1 = this.textures.exists('pav1') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav1') : fp1;
    bg1.setDepth(0).setAlpha(0.65); pav1.setDepth(2);

    let fb2 = this.add.rectangle(960, 540, 1920, 1080, 0x051105).setDepth(0).setVisible(false);
    bg2 = this.textures.exists('bg2') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg2') : fb2;
    let fp2 = this.add.rectangle(960, yPavimento, 1920, 300, 0x1c2b1c).setDepth(2).setVisible(false);
    pav2 = this.textures.exists('pav2') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav2') : fp2;
    bg2.setDepth(0).setAlpha(0.6).setVisible(false); pav2.setDepth(2).setVisible(false);

    let fb3 = this.add.rectangle(960, 540, 1920, 1080, 0x0d1b2a).setDepth(0).setVisible(false);
    bg3 = this.textures.exists('bg3') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg3') : fb3;
    let fp3 = this.add.rectangle(960, yPavimento, 1920, 300, 0x415a77).setDepth(2).setVisible(false);
    pav3 = this.textures.exists('pav3') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav3') : fp3;
    bg3.setDepth(0).setAlpha(0.5).setVisible(false); pav3.setDepth(2).setVisible(false);

    let fb4 = this.add.rectangle(960, 540, 1920, 1080, 0x111111).setDepth(0).setVisible(false);
    bg4 = this.textures.exists('bg4') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg4') : fb4;
    let fp4 = this.add.rectangle(960, yPavimento, 1920, 300, 0x222222).setDepth(2).setVisible(false);
    pav4 = this.textures.exists('pav4') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav4') : fp4;
    bg4.setDepth(0).setAlpha(0.65).setVisible(false); pav4.setDepth(2).setVisible(false);

    // ==========================================================================================
    // --- L'OMBRA ORIZZONTE (DEPTH FIX) ---
    // Questi grafici creano la profondità tra i piani
    
    // Gradiente verticale nero DIETRO al pavimento (Depth 1.5) per sfumare l'orizzonte
    let ombraSfondo = this.add.graphics();
    ombraSfondo.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 1, 1);
    ombraSfondo.fillRect(0, yPavimento - 120, 1920, 120); 
    ombraSfondo.setDepth(1.5); 
    
    // Gradiente verticale nero SOPRA al pavimento (Depth 2.1) per ancorare i piedi
    let ombraPavimento = this.add.graphics();
    ombraPavimento.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0);
    ombraPavimento.fillRect(0, yPavimento, 1920, 50); 
    ombraPavimento.setDepth(2.1); 
    // ==========================================================================================

    // --- EFFETTI SPECIALI (Overlay e Lampi) ---
    flashRect = this.add.rectangle(960, 540, 1920, 1080, 0xffffff).setDepth(100).setAlpha(0);
    dreamOverlay = this.add.rectangle(960, 540, 1920, 1080, 0x440066).setDepth(90).setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN);

    lampoRect = this.add.rectangle(960, 540, 1920, 1080, 0xffaa00).setDepth(90).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.time.addEvent({
        delay: Phaser.Math.Between(4000, 7000) * mTempo,
        loop: true,
        callback: () => {
            if (faseVideo === 1 || faseVideo === 4) {
                lampoRect.fillColor = Phaser.Math.RND.pick([0xff8800, 0xffaa00, 0xffee88]);
                this.tweens.add({ targets: lampoRect, alpha: 0.35, duration: 60, yoyo: true, repeat: Phaser.Math.Between(1, 3) });
            }
        }
    });

    // --- 2. GENERAZIONE ANIMAZIONI ---
    let tuttiAsset = [...membri, ...guardie, ...creature, 'baba'];
    tuttiAsset.forEach(char => {
        animazioni.forEach(anim => {
            if (this.textures.exists(`${char}_${anim}`)) {
                this.anims.create({
                    key: `${char}_${anim}_anim`,
                    frames: this.anims.generateFrameNumbers(`${char}_${anim}`),
                    frameRate: 15, repeat: -1
                });
            }
        });
    });

    if (this.textures.exists('furgone_run')) this.anims.create({ key: 'furgone_run_anim', frames: this.anims.generateFrameNumbers('furgone_run'), frameRate: 20, repeat: -1 });
    if (this.textures.exists('furgone_idle')) this.anims.create({ key: 'furgone_idle_anim', frames: this.anims.generateFrameNumbers('furgone_idle'), frameRate: 10, repeat: -1 });

    // --- 3. INSERIMENTO ATTORI ---
    let posizioniX = { 'carma2': 600, 'ferraz2': 700, 'mauri2': 800, 'nan2': 900, 'falcon2': 1000 };
    
    membri.forEach(m => {
        bandSprites[m] = this.add.sprite(posizioniX[m], 780, `${m}_walk`).setDepth(4).setScale(2);
        let startAnim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : (this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_run_anim`);
        if (startAnim) bandSprites[m].play(startAnim);
    });

    baba = this.add.sprite(2200, 750, 'baba_idle').setDepth(5).setScale(2.5).setFlipX(true);
    // FURGONE GIGANTESCO (Scala 6.5)
    furgone = this.add.sprite(2500, 650, 'furgone_run').setDepth(6).setScale(6.5).setFlipX(true);

    // --- SCENOGRAFIA ZONA 2 (Pali e Drogati Girati) ---
    for(let i=0; i<4; i++) {
        let p = this.add.image(2000 + (i*800), 600, 'palo').setDepth(1).setScale(1.5).setVisible(false);
        let d = this.add.sprite(2300 + (i*800), 780, 'drogato_walk').setDepth(3).setScale(1.8).setFlipX(true).setVisible(false); 
        if (this.anims.exists('drogato_walk_anim')) d.play('drogato_walk_anim');
        ostacoliBosco.push(p, d); 
    }

    // --- SCENOGRAFIA ZONA 3 (METRO: Tutti e 9 i Mostri, Profondità perfetta) ---
    let creatureRandom = Phaser.Utils.Array.Shuffle([...creature]); // Li usa TUTTI E 9
    
    creatureRandom.forEach((c, i) => {
        // Depth 2.5 = Sopra il pavimento(2), ma dietro le sbarre(2.8).
        let creatura = this.add.sprite(2000 + (i*500), 800, `${c}_idle`).setDepth(2.5).setScale(1.5).setVisible(false);
        
        let fallBackAnim = this.anims.exists(`${c}_idle_anim`) ? `${c}_idle_anim` : 
                          (this.anims.exists(`${c}_dance_anim`) ? `${c}_dance_anim` : 
                          (this.anims.exists(`${c}_walk_anim`) ? `${c}_walk_anim` : `${c}_run_anim`));
                          
        if (fallBackAnim) creatura.play(fallBackAnim);
        
        let gabbia = this.add.graphics().setDepth(2.8).setVisible(false); // Sbarre davanti alla creatura
        creatura.gabbiaRef = gabbia;
        creatura.baseX = 2000 + (i*500);
        creatureGabbie.push(creatura);
    });

    // --- EVENTO GENERATORE ZOMBIE (Si perdono, piovono, impazziscono) ---
    spawnZombieEvent = this.time.addEvent({
        delay: 800 * mTempo,
        loop: true,
        callback: () => {
            if (faseVideo === 2) {
                let startX = Phaser.Math.Between(100, 1920);
                let pioveDalCielo = Math.random() > 0.4;
                let zop = this.add.sprite(startX, pioveDalCielo ? -200 : 780, 'copzombie_run').setDepth(4).setScale(2);
                
                if (Math.random() > 0.5) zop.setFlipX(true); 
                if (this.anims.exists('copzombie_run_anim')) zop.play('copzombie_run_anim');
                
                if (pioveDalCielo) {
                    this.tweens.add({
                        targets: zop, y: 780, angle: 360, duration: 1500 * mTempo, ease: 'Bounce.easeOut',
                        onComplete: () => {
                            zop.angle = 0;
                            this.tweens.add({ targets: zop, x: zop.x + (zop.flipX ? 800 : -800), alpha: 0, duration: 2000 * mTempo, onComplete: () => zop.destroy() });
                        }
                    });
                } else {
                    this.tweens.add({ targets: zop, x: zop.x + (zop.flipX ? 1200 : -1200), alpha: 0, duration: 3000 * mTempo, onComplete: () => zop.destroy() });
                }
            }
        }
    });

    // ==========================================
    // --- 4. LA REGIA DEL VIDEO (TIMELINE) ---
    // ==========================================

    // MINUTO 0:20 (20s) - Milano Inseguimento Lento
    this.time.delayedCall(20000 * mTempo, () => {
        velocitaScorrimento = 5; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_run_anim`) ? `${m}_run_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });
        
        for(let i=0; i<3; i++) {
            let cop = this.add.sprite(-200 - (i*150), 780, 'cop_run').setDepth(4).setScale(2);
            if (this.anims.exists('cop_run_anim')) cop.play('cop_run_anim');
            poliziotti.push(cop);
            this.tweens.add({ targets: cop, x: 50 + (i*80), duration: 2000 * mTempo, ease: 'Linear' });
        }
    });

    // MINUTO 0:35 (35s) - Baba Jaga
    this.time.delayedCall(35000 * mTempo, () => {
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        this.tweens.add({ targets: baba, x: 1600, duration: 2000 * mTempo, ease: 'Power2' });
    });

    // MINUTO 0:40 (40s) - BABA ATTACCA E TELETRASPORTA
    this.time.delayedCall(40000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
    });
    this.time.delayedCall(42000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });

    // MINUTO 0:42 (42s) - BOSCO (Sogno Lucido Maximo)
    this.time.delayedCall(42500 * mTempo, () => {
        faseVideo = 2;
        velocitaScorrimento = 7; 
        baba.x = 2500; 
        
        bg1.setVisible(false); pav1.setVisible(false);
        bg2.setVisible(true); pav2.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(true));

        poliziotti.forEach(p => p.destroy()); poliziotti = [];
    });

    // MINUTO 1:20 (80s) - TELETRASPORTO ZONA 3 (Metro)
    this.time.delayedCall(80000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });
    this.time.delayedCall(80500 * mTempo, () => {
        faseVideo = 3;
        velocitaScorrimento = 2.5; // Walk Lenta
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        bg2.setVisible(false); pav2.setVisible(false);
        bg3.setVisible(true); pav3.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(false));
        
        creatureGabbie.forEach(c => { c.setVisible(true); c.gabbiaRef.setVisible(true); });
    });

    // MINUTO 2:20 (140s) - TELETRASPORTO FINALE ZONA 4 (Milano 2)
    this.time.delayedCall(140000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });
    this.time.delayedCall(140500 * mTempo, () => {
        faseVideo = 4;
        velocitaScorrimento = 4; // Tornano a camminare veloci
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_run_anim`) ? `${m}_run_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        bg3.setVisible(false); pav3.setVisible(false);
        bg4.setVisible(true); pav4.setVisible(true);
        creatureGabbie.forEach(c => { c.setVisible(false); c.gabbiaRef.setVisible(false); });
    });

    // MINUTO 2:25 (145s) - Si fermano
    this.time.delayedCall(145000 * mTempo, () => {
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });
    });

    // MINUTO 2:35 (155s) - Arriva il Furgone Titano
    this.time.delayedCall(155000 * mTempo, () => {
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: 800, duration: 3000 * mTempo, ease: 'Power2' });
    });

    // MINUTO 2:38 (158s) - Furgone Inchioda
    this.time.delayedCall(158000 * mTempo, () => {
        if (this.anims.exists('furgone_idle_anim')) furgone.play('furgone_idle_anim');
        membri.forEach(m => {
            this.tweens.add({ targets: bandSprites[m], alpha: 0, y: 700, duration: 500 * mTempo });
        });
    });

    // MINUTO 2:45 (165s) - Furgone schizza via
    this.time.delayedCall(165000 * mTempo, () => {
        furgone.setFlipX(false); 
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: -1000, duration: 2000 * mTempo, ease: 'Power2' });
    });
}

function update() {
    // --- CAMERA E SOGNO LUCIDO DINAMICO ---
    let intensity = {
        1: { z: 0.005, a: 0.1, alpha: 0.1 },   // Milano 1: pochissimo
        2: { z: 0.030, a: 0.6, alpha: 0.4 },   // Bosco: TOP TRIP
        3: { z: 0.002, a: 0.05, alpha: 0.05 }, // Metro: quasi zero
        4: { z: 0.001, a: 0.02, alpha: 0.02 }  // Milano 4: residuo
    };
    
    let curInt = intensity[faseVideo];
    this.cameras.main.setZoom(1.0 + Math.abs(Math.sin(this.time.now * 0.002)) * curInt.z);
    this.cameras.main.setAngle(Math.sin(this.time.now * 0.001) * curInt.a);
    dreamOverlay.setAlpha(curInt.alpha + Math.sin(this.time.now * 0.005) * (curInt.alpha * 0.2));

    // --- SCORRIMENTO SFONDI E OSTACOLI ---
    if (faseVideo === 1) {
        bg1.tilePositionX += velocitaScorrimento * 0.5;
        pav1.tilePositionX += velocitaScorrimento * 3;
    } else if (faseVideo === 2) {
        bg2.tilePositionX += velocitaScorrimento * 0.5;
        pav2.tilePositionX += velocitaScorrimento * 3;
        
        ostacoliBosco.forEach(o => {
            // I drogati vanno nel verso opposto, quindi scorrono PIÙ veloci del background
            o.x -= velocitaScorrimento * 4.5;
            if (o.x < -200) o.x = 2500 + Math.random() * 1000;
        });
    } else if (faseVideo === 3) {
        bg3.tilePositionX += velocitaScorrimento * 0.5;
        pav3.tilePositionX += velocitaScorrimento * 3;
        
        creatureGabbie.forEach(c => {
            c.x -= velocitaScorrimento * 3;
            
            c.gabbiaRef.clear();
            c.gabbiaRef.lineStyle(6, 0xff00ff, 0.8);
            for(let s=0; s<6; s++) {
                c.gabbiaRef.moveTo(c.x - 100 + (s*40), 650); // Partono da più giù per non tagliare la testa
                c.gabbiaRef.lineTo(c.x - 100 + (s*40), 950);
            }
            c.gabbiaRef.strokePath();

            if (c.x < -300) c.x = c.baseX + (9 * 500) - 300; // Riposiziona a catena
        });
    } else if (faseVideo === 4) {
        bg4.tilePositionX += velocitaScorrimento * 0.5;
        pav4.tilePositionX += velocitaScorrimento * 3;
    }
}

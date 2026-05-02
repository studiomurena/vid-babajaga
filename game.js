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
let zombiesBosco = []; // Array dedicato per gli zombie fiamma
let spawnZombieEvent;

let faseVideo = 1; // 1: Milano1, 2: Bosco, 3: Metro, 4: Milano2
let velocitaScorrimento = 2; 
let bossFightBosco = false; 

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

    ['idle', 'attack', 'run', 'walk', 'jump', 'hurt', 'fall'].forEach(a => {
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

    // --- OMBRA DI PROFONDITÀ ---
    let ombraSfondo = this.add.graphics();
    ombraSfondo.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 1, 1);
    ombraSfondo.fillRect(0, yPavimento - 120, 1920, 120); 
    ombraSfondo.setDepth(1.5); 
    
    let ombraPavimento = this.add.graphics();
    ombraPavimento.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0);
    ombraPavimento.fillRect(0, yPavimento, 1920, 50); 
    ombraPavimento.setDepth(2.1); 

    // --- EFFETTI SPECIALI ---
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
                    frameRate: 15, repeat: (anim === 'fall') ? 0 : -1 
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
    furgone = this.add.sprite(2500, 650, 'furgone_run').setDepth(6).setScale(6.5).setFlipX(true);

    // --- SCENOGRAFIA ZONA 2 (Bosco) ---
    for(let i=0; i<4; i++) {
        let p = this.add.image(2000 + (i*800), 600, 'palo').setDepth(1).setScale(1.5).setVisible(false);
        let d = this.add.sprite(2300 + (i*800), 780, 'drogato_walk').setDepth(3).setScale(1.8).setFlipX(true).setVisible(false); 
        if (this.anims.exists('drogato_walk_anim')) d.play('drogato_walk_anim');
        ostacoliBosco.push(p, d); 
    }

    // --- SCENOGRAFIA ZONA 3 (Metro: Pool di 10 Mostri) ---
    let poolCreature = Phaser.Utils.Array.Shuffle([...creature, ...creature]).slice(0, 10);
    
    poolCreature.forEach((c, i) => {
        let creatura = this.add.sprite(2000 + (i*700), 800, `${c}_idle`).setDepth(3.5).setScale(1.5).setVisible(false); 
        
        let fallBackAnim = this.anims.exists(`${c}_idle_anim`) ? `${c}_idle_anim` : 
                          (this.anims.exists(`${c}_dance_anim`) ? `${c}_dance_anim` : 
                          (this.anims.exists(`${c}_walk_anim`) ? `${c}_walk_anim` : `${c}_run_anim`));
                          
        if (fallBackAnim) creatura.play(fallBackAnim);
        
        let gabbia = this.add.graphics().setDepth(3.8).setVisible(false); 
        creatura.gabbiaRef = gabbia;
        creatura.liberata = false;
        creatureGabbie.push(creatura);
    });

    // --- EVENTO GENERATORE ZOMBIE BOSCO (Cielo dietro & Fiamme davanti) ---
    spawnZombieEvent = this.time.addEvent({
        delay: 1100 * mTempo, // Apparizioni leggermente più cadenzate
        loop: true,
        callback: () => {
            if (faseVideo === 2 && !bossFightBosco) {
                let pioveDalCielo = Math.random() > 0.5;
                
                if (pioveDalCielo) {
                    // 1) CADE DAL CIELO (Sempre dietro di noi)
                    let startX = Phaser.Math.Between(50, 450); // La band parte da 600
                    let zop = this.add.sprite(startX, -200, 'copzombie_run').setDepth(4).setScale(2);
                    zop.setFlipX(false); // Ci guarda (destra)
                    if (this.anims.exists('copzombie_run_anim')) zop.play('copzombie_run_anim');
                    
                    this.tweens.add({
                        targets: zop, y: 780, angle: 360, duration: 1000 * mTempo, ease: 'Bounce.easeOut',
                        onComplete: () => {
                            zop.angle = 0;
                            // Rincorre un po' e sfuma
                            this.tweens.add({ targets: zop, x: startX + 150, duration: 2500 * mTempo });
                            this.tweens.add({ targets: zop, alpha: 0, duration: 1000 * mTempo, delay: 1500 * mTempo, onComplete: () => zop.destroy() });
                        }
                    });
                } else {
                    // 2) APPARE DAVANTI DALLE FIAMME E ASPETTA
                    let startX = Phaser.Math.Between(1500, 1920); // Davanti alla band
                    let zop = this.add.sprite(startX, 780, 'copzombie_idle').setDepth(4).setScale(2);
                    zop.setFlipX(true); // Guarda noi (sinistra) e aspetta
                    if (this.anims.exists('copzombie_idle_anim')) zop.play('copzombie_idle_anim');
                    zop.customState = 'waiting';
                    
                    // Effetto Fiamma Spettacolare
                    let flame = this.add.circle(startX, 780, 80, 0xff5500).setDepth(4.1).setBlendMode(Phaser.BlendModes.ADD);
                    this.tweens.add({ targets: flame, scale: 2.5, alpha: 0, duration: 600 * mTempo, onComplete: () => flame.destroy() });
                    
                    zombiesBosco.push(zop); // Lo aggiunge all'array da aggiornare
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

    // MINUTO 0:35 (35s) - Baba Jaga entra a Milano
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

    // MINUTO 0:42 (42.5s) - BOSCO (Sogno Lucido Maximo)
    this.time.delayedCall(42500 * mTempo, () => {
        faseVideo = 2;
        velocitaScorrimento = 5; // --- Velocità Abbassata per Leggibilità ---
        baba.x = 2500; 
        
        bg1.setVisible(false); pav1.setVisible(false);
        bg2.setVisible(true); pav2.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(true));

        poliziotti.forEach(p => p.destroy()); poliziotti = [];
    });

    // MINUTO 1:08 (68s) - BOSCO BOSS: Arriva la Baba Matta!
    this.time.delayedCall(68000 * mTempo, () => {
        bossFightBosco = true; 
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        // Elimina gli zombie rimasti
        zombiesBosco.forEach(z => {
            if(z.active) this.tweens.add({targets: z, alpha: 0, duration: 500, onComplete: () => z.destroy()});
        });
        zombiesBosco = [];

        baba.x = 1600;
        baba.setScale(3); 
        baba.setTint(0xff00ff); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        
        this.tweens.add({ targets: baba, x: '+=20', y: '-=10', duration: 50, yoyo: true, repeat: -1 });
    });

    // MINUTO 1:13 (73s) - BABA MATTA ATTACCA -> BAND HURT
    this.time.delayedCall(73000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
        
        membri.forEach(m => {
            if (this.anims.exists(`${m}_hurt_anim`)) bandSprites[m].play(`${m}_hurt_anim`);
            this.tweens.add({ targets: bandSprites[m], x: '-=50', duration: 200 * mTempo });
        });
    });

    // MINUTO 1:15 (75s) - SCONFITTA -> BAND FALL
    this.time.delayedCall(75000 * mTempo, () => {
        membri.forEach(m => {
            if (this.anims.exists(`${m}_fall_anim`)) bandSprites[m].play(`${m}_fall_anim`);
        });
    });

    // MINUTO 1:18 (78s) - DISTORSIONE TOTALE -> FLASH
    this.time.delayedCall(78000 * mTempo, () => {
        this.cameras.main.zoomTo(3, 1500 * mTempo); 
        this.tweens.add({ targets: dreamOverlay, alpha: 1, duration: 1500 * mTempo });
        this.time.delayedCall(1500 * mTempo, () => {
            this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
        });
    });

    // MINUTO 1:20 (80s) - RISVEGLIO IN METRO (ZONA 3)
    this.time.delayedCall(80500 * mTempo, () => {
        faseVideo = 3;
        bossFightBosco = false;
        velocitaScorrimento = 2.5; 
        
        this.cameras.main.setZoom(1);
        this.cameras.main.setAngle(0);
        this.tweens.killTweensOf(baba);
        baba.setTint(0xffffff); 
        baba.x = 2500;

        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        bg2.setVisible(false); pav2.setVisible(false);
        bg3.setVisible(true); pav3.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(false));
        
        creatureGabbie.forEach(c => { c.setVisible(true); c.gabbiaRef.setVisible(true); });
    });

    // MINUTO 2:00 (120s) - FINE METRO: BABA GIGANTE
    this.time.delayedCall(120000 * mTempo, () => {
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });
        
        creatureGabbie.forEach(c => {
            if (c.liberata) {
                let anim = this.anims.exists(`${c.texture.key.split('_')[0]}_idle_anim`) ? `${c.texture.key.split('_')[0]}_idle_anim` : `${c.texture.key.split('_')[0]}_walk_anim`;
                if (anim) c.play(anim);
            }
        });

        baba.x = 1600;
        baba.setScale(5); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
    });

    // MINUTO 2:05 (125s) - ATTACCO DI GRUPPO
    this.time.delayedCall(125000 * mTempo, () => {
        membri.forEach(m => {
            if (this.anims.exists(`${m}_attack_anim`)) bandSprites[m].play(`${m}_attack_anim`);
        });
        creatureGabbie.forEach(c => {
            if (c.liberata) {
                let baseKey = c.texture.key.split('_')[0];
                if (this.anims.exists(`${baseKey}_attack_anim`)) c.play(`${baseKey}_attack_anim`);
            }
        });
        if (this.anims.exists('baba_hurt_anim')) baba.play('baba_hurt_anim');
        this.tweens.add({ targets: baba, alpha: 0, scale: 0, duration: 2000 * mTempo, ease: 'Back.easeIn' }); 
    });

    // MINUTO 2:10 (130s) - FLASH E TELETRASPORTO MILANO 4
    this.time.delayedCall(130000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });
    this.time.delayedCall(130500 * mTempo, () => {
        faseVideo = 4;
        velocitaScorrimento = 4; 
        
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_run_anim`) ? `${m}_run_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        bg3.setVisible(false); pav3.setVisible(false);
        bg4.setVisible(true); pav4.setVisible(true);
        creatureGabbie.forEach(c => { c.setVisible(false); if(c.gabbiaRef) c.gabbiaRef.setVisible(false); });
    });

    // MINUTO 2:25 (145s) - Si fermano per il furgone
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

    // --- LOGICA ZOMBIE FIAMMA (In attesa -> Inseguimento) ---
    if (faseVideo === 2 && !bossFightBosco) {
        for (let i = zombiesBosco.length - 1; i >= 0; i--) {
            let z = zombiesBosco[i];
            if (!z.active) {
                zombiesBosco.splice(i, 1);
                continue;
            }
            if (z.customState === 'waiting') {
                z.x -= velocitaScorrimento * 3; // Si muove con lo sfondo
                if (z.x < 450) { // Ci ha sorpassato
                    z.customState = 'chasing';
                    z.setFlipX(false); // Si gira verso di noi
                    if (this.anims.exists('copzombie_run_anim')) z.play('copzombie_run_anim');
                    
                    // Ci rincorre per un po' e poi sfuma
                    this.tweens.add({ targets: z, x: 550, duration: 2500 * mTempo, ease: 'Linear' });
                    this.tweens.add({ targets: z, alpha: 0, duration: 1000 * mTempo, delay: 2000 * mTempo, onComplete: () => z.destroy() });
                }
            }
        }
    }

    // --- SCORRIMENTO SFONDI E OSTACOLI ---
    if (faseVideo === 1) {
        bg1.tilePositionX += velocitaScorrimento * 0.5;
        pav1.tilePositionX += velocitaScorrimento * 3;
    } else if (faseVideo === 2) {
        bg2.tilePositionX += velocitaScorrimento * 0.5;
        pav2.tilePositionX += velocitaScorrimento * 3;
        
        if (!bossFightBosco) {
            ostacoliBosco.forEach(o => {
                o.x -= velocitaScorrimento * 4.5;
                if (o.x < -200) o.x = 2500 + Math.random() * 1000;
            });
        }
    } else if (faseVideo === 3) {
        bg3.tilePositionX += velocitaScorrimento * 0.5;
        pav3.tilePositionX += velocitaScorrimento * 3;
        
        creatureGabbie.forEach(c => {
            if (!c.liberata) {
                c.x -= velocitaScorrimento * 3;
                
                c.gabbiaRef.clear();
                c.gabbiaRef.lineStyle(6, 0xff00ff, 0.8);
                for(let s=0; s<6; s++) {
                    c.gabbiaRef.moveTo(c.x - 100 + (s*40), 650); 
                    c.gabbiaRef.lineTo(c.x - 100 + (s*40), 950);
                }
                c.gabbiaRef.strokePath();

                if (c.x < 1100) {
                    c.liberata = true;
                    c.gabbiaRef.clear(); 
                    
                    let baseKey = c.texture.key.split('_')[0];
                    let runAnim = this.anims.exists(`${baseKey}_run_anim`) ? `${baseKey}_run_anim` : `${baseKey}_walk_anim`;
                    if (runAnim) c.play(runAnim);
                    
                    this.tweens.add({ 
                        targets: c, 
                        x: Phaser.Math.Between(100, 500), 
                        duration: 1500 * mTempo,
                        onComplete: () => {
                            let walkAnim = this.anims.exists(`${baseKey}_walk_anim`) ? `${baseKey}_walk_anim` : `${baseKey}_idle_anim`;
                            if (walkAnim) c.play(walkAnim);
                        }
                    });
                }
            }
        });
    } else if (faseVideo === 4) {
        bg4.tilePositionX += velocitaScorrimento * 0.5;
        pav4.tilePositionX += velocitaScorrimento * 3;
    }
}

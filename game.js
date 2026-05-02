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
let flashRect;

// Attori
let bandSprites = {};
let poliziotti = [];
let baba, furgone;
let creatureGabbie = [];
let ostacoliBosco = [];

let faseVideo = 1; // 1: Milano1, 2: Bosco, 3: Metro, 4: Milano2
let velocitaScorrimento = 2; // Velocità base

const membri = ['carma', 'ferraz', 'mauri', 'nan', 'falcon'];
const guardie = ['cop', 'copzombie'];
const creature = ['drogato', 'murena', 'pigeon'];
const animazioni = ['idle', 'run', 'walk', 'attack', 'jump', 'hurt', 'fall', 'dodge'];

function preload() {
    // --- SFONDI UFFICIALI ---
    this.load.image('bg1', 'assets/milano-baba1.png');
    this.load.image('bg2', 'assets/boschetto2.png');
    this.load.image('bg3', 'assets/metro-baba3.png');
    this.load.image('bg4', 'assets/milano-baba4.png');

    // --- PAVIMENTI UFFICIALI (nomi corretti!) ---
    this.load.image('pav1', 'assets/pavimento-milano-baba.png');
    this.load.image('pav2', 'assets/pavimento-boschetto.png');
    this.load.image('pav3', 'assets/pavimento-metro.png');
    this.load.image('pav4', 'assets/pavimento-milano-baba2.png');

    // Oggetti Scenici
    this.load.image('palo', 'assets/obj-palo.png');
    this.load.image('palo2', 'assets/obj-palo2.png');
    this.load.image('barrel', 'assets/obj-fiery barrel.png');

    // Furgone
    this.load.spritesheet('furgone_idle', 'assets/furgone-idle.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('furgone_run', 'assets/furgone-run.png', { frameWidth: 256, frameHeight: 256 });

    // Baba Jaga
    ['idle', 'attack', 'run'].forEach(a => {
        this.load.spritesheet(`baba_${a}`, `assets/baba-${a}.png`, { frameWidth: 256, frameHeight: 256 });
    });

    // Tutti gli altri Sprite (Membri, Cops, Creature) affettati chirurgicamente
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
    // --- 1. SETTAGGIO SFONDI E PAVIMENTI (con Fallback antishock) ---
    let yPavimento = 930;
    
    // ZONA 1 (Milano 1)
    let fb1 = this.add.rectangle(960, 540, 1920, 1080, 0x1a1a1a).setDepth(0);
    bg1 = this.textures.exists('bg1') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg1') : fb1;
    let fp1 = this.add.rectangle(960, yPavimento, 1920, 300, 0x333333).setDepth(2);
    // Usa 'pav1' che ora corrisponde a assets/pavimento-milano-baba.png
    pav1 = this.textures.exists('pav1') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav1') : fp1;
    bg1.setDepth(0); pav1.setDepth(2);

    // ZONA 2 (Bosco)
    let fb2 = this.add.rectangle(960, 540, 1920, 1080, 0x051105).setDepth(0).setVisible(false);
    bg2 = this.textures.exists('bg2') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg2') : fb2;
    let fp2 = this.add.rectangle(960, yPavimento, 1920, 300, 0x1c2b1c).setDepth(2).setVisible(false);
    // Usa 'pav2' che ora corrisponde a assets/pavimento-boschetto.png
    pav2 = this.textures.exists('pav2') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav2') : fp2;
    bg2.setDepth(0).setVisible(false); pav2.setDepth(2).setVisible(false);

    // ZONA 3 (Metro)
    let fb3 = this.add.rectangle(960, 540, 1920, 1080, 0x0d1b2a).setDepth(0).setVisible(false);
    bg3 = this.textures.exists('bg3') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg3') : fb3;
    let fp3 = this.add.rectangle(960, yPavimento, 1920, 300, 0x415a77).setDepth(2).setVisible(false);
    // Usa 'pav3' che ora corrisponde a assets/pavimento-metro.png
    pav3 = this.textures.exists('pav3') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav3') : fp3;
    bg3.setDepth(0).setVisible(false); pav3.setDepth(2).setVisible(false);

    // ZONA 4 (Milano 2)
    let fb4 = this.add.rectangle(960, 540, 1920, 1080, 0x111111).setDepth(0).setVisible(false);
    bg4 = this.textures.exists('bg4') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg4') : fb4;
    let fp4 = this.add.rectangle(960, yPavimento, 1920, 300, 0x222222).setDepth(2).setVisible(false);
    // Usa 'pav4' che ora corrisponde a assets/pavimento-milano-baba2.png
    pav4 = this.textures.exists('pav4') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav4') : fp4;
    bg4.setDepth(0).setVisible(false); pav4.setDepth(2).setVisible(false);

    // Flash per il teletrasporto magico
    flashRect = this.add.rectangle(960, 540, 1920, 1080, 0xffffff).setDepth(100).setAlpha(0);

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

    // --- 3. INSERIMENTO ATTORI SULLA SCENA ---
    let posizioniX = { 'carma': 400, 'ferraz': 600, 'mauri': 800, 'nan': 1000, 'falcon': 1200 };
    
    membri.forEach(m => {
        bandSprites[m] = this.add.sprite(posizioniX[m], 780, `${m}_walk`).setDepth(4).setScale(2);
        if (this.anims.exists(`${m}_walk_anim`)) bandSprites[m].play(`${m}_walk_anim`);
    });

    baba = this.add.sprite(2200, 750, 'baba_idle').setDepth(5).setScale(2.5).setFlipX(true);
    furgone = this.add.sprite(2500, 700, 'furgone_run').setDepth(6).setScale(3.5).setFlipX(true);

    // --- SCENOGRAFIA E NEMICI ZONA 2 (Boschetto) ---
    for(let i=0; i<4; i++) {
        let p = this.add.image(2000 + (i*800), 600, 'palo').setDepth(1).setScale(1.5).setVisible(false);
        let b = this.add.image(2400 + (i*800), 850, 'barrel').setDepth(3).setScale(1.2).setVisible(false);
        ostacoliBosco.push(p, b);
    }

    // --- SCENOGRAFIA ZONA 3 (Gabbie Metro) ---
    creature.forEach((c, i) => {
        let creatura = this.add.sprite(2000 + (i*1000), 750, `${c}_idle`).setDepth(1).setScale(1.5).setVisible(false);
        if (this.anims.exists(`${c}_idle_anim`)) creatura.play(`${c}_idle_anim`);
        
        let gabbia = this.add.graphics().setDepth(3).setVisible(false);
        gabbia.lineStyle(6, 0xff00ff, 0.8);
        for(let s=0; s<6; s++) {
            gabbia.moveTo(creatura.x - 100 + (s*40), 600);
            gabbia.lineTo(creatura.x - 100 + (s*40), 900);
        }
        gabbia.strokePath();
        
        creatura.gabbiaRef = gabbia;
        creatura.baseX = 2000 + (i*1000);
        creatureGabbie.push(creatura);
    });

    // ==========================================
    // --- 4. LA REGIA DEL VIDEO (TIMELINE) ---
    // ==========================================

    // MINUTO 0:20 (20s) - Poliziotti
    this.time.delayedCall(20000 * mTempo, () => {
        velocitaScorrimento = 8;
        membri.forEach(m => { if (this.anims.exists(`${m}_run_anim`)) bandSprites[m].play(`${m}_run_anim`); });
        
        for(let i=0; i<3; i++) {
            let cop = this.add.sprite(-200 - (i*150), 780, 'cop_run').setDepth(4).setScale(2);
            if (this.anims.exists('cop_run_anim')) cop.play('cop_run_anim');
            poliziotti.push(cop);
            this.tweens.add({ targets: cop, x: 150 + (i*100), duration: 2000 * mTempo, ease: 'Linear' });
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

    // MINUTO 0:42 (42s) - CAMBIO ZONA: BOSCO
    this.time.delayedCall(42500 * mTempo, () => {
        faseVideo = 2;
        baba.x = 2500; 
        
        bg1.setVisible(false); pav1.setVisible(false);
        bg2.setVisible(true); pav2.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(true));

        poliziotti.forEach(p => p.destroy()); poliziotti = [];
        for(let i=0; i<4; i++) {
            let zop = this.add.sprite(50 + (i*100), 780, 'copzombie_run').setDepth(4).setScale(2);
            if (this.anims.exists('copzombie_run_anim')) zop.play('copzombie_run_anim');
            poliziotti.push(zop);
        }
    });

    // MINUTO 1:20 (80s) - TELETRASPORTO ZONA 3 (Metro)
    this.time.delayedCall(80000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });
    this.time.delayedCall(80500 * mTempo, () => {
        faseVideo = 3;
        bg2.setVisible(false); pav2.setVisible(false);
        bg3.setVisible(true); pav3.setVisible(true);
        ostacoliBosco.forEach(o => o.setVisible(false));
        
        poliziotti.forEach(p => p.destroy()); poliziotti = [];
        creatureGabbie.forEach(c => { c.setVisible(true); c.gabbiaRef.setVisible(true); });
    });

    // MINUTO 2:20 (140s) - TELETRASPORTO FINALE ZONA 4 (Milano 2)
    this.time.delayedCall(140000 * mTempo, () => {
        this.tweens.add({ targets: flashRect, alpha: 1, duration: 500 * mTempo, yoyo: true, hold: 500 * mTempo });
    });
    this.time.delayedCall(140500 * mTempo, () => {
        faseVideo = 4;
        bg3.setVisible(false); pav3.setVisible(false);
        bg4.setVisible(true); pav4.setVisible(true);
        creatureGabbie.forEach(c => { c.setVisible(false); c.gabbiaRef.setVisible(false); });
    });

    // MINUTO 2:25 (145s) - Si fermano
    this.time.delayedCall(145000 * mTempo, () => {
        velocitaScorrimento = 0; 
        membri.forEach(m => { if (this.anims.exists(`${m}_idle_anim`)) bandSprites[m].play(`${m}_idle_anim`); });
    });

    // MINUTO 2:35 (155s) - Arriva il Furgone
    this.time.delayedCall(155000 * mTempo, () => {
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: 960, duration: 3000 * mTempo, ease: 'Power2' });
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
    // Gestione dello scorrimento dinamico dei fondali in base alla fase
    if (faseVideo === 1) {
        bg1.tilePositionX += velocitaScorrimento * 0.5;
        pav1.tilePositionX += velocitaScorrimento * 3;
    } else if (faseVideo === 2) {
        bg2.tilePositionX += velocitaScorrimento * 0.5;
        pav2.tilePositionX += velocitaScorrimento * 3;
        
        // Loop ostacoli del bosco
        ostacoliBosco.forEach(o => {
            o.x -= velocitaScorrimento * 3;
            if (o.x < -200) o.x = 2500 + Math.random() * 1000;
        });
    } else if (faseVideo === 3) {
        bg3.tilePositionX += velocitaScorrimento * 0.5;
        pav3.tilePositionX += velocitaScorrimento * 3;
        
        // Parallasse delle gabbie (si muovono con il pavimento, poi resettano a destra)
        creatureGabbie.forEach(c => {
            c.x -= velocitaScorrimento * 3;
            
            // Aggiorna anche la posizione delle sbarre grafiche in tempo reale
            c.gabbiaRef.clear();
            c.gabbiaRef.lineStyle(6, 0xff00ff, 0.8);
            for(let s=0; s<6; s++) {
                c.gabbiaRef.moveTo(c.x - 100 + (s*40), 600);
                c.gabbiaRef.lineTo(c.x - 100 + (s*40), 900);
            }
            c.gabbiaRef.strokePath();

            if (c.x < -300) c.x = c.baseX + 3000;
        });
    } else if (faseVideo === 4) {
        bg4.tilePositionX += velocitaScorrimento * 0.5;
        pav4.tilePositionX += velocitaScorrimento * 3;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#000000',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// --- BASTONE MAGICO ---
// TRUE: Il video dura 18 secondi (test) | FALSE: Il video dura 4 minuti e 28 secondi reali (live)
const MODALITA_TEST = false; 
const mTempo = MODALITA_TEST ? 0.1 : 1; 

// Variabili di Scena (Sfondi e Pavimenti)
let bg1, bg2, bg3, bg4;
let sky1; // Solo per la zona 1
let pav1, pav2, pav3, pav4;
let flashRect, lampoRect, dreamOverlay;

// Attori
let bandSprites = {};
let poliziotti = [];
let baba, furgone;
let creatureGabbie = [];
let ostacoliBosco = [];
let stregheBosco = []; 
let spawnStregheEvent;

let faseVideo = 1; // 1: Milano1, 2: Bosco, 3: Metro, 4: Milano2
let velocitaScorrimento = 2; 
let bossFightBosco = false; 

// --- ROSTER V2 E FREAKS CONFERMATI ---
const membri = ['carma2', 'ferraz2', 'mauri2', 'nan2', 'falcon2'];
const guardie = ['cop', 'copzombie']; 
const creature = ['drogato', 'murena', 'pigeon', 'beeman', 'franken', 'nano', 'ornitorincoman', 'orologioman', 'radioman', 'strega'];
const animazioni = ['idle', 'run', 'walk', 'attack', 'jump', 'hurt', 'fall', 'hit_react', 'dance'];

function preload() {
    // ZONA 1 (Parallax)
    this.load.image('sky1', 'assets/cielo1.png');       
    this.load.image('bg1', 'assets/skyline1.png');     
    
    // ZONA 2 e 3
    this.load.image('bg2', 'assets/boschetto2.png');
    this.load.image('bg3', 'assets/metro-baba3.png');

    // ZONA 4 (Nuovo Skyline)
    this.load.image('bg4', 'assets/skyline10.png');     

    // PAVIMENTI
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
    
    // ==========================================================================================
    // --- 1. SETTAGGIO SFONDI, CIELI E PAVIMENTI ---
    
    // ZONA 1: Milano Parallax 1
    sky1 = this.add.tileSprite(960, 540, 1920, 1080, 'sky1').setDepth(-2).setAlpha(0.8);
    let fb1 = this.add.rectangle(960, 540, 1920, 1080, 0x1a1a1a).setDepth(-1).setVisible(false);
    bg1 = this.textures.exists('bg1') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg1') : fb1;
    bg1.setDepth(-1); 
    let fp1 = this.add.rectangle(960, yPavimento, 1920, 300, 0x333333).setDepth(2);
    pav1 = this.textures.exists('pav1') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav1') : fp1;
    pav1.setDepth(2);

    // ZONA 2: Bosco
    let fb2 = this.add.rectangle(960, 540, 1920, 1080, 0x051105).setDepth(0).setVisible(false);
    bg2 = this.textures.exists('bg2') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg2') : fb2;
    let fp2 = this.add.rectangle(960, yPavimento, 1920, 300, 0x1c2b1c).setDepth(2).setVisible(false);
    pav2 = this.textures.exists('pav2') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav2') : fp2;
    bg2.setDepth(0).setAlpha(0.6).setVisible(false); pav2.setDepth(2).setVisible(false);

    // ZONA 3: Metro
    let fb3 = this.add.rectangle(960, 540, 1920, 1080, 0x0d1b2a).setDepth(0).setVisible(false);
    bg3 = this.textures.exists('bg3') ? this.add.tileSprite(960, 540, 1920, 1080, 'bg3') : fb3;
    let fp3 = this.add.rectangle(960, yPavimento, 1920, 300, 0x415a77).setDepth(2).setVisible(false);
    pav3 = this.textures.exists('pav3') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav3') : fp3;
    bg3.setDepth(0).setAlpha(0.5).setVisible(false); pav3.setDepth(2).setVisible(false);

    // ZONA 4: Solo Skyline (Copre tutto sopra il pavimento)
    let fb4 = this.add.rectangle(960, yPavimento/2, 1920, yPavimento, 0x111111).setDepth(0).setVisible(false);
    bg4 = this.textures.exists('bg4') ? this.add.tileSprite(960, yPavimento/2, 1920, yPavimento, 'bg4') : fb4;
    bg4.setDepth(0).setVisible(false); 
    
    let fp4 = this.add.rectangle(960, yPavimento, 1920, 300, 0x222222).setDepth(2).setVisible(false);
    pav4 = this.textures.exists('pav4') ? this.add.tileSprite(960, yPavimento, 1920, 300, 'pav4') : fp4;
    pav4.setDepth(2).setVisible(false);

    // --- TRICK DELL'OMBRA ---
    let ombraSfondo = this.add.graphics();
    ombraSfondo.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 1, 1);
    ombraSfondo.fillRect(0, yPavimento - 180, 1920, 180); 
    ombraSfondo.setDepth(1.5); 
    
    let ombraPavimento = this.add.graphics();
    ombraPavimento.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.9, 0.9, 0, 0); 
    ombraPavimento.fillRect(0, yPavimento, 1920, 70); 
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
                    frameRate: 15, repeat: (anim === 'fall' || anim === 'fall2') ? 0 : -1
                });
            }
        });
    });

    if (this.textures.exists('furgone_run')) this.anims.create({ key: 'furgone_run_anim', frames: this.anims.generateFrameNumbers('furgone_run'), frameRate: 20, repeat: -1 });
    if (this.textures.exists('furgone_idle')) this.anims.create({ key: 'furgone_idle_anim', frames: this.anims.generateFrameNumbers('furgone_idle'), frameRate: 10, repeat: -1 });

    // --- 3. INSERIMENTO ATTORI (Cluster a x:750+) ---
    let posizioniBandX = { 'carma2': 750, 'ferraz2': 850, 'mauri2': 950, 'nan2': 1050, 'falcon2': 1150 };
    
    membri.forEach(m => {
        bandSprites[m] = this.add.sprite(posizioniBandX[m], 780, `${m}_walk`).setDepth(4).setScale(2);
        let startAnim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : (this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_run_anim`);
        if (startAnim) bandSprites[m].play(startAnim);
    });

    baba = this.add.sprite(2200, 750, 'baba_idle').setDepth(5).setScale(2.5).setFlipX(true);
    furgone = this.add.sprite(2500, 650, 'furgone_run').setDepth(6).setScale(4.5).setFlipX(true).setVisible(false);

    for(let i=0; i<4; i++) {
        let p = this.add.image(2000 + (i*800), 600, 'palo').setDepth(1).setScale(1.5).setVisible(false);
        let d = this.add.sprite(2300 + (i*800), 780, 'drogato_walk').setDepth(3).setScale(1.8).setFlipX(true).setVisible(false); 
        if (this.anims.exists('drogato_walk_anim')) d.play('drogato_walk_anim');
        ostacoliBosco.push(p, d); 
    }

    // ==========================================================================================
    // --- SCENOGRAFIA ZONA 3 (Metro: Variabilità scala e Distanza per più "Silenzio") ---
    let poolCreature = Phaser.Utils.Array.Shuffle([...creature, ...creature, ...creature]).filter(c => c !== 'strega').slice(0, 15); 
    
    poolCreature.forEach((c, i) => {
        // Scala casuale tra 1.75 e 1.95 (Carma è 2.0, quindi mai più alti di lui)
        let scaleVariabile = Phaser.Math.FloatBetween(1.75, 1.95);
        
        // Moltiplicatore distanza portato a 1800 per maggiore distacco tra uno spawn e l'altro
        let creatura = this.add.sprite(2000 + (i*1800), 800, `${c}_idle`).setDepth(2.5).setScale(scaleVariabile).setVisible(false); 
        
        let fallBackAnim = this.anims.exists(`${c}_idle_anim`) ? `${c}_idle_anim` : 
                          (this.anims.exists(`${c}_dance_anim`) ? `${c}_dance_anim` : 
                          (this.anims.exists(`${c}_walk_anim`) ? `${c}_walk_anim` : `${c}_run_anim`));
                          
        if (fallBackAnim) creatura.play(fallBackAnim);
        
        let gabbia = this.add.graphics().setDepth(2.8).setVisible(false); 
        creatura.gabbiaRef = gabbia;
        creatura.liberata = false;
        creatura.baseX = 2000 + (i*1800);
        creatureGabbie.push(creatura);
    });
    // ==========================================================================================

    // --- EVENTO GENERATORE STREGHE BOSCO ---
    spawnStregheEvent = this.time.addEvent({
        delay: 1100 * mTempo, 
        loop: true,
        callback: () => {
            if (faseVideo === 2 && !bossFightBosco) {
                let pioveDalCielo = Math.random() > 0.5;
                
                if (pioveDalCielo) {
                    let startX = Phaser.Math.Between(50, 400); 
                    let strega = this.add.sprite(startX, -200, 'strega_run').setDepth(4).setScale(2);
                    strega.setFlipX(false); 
                    if (this.anims.exists('strega_run_anim')) strega.play('strega_run_anim');
                    
                    // FUNZIONE GLITCH
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

                    // ==========================================================================================
                    // CADUTA REALISTICA (Senza rimbalzo)
                    this.tweens.add({
                        targets: strega, y: 780, duration: 600 * mTempo, ease: 'Quad.easeIn',
                        onComplete: () => {
                            this.tweens.add({ targets: strega, x: startX + 100, duration: 2500 * mTempo });
                            this.tweens.add({ targets: strega, alpha: 0, duration: 1000 * mTempo, delay: 1500 * mTempo, onComplete: () => strega.destroy() });
                        }
                    });
                    // ==========================================================================================
                } else {
                    let startX = Phaser.Math.Between(1500, 1920); 
                    let strega = this.add.sprite(startX, 780, 'strega_idle').setDepth(4).setScale(2);
                    strega.setFlipX(true); 
                    if (this.anims.exists('strega_idle_anim')) strega.play('strega_idle_anim');
                    strega.customState = 'waiting';
                    
                    // FUNZIONE GLITCH 
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

                    let flame = this.add.circle(startX, 780, 80, 0xff00ff).setDepth(4.1).setBlendMode(Phaser.BlendModes.ADD); 
                    this.tweens.add({ targets: flame, scale: 2.5, alpha: 0, duration: 600 * mTempo, onComplete: () => flame.destroy() });
                    
                    stregheBosco.push(strega); 
                }
            }
        }
    });

    // ==========================================
    // --- 4. LA REGIA DEL VIDEO (4:28 SCALATO) ---
    // ==========================================

    // MINUTO 0:30 (30s) - Milano Inseguimento Lento
    this.time.delayedCall(30000 * mTempo, () => {
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

    // MINUTO 0:45 (45s) - Baba Jaga entra a Milano
    this.time.delayedCall(45000 * mTempo, () => {
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        this.tweens.add({ targets: baba, x: 1600, duration: 2000 * mTempo, ease: 'Power2' });
    });

    // MINUTO 0:55 (55s) - BABA ATTACCA 
    this.time.delayedCall(55000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
    });

    // MINUTO 0:58 (58s) - Inizio Flash (Fade In Bianco)
    this.time.delayedCall(58000 * mTempo, () => {
        this.tweens.add({
            targets: flashRect,
            alpha: 1, 
            duration: 500 * mTempo,
            onComplete: () => {
                faseVideo = 2;
                velocitaScorrimento = 5; 
                baba.x = 2500; 

                sky1.setVisible(false); bg1.setVisible(false); pav1.setVisible(false);
                bg2.setVisible(true); pav2.setVisible(true);
                ostacoliBosco.forEach(o => o.setVisible(true));

                poliziotti.forEach(p => p.destroy()); poliziotti = [];
                
                this.time.delayedCall(500 * mTempo, () => {
                    this.tweens.add({ targets: flashRect, alpha: 0, duration: 500 * mTempo });
                });
            }
        });
    });

    // MINUTO 1:45 (105s) - BOSCO BOSS: Arriva la Baba Matta
    this.time.delayedCall(105000 * mTempo, () => {
        bossFightBosco = true; 
        velocitaScorrimento = 0; 
        membri.forEach(m => { 
            let anim = this.anims.exists(`${m}_idle_anim`) ? `${m}_idle_anim` : `${m}_walk_anim`;
            if (anim) bandSprites[m].play(anim); 
        });

        stregheBosco.forEach(s => {
            if(s.active) this.tweens.add({targets: s, alpha: 0, duration: 500, onComplete: () => s.destroy()});
        });
        stregheBosco = [];

        ostacoliBosco.forEach(o => {
            this.tweens.add({targets: o, alpha: 0, duration: 800 * mTempo, onComplete: () => o.setVisible(false)});
        });

        baba.x = 1600;
        baba.setScale(3); 
        baba.setTint(0xff00ff); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
        
        this.tweens.add({ targets: baba, x: '+=20', y: '-=10', duration: 50, yoyo: true, repeat: -1 });
    });

    // MINUTO 1:55 (115s) - BABA MATTA ATTACCA -> BAND HURT
    this.time.delayedCall(115000 * mTempo, () => {
        if (this.anims.exists('baba_attack_anim')) baba.play('baba_attack_anim');
        
        membri.forEach(m => {
            if (this.anims.exists(`${m}_hurt_anim`)) bandSprites[m].play(`${m}_hurt_anim`);
            this.tweens.add({ targets: bandSprites[m], x: '-=50', duration: 200 * mTempo });
        });
    });

    // MINUTO 2:00 (120s) - SCONFITTA -> BAND FALL
    this.time.delayedCall(120000 * mTempo, () => {
        membri.forEach(m => {
            if (this.anims.exists(`${m}_fall_anim`)) bandSprites[m].play(`${m}_fall_anim`);
        });
    });

    // MINUTO 2:05 (125s) - DISTORSIONE TOTALE -> FLASH E INIZIO METRO
    this.time.delayedCall(125000 * mTempo, () => {
        this.cameras.main.zoomTo(3, 1500 * mTempo); 
        this.tweens.add({ targets: dreamOverlay, alpha: 1, duration: 1500 * mTempo });
        
        this.time.delayedCall(1500 * mTempo, () => {
            this.tweens.add({
                targets: flashRect,
                alpha: 1, 
                duration: 500 * mTempo,
                onComplete: () => {
                    faseVideo = 3;
                    bossFightBosco = false;
                    velocitaScorrimento = 2.5; 
                    
                    this.cameras.main.setZoom(1);
                    this.cameras.main.setAngle(0);
                    this.tweens.killTweensOf(baba);
                    baba.setTint(0xffffff); 
                    baba.x = 2500;

                    membri.forEach(m => { 
                        bandSprites[m].x = posizioniBandX[m]; 
                        let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`;
                        if (anim) bandSprites[m].play(anim); 
                    });

                    bg2.setVisible(false); pav2.setVisible(false);
                    bg3.setVisible(true); pav3.setVisible(true);
                    
                    creatureGabbie.forEach(c => { c.setVisible(true); c.gabbiaRef.setVisible(true); });
                    
                    this.time.delayedCall(500 * mTempo, () => {
                        this.tweens.add({ targets: flashRect, alpha: 0, duration: 500 * mTempo });
                    });
                }
            });
        });
    });

    // MINUTO 3:20 (200s) - FINE METRO: BABA GIGANTE
    this.time.delayedCall(200000 * mTempo, () => {
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

        baba.x = 1400; 
        baba.setScale(4.0); 
        if (this.anims.exists('baba_idle_anim')) baba.play('baba_idle_anim');
    });

    // MINUTO 3:30 (210s) - ATTACCO DI GRUPPO E MORTE ESPLOSIVA
    this.time.delayedCall(210000 * mTempo, () => {
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
        
        this.tweens.add({ targets: baba, x: '+=40', y: '-=20', duration: 40, yoyo: true, repeat: 150 }); 
        
        this.time.addEvent({
            delay: 100 * mTempo, repeat: 80,
            callback: () => baba.setTint(Phaser.Math.RND.pick([0xff0000, 0x000000, 0xffffff, 0xff00ff, 0xffaa00]))
        });

        let explEvent = this.time.addEvent({
            delay: 200 * mTempo, repeat: 40,
            callback: () => {
                let exX = baba.x + Phaser.Math.Between(-200, 200);
                let exY = baba.y + Phaser.Math.Between(-300, 200);
                let expl = this.add.circle(exX, exY, 20, Phaser.Math.RND.pick([0xffaa00, 0xff0000, 0xffffff])).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({ targets: expl, scale: 15, alpha: 0, duration: 600 * mTempo, onComplete: () => expl.destroy() });
            }
        });

        // Dissoluzione dopo 8s
        this.tweens.add({ targets: baba, alpha: 0, scale: 0, duration: 3000 * mTempo, delay: 8000 * mTempo, ease: 'Back.easeIn' }); 
    });

    // MINUTO 3:43 (223s) - FLASH E ULTIMA PASSEGGIATA
    this.time.delayedCall(223000 * mTempo, () => {
        this.tweens.add({
            targets: flashRect,
            alpha: 1, 
            duration: 500 * mTempo,
            onComplete: () => {
                faseVideo = 4;
                velocitaScorrimento = 3; 
                
                membri.forEach(m => { 
                    let anim = this.anims.exists(`${m}_walk_anim`) ? `${m}_walk_anim` : `${m}_idle_anim`; 
                    if (anim) bandSprites[m].play(anim); 
                });

                bg3.setVisible(false); pav3.setVisible(false);
                bg4.setVisible(true); pav4.setVisible(true); 
                
                creatureGabbie.forEach(c => { c.setVisible(false); if(c.gabbiaRef) c.gabbiaRef.setVisible(false); });
                
                this.time.delayedCall(500 * mTempo, () => {
                    this.tweens.add({ targets: flashRect, alpha: 0, duration: 500 * mTempo });
                });
            }
        });
    });

    // MINUTO 4:10 (250s) - Arriva il Furgone
    this.time.delayedCall(250000 * mTempo, () => {
        furgone.x = 2500;
        furgone.setVisible(true); 
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: 960, duration: 5000 * mTempo, ease: 'Power2' }); 
    });

    // MINUTO 4:15 (255s) - Furgone Inchioda, Band sale
    this.time.delayedCall(255000 * mTempo, () => {
        velocitaScorrimento = 0; 
        if (this.anims.exists('furgone_idle_anim')) furgone.play('furgone_idle_anim');
        
        membri.forEach(m => {
            if (this.anims.exists(`${m}_idle_anim`)) bandSprites[m].play(`${m}_idle_anim`);
            this.tweens.add({ targets: bandSprites[m], alpha: 0, y: 700, duration: 500 * mTempo });
        });
    });

    // MINUTO 4:20 (260s) - Furgone schizza via
    this.time.delayedCall(260000 * mTempo, () => {
        furgone.setFlipX(false); 
        if (this.anims.exists('furgone_run_anim')) furgone.play('furgone_run_anim');
        this.tweens.add({ targets: furgone, x: -1000, duration: 3000 * mTempo, ease: 'Power2' });
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
                if (s.x < 650) { 
                    s.customState = 'chasing';
                    s.setFlipX(false); 
                    if (this.anims.exists('strega_run_anim')) s.play('strega_run_anim');
                    
                    this.tweens.add({ targets: s, x: 550, duration: 2500 * mTempo, ease: 'Linear' });
                    this.tweens.add({ targets: s, alpha: 0, duration: 1000 * mTempo, delay: 2000 * mTempo, onComplete: () => s.destroy() });
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
                    if (o.x < -200) o.x = 2500 + Math.random() * 1000;
                }
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
                    c.gabbiaRef.moveTo(c.x - 120 + (s*40), 600); 
                    c.gabbiaRef.lineTo(c.x - 120 + (s*40), 950);
                }
                c.gabbiaRef.strokePath();

                if (c.x < 1250) {
                    c.liberata = true;
                    c.gabbiaRef.clear(); 
                    
                    let baseKey = c.texture.key.split('_')[0];
                    let runAnim = this.anims.exists(`${baseKey}_run_anim`) ? `${baseKey}_run_anim` : `${baseKey}_walk_anim`;
                    if (runAnim) c.play(runAnim);
                    
                    this.tweens.add({ 
                        targets: c, 
                        x: Phaser.Math.Between(100, 650), 
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
        bg4.tilePositionX += velocitaScorrimento * 1; 
        pav4.tilePositionX += velocitaScorrimento * 3; 
    }
}

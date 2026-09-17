"use strict";

/*
=========================================================
 OPERATION HULING BARIL V2
=========================================================
*/


let scene;
let camera;
let renderer;
let controls;

let weapon;

let enemies = [];
let particles = [];
let tracers = [];

let clock;

let keys = {};

let health = 100;

let ammo = 30;
let reserveAmmo = 120;

let shooting = false;
let canShoot = true;

let onGround = true;

let verticalVelocity = 0;

let gameStarted = false;
let gameOver = false;

let audioContext = null;

let recoil = 0;

let walkTime = 0;

let lastEnemyShot = 0;


/*
=========================================================
 DOM
=========================================================
*/

const menu =
    document.getElementById("menu");

const game =
    document.getElementById("game");

const loading =
    document.getElementById("loading");

const errorScreen =
    document.getElementById("errorScreen");

const errorMessage =
    document.getElementById("errorMessage");


/*
=========================================================
 ERROR HANDLING
=========================================================
*/

window.addEventListener(
    "error",
    function(event) {

        if (!gameStarted)
            showError(
                event.message ||
                "Unknown initialization error."
            );

    }
);


function showError(message) {

    errorMessage.textContent =
        message;

    errorScreen.style.display =
        "flex";

}


/*
=========================================================
 LOADING
=========================================================
*/

window.addEventListener(
    "load",
    function() {

        let progress = 0;

        const interval =
            setInterval(
                function() {

                    progress += 10;

                    if (progress >= 100) {

                        progress = 100;

                        clearInterval(
                            interval
                        );

                        document.getElementById(
                            "loadText"
                        ).textContent =
                            "READY";

                        setTimeout(
                            function() {

                                loading.style.opacity =
                                    "0";

                                setTimeout(
                                    function() {

                                        loading.style.display =
                                            "none";

                                    },
                                    500
                                );

                            },
                            300
                        );

                    }

                    document.getElementById(
                        "loadBar"
                    ).style.width =
                        progress + "%";

                },
                80
            );

    }
);


/*
=========================================================
 START
=========================================================
*/

document.getElementById(
    "start"
).addEventListener(
    "click",
    startGame
);


function startGame() {

    if (gameStarted)
        return;

    try {

        gameStarted = true;

        menu.style.display =
            "none";

        game.style.display =
            "block";

        createAudio();

        initializeGame();

        controls.lock();

    }
    catch(error) {

        console.error(error);

        showError(
            error.message
        );

    }

}


/*
=========================================================
 AUDIO
=========================================================
*/

function createAudio() {

    try {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }
    catch(e) {

        audioContext = null;

    }

}


function gunSound() {

    if (!audioContext)
        return;

    const osc =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    osc.type = "sawtooth";

    osc.frequency.setValueAtTime(
        130,
        audioContext.currentTime
    );

    osc.frequency.exponentialRampToValueAtTime(
        45,
        audioContext.currentTime + .12
    );

    gain.gain.setValueAtTime(
        .13,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime + .13
    );

    osc.connect(gain);

    gain.connect(
        audioContext.destination
    );

    osc.start();

    osc.stop(
        audioContext.currentTime + .14
    );

}


/*
=========================================================
 INITIALIZE
=========================================================
*/

function initializeGame() {

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x071017
        );


    scene.fog =
        new THREE.FogExp2(
            0x071017,
            .018
        );


    camera =
        new THREE.PerspectiveCamera(
            75,
            window.innerWidth /
            window.innerHeight,
            .05,
            500
        );


    camera.position.set(
        0,
        1.7,
        12
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference:
                "high-performance"
        });


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    renderer.shadowMap.enabled =
        true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    renderer.outputEncoding =
        THREE.sRGBEncoding;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1.2;


    document.body.appendChild(
        renderer.domElement
    );


    controls =
        new THREE.PointerLockControls(
            camera,
            document.body
        );


    scene.add(
        controls.getObject()
    );


    clock =
        new THREE.Clock();


    createLights();

    createWorld();

    createRoad();

    createBuildings();

    createTrees();

    createLightsOnStreet();

    createCrates();

    createWeapon();

    createEnemies();

    setupInput();

    window.addEventListener(
        "resize",
        resize
    );


    animate();

}


/*
=========================================================
 LIGHTING
=========================================================
*/

function createLights() {

    const moon =
        new THREE.DirectionalLight(
            0x9db9ff,
            2.2
        );


    moon.position.set(
        -60,
        90,
        30
    );


    moon.castShadow =
        true;


    moon.shadow.mapSize.width =
        2048;


    moon.shadow.mapSize.height =
        2048;


    moon.shadow.camera.near =
        1;


    moon.shadow.camera.far =
        200;


    moon.shadow.camera.left =
        -100;


    moon.shadow.camera.right =
        100;


    moon.shadow.camera.top =
        100;


    moon.shadow.camera.bottom =
        -100;


    scene.add(moon);


    const hemisphere =
        new THREE.HemisphereLight(
            0x7fa0c4,
            0x21170f,
            1.2
        );


    scene.add(
        hemisphere
    );


    const ambient =
        new THREE.AmbientLight(
            0x172027,
            .4
        );


    scene.add(
        ambient
    );

}


/*
=========================================================
 WORLD
=========================================================
*/

function createWorld() {

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                300,
                300
            ),
            new THREE.MeshStandardMaterial({
                color: 0x24292a,
                roughness: .95
            })
        );


    ground.rotation.x =
        -Math.PI / 2;


    ground.receiveShadow =
        true;


    scene.add(ground);


    /*
    Sidewalks
    */

    for (
        let x of [-15, 15]
    ) {

        const sidewalk =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    7,
                    .18,
                    260
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x55585a,
                    roughness: .9
                })
            );


        sidewalk.position.set(
            x,
            .09,
            0
        );


        sidewalk.receiveShadow =
            true;


        scene.add(sidewalk);

    }

}


/*
=========================================================
 ROAD
=========================================================
*/

function createRoad() {

    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                23,
                260
            ),
            new THREE.MeshStandardMaterial({
                color: 0x101315,
                roughness: 1
            })
        );


    road.rotation.x =
        -Math.PI / 2;


    road.position.y =
        .02;


    scene.add(road);


    /*
    Yellow road markings
    */

    for (
        let z = -125;
        z < 125;
        z += 9
    ) {

        const line =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    .18,
                    4
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xd6b93d
                })
            );


        line.rotation.x =
            -Math.PI / 2;


        line.position.set(
            0,
            .04,
            z
        );


        scene.add(line);

    }

}


/*
=========================================================
 BUILDINGS
=========================================================
*/

function createBuildings() {

    for (
        let i = 0;
        i < 40;
        i++
    ) {

        const side =
            Math.random() > .5
                ? 1
                : -1;


        const width =
            5 +
            Math.random() * 8;


        const depth =
            6 +
            Math.random() * 10;


        const height =
            3 +
            Math.random() * 8;


        const colors = [
            0x4a4c48,
            0x59534a,
            0x3c4547,
            0x625c51,
            0x454b4c
        ];


        const material =
            new THREE.MeshStandardMaterial({
                color:
                    colors[
                        Math.floor(
                            Math.random() *
                            colors.length
                        )
                    ],

                roughness: .82,

                metalness: .02
            });


        const building =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    width,
                    height,
                    depth
                ),
                material
            );


        building.position.set(

            side *
            (19 +
                Math.random() *
                28),

            height / 2,

            -115 +
            Math.random() *
            230

        );


        building.castShadow =
            true;


        building.receiveShadow =
            true;


        scene.add(
            building
        );


        createWindows(
            building
        );

    }

}


/*
=========================================================
 WINDOWS
=========================================================
*/

function createWindows(
    building
) {

    const count =
        2 +
        Math.floor(
            building.scale.x + 2
        );


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const window =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    .7,
                    .9
                ),
                new THREE.MeshBasicMaterial({
                    color:
                        Math.random() > .45
                            ? 0xffc85e
                            : 0x15232e
                })
            );


        window.position.set(

            building.position.x +
            (
                Math.random() -
                .5
            ) * 5,

            .8 +
            Math.random() * 4,

            building.position.z -
            4

        );


        scene.add(
            window
        );

    }

}


/*
=========================================================
 TREES
=========================================================
*/

function createTrees() {

    for (
        let i = 0;
        i < 90;
        i++
    ) {

        const x =
            (
                Math.random() -
                .5
            ) * 160;


        const z =
            (
                Math.random() -
                .5
            ) * 240;


        if (
            Math.abs(x) <
            18
        )
            continue;


        createTree(
            x,
            z
        );

    }

}


function createTree(
    x,
    z
) {

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .15,
                .25,
                2.7,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x493328,
                roughness: .95
            })
        );


    trunk.position.set(
        x,
        1.35,
        z
    );


    trunk.castShadow =
        true;


    scene.add(trunk);


    /*
    Three foliage spheres
    */

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const leaves =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    1.1 +
                    Math.random() *
                    .6,
                    10,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x173a26,
                    roughness: .95
                })
            );


        leaves.position.set(

            x +
            (
                Math.random() -
                .5
            ) * .8,

            2.5 +
            i * .45,

            z +
            (
                Math.random() -
                .5
            ) * .8

        );


        leaves.castShadow =
            true;


        scene.add(
            leaves
        );

    }

}


/*
=========================================================
 STREET LIGHTS
=========================================================
*/

function createLightsOnStreet() {

    for (
        let z = -110;
        z <= 110;
        z += 20
    ) {

        createStreetLight(
            -11,
            z
        );

        createStreetLight(
            11,
            z + 10
        );

    }

}


function createStreetLight(
    x,
    z
) {

    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .08,
                .12,
                6,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x25282a,
                metalness: .7,
                roughness: .4
            })
        );


    pole.position.set(
        x,
        3,
        z
    );


    pole.castShadow =
        true;


    scene.add(
        pole
    );


    const lamp =
        new THREE.PointLight(
            0xffb55e,
            2.5,
            18
        );


    lamp.position.set(
        x,
        6,
        z
    );


    scene.add(
        lamp
    );


    const bulb =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .12,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffd27b
            })
        );


    bulb.position.copy(
        lamp.position
    );


    scene.add(
        bulb
    );

}


/*
=========================================================
 CRATES
=========================================================
*/

function createCrates() {

    for (
        let i = 0;
        i < 45;
        i++
    ) {

        const crate =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1,
                    1,
                    1
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x573c25,
                    roughness: .95
                })
            );


        crate.position.set(

            (
                Math.random() -
                .5
            ) * 45,

            .5,

            (
                Math.random() -
                .5
            ) * 220

        );


        crate.rotation.y =
            Math.random() *
            Math.PI;


        crate.castShadow =
            true;


        crate.receiveShadow =
            true;


        scene.add(
            crate
        );

    }

}


/*
=========================================================
 WEAPON
=========================================================
*/

function createWeapon() {

    weapon =
        new THREE.Group();


    /*
    Receiver
    */

    const receiver =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .27,
                .28,
                1.25
            ),
            new THREE.MeshStandardMaterial({
                color: 0x151719,
                metalness: .8,
                roughness: .25
            })
        );


    receiver.position.set(
        .34,
        -.28,
        -.72
    );


    weapon.add(
        receiver
    );


    /*
    Barrel
    */

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .055,
                .055,
                .85,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x070809,
                metalness: .9,
                roughness: .15
            })
        );


    barrel.rotation.x =
        Math.PI / 2;


    barrel.position.set(
        .34,
        -.28,
        -1.55
    );


    weapon.add(
        barrel
    );


    /*
    Front sight
    */

    const sight =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .04,
                .12,
                .08
            ),
            new THREE.MeshStandardMaterial({
                color: 0x080808,
                metalness: .7
            })
        );


    sight.position.set(
        .34,
        -.12,
        -1.25
    );


    weapon.add(
        sight
    );


    /*
    Grip
    */

    const grip =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .17,
                .48,
                .22
            ),
            new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: .8
            })
        );


    grip.rotation.x =
        -.2;


    grip.position.set(
        .34,
        -.58,
        -.53
    );


    weapon.add(
        grip
    );


    /*
    Magazine
    */

    const magazine =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .17,
                .5,
                .25
            ),
            new THREE.MeshStandardMaterial({
                color: 0x0d0e0f,
                metalness: .6,
                roughness: .35
            })
        );


    magazine.rotation.x =
        -.15;


    magazine.position.set(
        .34,
        -.56,
        -.91
    );


    weapon.add(
        magazine
    );


    /*
    Muzzle flash
    */

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .12,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffb72f
            })
        );


    flash.position.set(
        .34,
        -.28,
        -1.98
    );


    flash.visible =
        false;


    weapon.add(
        flash
    );


    weapon.userData.flash =
        flash;


    /*
    Muzzle light
    */

    const muzzleLight =
        new THREE.PointLight(
            0xffaa33,
            0,
            7
        );


    muzzleLight.position.set(
        .34,
        -.28,
        -2
    );


    weapon.add(
        muzzleLight
    );


    weapon.userData.light =
        muzzleLight;


    /*
    Add weapon to camera
    */

    camera.add(
        weapon
    );


    weapon.position.set(
        0,
        0,
        0
    );

}


/*
=========================================================
 ENEMIES
=========================================================
*/

function createEnemies() {

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        let x =
            (
                Math.random() -
                .5
            ) * 32;


        let z =
            -45 -
            Math.random() *
            110;


        createEnemy(
            x,
            z
        );

    }

}


function createEnemy(
    x,
    z
) {

    const enemy =
        new THREE.Group();


    /*
    BODY
    */

    const body =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .38,
                .45,
                1.3,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303436,
                roughness: .85
            })
        );


    body.position.y =
        1.05;


    body.castShadow =
        true;


    enemy.add(
        body
    );


    /*
    HEAD
    */

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .28,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x714e3a,
                roughness: .85
            })
        );


    head.position.y =
        2;


    head.castShadow =
        true;


    enemy.add(
        head
    );


    /*
    EYES
    */

    const eyeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xff3333
        });


    const eye1 =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .035,
                6,
                6
            ),
            eyeMaterial
        );


    const eye2 =
        eye1.clone();


    eye1.position.set(
        -.1,
        2.03,
        -.25
    );


    eye2.position.set(
        .1,
        2.03,
        -.25
    );


    enemy.add(
        eye1
    );

    enemy.add(
        eye2
    );


    /*
    WEAPON
    */

    const gun =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .12,
                .12,
                .85
            ),
            new THREE.MeshStandardMaterial({
                color: 0x0b0c0d,
                metalness: .8,
                roughness: .2
            })
        );


    gun.position.set(
        .35,
        1.15,
        -.42
    );


    enemy.add(
        gun
    );


    enemy.position.set(
        x,
        0,
        z
    );


    enemy.userData = {

        hp: 100,

        speed:
            1 +
            Math.random() * 1.3,

        attack:
            1.5 +
            Math.random() * 2,

        dead: false,

        hitFlash: 0

    };


    scene.add(
        enemy
    );


    enemies.push(
        enemy
    );

}


/*
=========================================================
 INPUT
=========================================================
*/

function setupInput() {

    document.addEventListener(
        "keydown",
        function(e) {

            keys[e.code] =
                true;


            if (
                e.code === "Space"
            ) {

                jump();

            }


            if (
                e.code === "KeyR"
            ) {

                reload();

            }

        }
    );


    document.addEventListener(
        "keyup",
        function(e) {

            keys[e.code] =
                false;

        }
    );


    document.addEventListener(
        "mousedown",
        function(e) {

            if (
                e.button === 0
            ) {

                shooting =
                    true;

                shoot();

            }

        }
    );


    document.addEventListener(
        "mouseup",
        function(e) {

            if (
                e.button === 0
            ) {

                shooting =
                    false;

            }

        }
    );


    /*
    Mobile fire
    */

    const fire =
        document.getElementById(
            "mobileFire"
        );


    fire.addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            shoot();

        }
    );


    document.getElementById(
        "mobileJump"
    ).addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            jump();

        }
    );


    document.getElementById(
        "mobileReload"
    ).addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            reload();

        }
    );


    /*
    Keyboard/mouse lock
    */

    controls.addEventListener(
        "unlock",
        function() {

            shooting = false;

        }
    );

}


/*
=========================================================
 JUMP
=========================================================
*/

function jump() {

    if (
        !onGround ||
        gameOver
    )
        return;


    verticalVelocity =
        7;


    onGround =
        false;

}


/*
=========================================================
 SHOOT
=========================================================
*/

function shoot() {

    if (
        !gameStarted ||
        gameOver ||
        !canShoot
    )
        return;


    if (
        ammo <= 0
    ) {

        reload();

        return;

    }


    canShoot =
        false;


    ammo--;


    updateAmmo();


    recoil =
        .055;


    gunSound();


    showMuzzle();


    raycastShoot();


    setTimeout(
        function() {

            canShoot =
                true;


            if (shooting)
                shoot();

        },
        115
    );

}


/*
=========================================================
 RAYCAST
=========================================================
*/

function raycastShoot() {

    const ray =
        new THREE.Raycaster();


    ray.setFromCamera(
        new THREE.Vector2(
            0,
            0
        ),
        camera
    );


    const targets = [];


    enemies.forEach(
        function(enemy) {

            if (
                enemy.userData.dead
            )
                return;


            enemy.traverse(
                function(obj) {

                    if (
                        obj.isMesh
                    )
                        targets.push(
                            obj
                        );

                }
            );

        }
    );


    const hits =
        ray.intersectObjects(
            targets,
            false
        );


    if (
        hits.length
    ) {

        let object =
            hits[0].object;


        let enemy =
            object.parent;


        while (
            enemy &&
            !enemy.userData
        ) {

            enemy =
                enemy.parent;

        }


        if (
            enemy &&
            enemy.userData
        ) {

            hitEnemy(
                enemy
            );

        }

    }

}


/*
=========================================================
 HIT ENEMY
=========================================================
*/

function hitEnemy(
    enemy
) {

    enemy.userData.hp -=
        50;


    enemy.userData.hitFlash =
        .1;


    showHitMarker();


    createParticles(
        enemy.position.clone()
    );


    if (
        enemy.userData.hp <= 0
    ) {

        killEnemy(
            enemy
        );

    }

}


/*
=========================================================
 KILL
=========================================================
*/

function killEnemy(
    enemy
) {

    enemy.userData.dead =
        true;


    let timer = 0;


    const interval =
        setInterval(
            function() {

                timer +=
                    .06;


                enemy.rotation.x =
                    -timer * 2.5;


                enemy.position.y -=
                    .02;


                if (
                    timer >= 1
                ) {

                    clearInterval(
                        interval
                    );


                    scene.remove(
                        enemy
                    );


                    updateEnemyCount();


                    checkWin();

                }

            },
            30
        );

}


/*
=========================================================
 PARTICLES
=========================================================
*/

function createParticles(
    position
) {

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const particle =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .025,
                    5,
                    5
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffb34d
                })
            );


        particle.position.copy(
            position
        );


        particle.userData.velocity =
            new THREE.Vector3(

                (
                    Math.random() -
                    .5
                ) * 4,

                Math.random() * 4,

                (
                    Math.random() -
                    .5
                ) * 4

            );


        particle.userData.life =
            1;


        scene.add(
            particle
        );


        particles.push(
            particle
        );

    }

}


/*
=========================================================
 PARTICLE UPDATE
=========================================================
*/

function updateParticles(
    delta
) {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            particles[i];


        p.position.add(
            p.userData.velocity
                .clone()
                .multiplyScalar(
                    delta
                )
        );


        p.userData.velocity.y -=
            9 *
            delta;


        p.userData.life -=
            delta;


        if (
            p.userData.life <=
            0
        ) {

            scene.remove(
                p
            );


            particles.splice(
                i,
                1
            );

        }

    }

}


/*
=========================================================
 HIT MARKER
=========================================================
*/

function showHitMarker() {

    const marker =
        document.getElementById(
            "hitmarker"
        );


    marker.style.opacity =
        "1";


    setTimeout(
        function() {

            marker.style.opacity =
                "0";

        },
        100
    );

}


/*
=========================================================
 MUZZLE FLASH
=========================================================
*/

function showMuzzle() {

    if (!weapon)
        return;


    const flash =
        weapon.userData.flash;


    const light =
        weapon.userData.light;


    flash.visible =
        true;


    light.intensity =
        12;


    setTimeout(
        function() {

            flash.visible =
                false;

            light.intensity =
                0;

        },
        45
    );

}


/*
=========================================================
 RELOAD
=========================================================
*/

function reload() {

    if (
        !canShoot ||
        ammo >= 30 ||
        reserveAmmo <= 0
    )
        return;


    canShoot =
        false;


    document.getElementById(
        "reloadText"
    ).textContent =
        "RELOADING...";


    setTimeout(
        function() {

            const amount =
                Math.min(
                    30 - ammo,
                    reserveAmmo
                );


            ammo +=
                amount;


            reserveAmmo -=
                amount;


            updateAmmo();


            document.getElementById(
                "reloadText"
            ).textContent =
                "R — RELOAD";


            canShoot =
                true;

        },
        900
    );

}


/*
=========================================================
 UPDATE AMMO
=========================================================
*/

function updateAmmo() {

    document.getElementById(
        "ammo"
    ).textContent =
        ammo;


    document.querySelector(
        ".ammo small"
    ).textContent =
        "/ " +
        reserveAmmo;

}


/*
=========================================================
 PLAYER UPDATE
=========================================================
*/

function updatePlayer(
    delta
) {

    if (
        !controls.isLocked ||
        gameOver
    )
        return;


    let forward =
        0;

    let sideways =
        0;


    if (
        keys["KeyW"]
    )
        forward++;


    if (
        keys["KeyS"]
    )
        forward--;


    if (
        keys["KeyD"]
    )
        sideways++;


    if (
        keys["KeyA"]
    )
        sideways--;


    const moving =
        forward !== 0 ||
        sideways !== 0;


    const sprint =
        keys["ShiftLeft"] ||
        keys["ShiftRight"];


    const speed =
        sprint
            ? 8.5
            : 5;


    if (
        moving
    ) {

        const length =
            Math.sqrt(
                forward *
                forward +
                sideways *
                sideways
            );


        forward /=
            length;


        sideways /=
            length;


        controls.moveForward(
            forward *
            speed *
            delta
        );


        controls.moveRight(
            sideways *
            speed *
            delta
        );


        walkTime +=
            delta *
            (
                sprint
                    ? 14
                    : 9
            );

    }


    /*
    Gravity
    */

    verticalVelocity -=
        20 *
        delta;


    controls.getObject()
        .position.y +=
        verticalVelocity *
        delta;


    if (
        controls.getObject()
            .position.y <=
        1.7
    ) {

        controls.getObject()
            .position.y =
            1.7;


        verticalVelocity =
            0;


        onGround =
            true;

    }


    /*
    Weapon bob
    */

    if (
        weapon
    ) {

        const bob =
            moving
                ? Math.sin(
                    walkTime
                ) * .025
                : 0;


        weapon.position.y =
            bob;


        weapon.position.x =
            Math.cos(
                walkTime *
                .5
            ) *
            .012;


        if (
            recoil > 0
        ) {

            weapon.position.z =
                recoil;


            recoil *=
                .8;

        }
        else {

            weapon.position.z =
                0;

        }

    }

}


/*
=========================================================
 ENEMY AI
=========================================================
*/

function updateEnemies(
    delta
) {

    if (
        gameOver
    )
        return;


    const player =
        controls.getObject()
            .position;


    enemies.forEach(
        function(enemy) {

            if (
                enemy.userData.dead
            )
                return;


            const distance =
                enemy.position
                    .distanceTo(
                        player
                    );


            /*
            Chase
            */

            if (
                distance > 8
            ) {

                const direction =
                    new THREE.Vector3()
                        .subVectors(
                            player,
                            enemy.position
                        )
                        .normalize();


                enemy.position.add(
                    direction.multiplyScalar(
                        enemy.userData.speed *
                        delta
                    )
                );

            }


            /*
            Face player
            */

            enemy.lookAt(
                player.x,
                enemy.position.y,
                player.z
            );


            /*
            Attack
            */

            enemy.userData.attack -=
                delta;


            if (
                distance < 25 &&
                enemy.userData.attack <=
                0
            ) {

                enemy.userData.attack =
                    1.4 +
                    Math.random() *
                    2;


                damagePlayer(
                    5 +
                    Math.random() * 8
                );

            }

        }
    );

}


/*
=========================================================
 DAMAGE PLAYER
=========================================================
*/

function damagePlayer(
    amount
) {

    if (
        gameOver
    )
        return;


    health -=
        amount;


    health =
        Math.max(
            0,
            health
        );


    document.getElementById(
        "health"
    ).style.width =
        health + "%";


    document.getElementById(
        "healthNumber"
    ).textContent =
        Math.floor(
            health
        );


    const damage =
        document.getElementById(
            "damage"
        );


    damage.style.opacity =
        ".8";


    setTimeout(
        function() {

            damage.style.opacity =
                "0";

        },
        130
    );


    if (
        health <= 0
    ) {

        playerDeath();

    }

}


/*
=========================================================
 DEATH
=========================================================
*/

function playerDeath() {

    gameOver =
        true;


    shooting =
        false;


    controls.unlock();


    document.getElementById(
        "death"
    ).style.display =
        "flex";

}


/*
=========================================================
 WIN
=========================================================
*/

function checkWin() {

    const alive =
        enemies.filter(
            e =>
                !e.userData.dead
        ).length;


    if (
        alive <= 0
    ) {

        gameOver =
            true;


        controls.unlock();


        document.getElementById(
            "death"
        ).style.display =
            "flex";


        document.querySelector(
            ".deathTitle"
        ).textContent =
            "MISSION COMPLETE";


        document.querySelector(
            "#death p"
        ).textContent =
            "All hostiles eliminated.";

    }

}


/*
=========================================================
 ENEMY COUNTER
=========================================================
*/

function updateEnemyCount() {

    const alive =
        enemies.filter(
            e =>
                !e.userData.dead
        ).length;


    document.getElementById(
        "enemyCount"
    ).textContent =
        alive;

}


/*
=========================================================
 RESTART
=========================================================
*/

document.getElementById(
    "restart"
).addEventListener(
    "click",
    function() {

        location.reload();

    }
);


/*
=========================================================
 RESIZE
=========================================================
*/

function resize() {

    if (
        !camera ||
        !renderer
    )
        return;


    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}


/*
=========================================================
 MAIN LOOP
=========================================================
*/

function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            .05
        );


    updatePlayer(
        delta
    );


    updateEnemies(
        delta
    );


    updateParticles(
        delta
    );


    renderer.render(
        scene,
        camera
    );

}

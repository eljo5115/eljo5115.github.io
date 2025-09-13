import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Clock } from 'three';
const materialsArray = [
    new THREE.MeshPhongMaterial({color:0xffffff}) //white
    ,new THREE.MeshPhongMaterial({color:0xff0000}) //red
    ,new THREE.MeshPhongMaterial({color:0x0000ff}) //blue
]

let scene,camera,canvas,renderer,controls,loader,globalClock;
function init(){

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(1,0,1);

    canvas = document.getElementById("three-canvas");
    renderer = new THREE.WebGLRenderer({
        antialias:true
        ,canvas:canvas
        ,shadowMap:true
        ,toneMapped:false
    });
    //enable shadows 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls = new OrbitControls( camera, renderer.domElement );
    loader = new GLTFLoader();
    controls.update();
    globalClock = new Clock();

}

// document.body.appendChild( renderer.domElement );
let directionalLight;
function lights(){

    //Set up shadow properties for the light
    directionalLight = new THREE.DirectionalLight( 0xffffff,1 );
    directionalLight.position.set(320, 400, 100);
    directionalLight.target.position.set(0, 10, 0);
    directionalLight.shadow.camera.top = 2000;
    directionalLight.shadow.camera.bottom = - 2000;
    directionalLight.shadow.camera.left = - 2000;
    directionalLight.shadow.camera.right = 2000;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 2000;
    directionalLight.castShadow = true;

    scene.add(directionalLight);
    // scene.traverse((child) => {

    //     child.castShadow = true;
    // });
}
let icoClock;
function createIcosahedron(location){
    // if(typeof(location) != THREE.Vector3){
    //     return TypeError;
    // }
    //create outer Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.5);
    const outerMat = new THREE.MeshPhongMaterial({
        color:0x5f5f5f
        ,transparent: true
        ,opacity:0.4
    });
    const outerIco = new THREE.Mesh(outerGeo, outerMat);
    let icosahedron = new THREE.Object3D();
    icosahedron.add(outerIco);
    
    //create inner Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0x5a25ff
        ,transparent:false
        ,opacity:0.8
    });
    const innerIco = new THREE.Mesh(innerGeo,innerMat);
    innerIco.castShadow = true;
    icosahedron.add(innerIco);
    
    //set position of group
    icosahedron.position.copy(location);
    icoClock = new Clock();
    return icosahedron; // group of 2
}


function createPlatform(position){
    //create upper platform (small section)
    const upperPlatformGeo = new THREE.CylinderGeometry(0.5,0.8,0.8,16,2,false);
    const upperPlatformMat = new THREE.MeshStandardMaterial({
        color:0xdfdfdf
        ,
    });
    const upperPlatform = new THREE.Mesh(upperPlatformGeo,upperPlatformMat);
    const platform = new THREE.Object3D();
    platform.add(upperPlatform);

    //create lower platform (large section)
    const lowerPlatformGeo = new THREE.CylinderGeometry(1,1,0.5,16,2);
    const lowerPlatformMat = new THREE.MeshStandardMaterial({
        color:0xdfdfdf
        ,
    });
    const lowerPlatform = new THREE.Mesh(lowerPlatformGeo,lowerPlatformMat);
    lowerPlatform.position.y -= 0.3;
    platform.add(lowerPlatform);

    lowerPlatform.castShadow = true;
    upperPlatform.castShadow = true;
    lowerPlatform.receiveShadow=true;
    platform.castShadow = true;
    //apply position
    platform.position.copy(position);
    return platform;
}
let ico,sphere,ground;
function drawObjects(){
    //draw plane
    const groundGeo = new THREE.BoxGeometry(500,500,0.1,100,100);
    ground = new THREE.Mesh(groundGeo,materialsArray[0]);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(1,1),materialsArray[1]);
    cube.position.y = 0.5;
    cube.castShadow = true;
    scene.add(cube);

    ico = createIcosahedron(new THREE.Vector3(-2,2.5,-5));
    scene.add(ico);
    const plat = createPlatform(new THREE.Vector3(-2,0.5,-5));
    scene.add(plat);
    sphere = new THREE.Mesh(new THREE.SphereGeometry(2,16,16),new THREE.MeshStandardMaterial({color:0xEEEEEE}));
    sphere.position.y = 3;
    scene.add(sphere);

}

function animateIcosahedron(icosahedron){
    icosahedron.position.y += (Math.sin(icoClock.getDelta()) * 0.015);
    icosahedron.rotation.x +=0.01;
    icosahedron.rotation.y +=0.01;
}

function animateSphere(){
    sphere.position.x += Math.sin(globalClock.getDelta());
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
	requestAnimationFrame(animate);
    animateIcosahedron(ico);
    animateSphere();
    controls.update();
	renderer.render(scene,camera);
}

function drawHelpers()
{
    const gridHelper = new THREE.GridHelper(200,50);
    const axes = new THREE.AxesHelper(5);
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,10,0xffffff);
    scene.add( 
        gridHelper
        ,axes
        ,directionalLightHelper
        ,new THREE.CameraHelper( directionalLight.shadow.camera ) 
        );
    
}
init();
drawObjects();
lights();
ground.castShadow = false;
animate();
//drawHelpers();

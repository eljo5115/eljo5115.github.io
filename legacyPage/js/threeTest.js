/*
TODOS
class for icosahedrons
    create/init
    activate (for onClick event)

more models
"links"
sorting intersect raycasting
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Clock } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const materialsArray = [
    new THREE.MeshPhongMaterial({color:0xffffff})
    ,new THREE.MeshPhongMaterial({color:0xff0000}) //red
    ,new THREE.MeshPhongMaterial({color:0x00ff00}) //green
    ,new THREE.MeshPhongMaterial({color:0x0000ff}) //blue
    ,new THREE.MeshPhongMaterial({color:0xfdfdfd}) //grey
]

const icosahedronMaterialsArray = [
    new THREE.MeshPhongMaterial({
        color:0x5f5f5f
        ,transparent: true
        ,opacity:0.4})
    ,new THREE.MeshPhongMaterial({
        color: 0xff255a
        ,transparent:false
        ,opacity:0.8
    })
]

//array for clickable objects
//pushed on clickableObject instantiation
const clickableArray = [];

/*
Class to store clickable/interactable objects
attributes:
    object - THREE.Object3D instance of object3D that intersect will use to call

methods:
    activate - called with onClick to show relevant page
*/
class ClickableObject {
    constructor(object){
        if(typeof(object)===THREE.Object3D){
            this.object = object;

        }else{
            this.object = new THREE.Object3D(); // empty object at (0,0,0)
        }
        clickableArray.push(this);
        console.log(this.object);
    }
    /*
    Method to handle interacting with object
    page - reference to HTML div to show information
    */
    activate(page){
        //idk how yet but set page to not have hidden class
        //every other page adds hidden class
    }
}



let icosahedronArray = [];
let modelsArray = [];

let scene,camera,canvas,renderer,controls,loader,globalClock,raycaster,pointer,intersects;
let containerWidth,containerHeight;
function init(){

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 0;
    camera.position.y = 15;
    camera.lookAt(10,3,10);

    canvas = document.getElementById("three-canvas");
    renderer = new THREE.WebGLRenderer({
        antialias:true
        ,canvas:canvas
        ,shadowMap:true
    });
    //enable shadows 

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    renderer.setSize( window.innerWidth, window.innerHeight );
    containerWidth = window.innerWidth;
    containerHeight = window.innerHeight;
    controls = new OrbitControls( camera, renderer.domElement );
    loader = new GLTFLoader();
    loader.load("/objects/github_logo.glb", (gltf) => {
        const model = gltf.scene;
        model.castShadow = true;
        model.position.set(3, 3, 5);
        modelsArray.push(model);
        scene.add(model);
        //console.log(model);
    });
    loader.load("/objects/Can_Models.gltf", (gltf) => {
        const model = gltf.scene;
        model.castShadow = true;
        model.position.set(0, 3, 5);
        model.scale.set(10,10,10);
        modelsArray.push(model);
        scene.add(model);
    })
    controls.update();
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

}

function onPointerMove(e){

    pointer.x = 2 * (e.clientX / containerWidth) - 1;
    pointer.y = 1 - 2 * ( e.clientY / containerHeight );

}

function onClick(){
    console.log(intersects[0]);
    intersects[0].activate();
}

/*
Main animate loop
*/
function animate() {
	requestAnimationFrame(animate);
    //code for intersect objects
    raycaster.setFromCamera(pointer, camera);
    intersects = raycaster.intersectObjects(scene.children);
    intersects.forEach((i) => {
        if(clickableArray.includes(i)){
            console.log(i)
        }
    });
    // if(intersects.length > 0){
    //     console.log(intersects);
    // }
    icosahedronArray.forEach((i) => {
        animateIcosahedron(i);
    });
    modelsArray.forEach((i) => {
        animateModel(i);
    })
    controls.update();
	renderer.render(scene,camera);
}

/* 
Creates an icosahedron at given location (THREE.Vector3)
*/
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
    const outerIco = new THREE.Mesh(outerGeo, icosahedronMaterialsArray[0]);
    let icosahedron = new THREE.Object3D();
    icosahedron.add(outerIco);
    
    //create inner Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1);
    const innerMat = new THREE.MeshPhongMaterial({
        color: 0x5a25ff
        ,transparent:false
        ,opacity:0.8
    });
    const innerIco = new THREE.Mesh(innerGeo,icosahedronMaterialsArray[1]);
    innerIco.castShadow = true;
    icosahedron.add(innerIco);
    icosahedron.name = "icosahedron";
    //set position of group
    icosahedron.position.copy(location);
    icoClock = new Clock();
    return icosahedron; // group of 2
}
/*
Creates a platform at given position (THREE.Vector3)
fuck I need to add an interactive light to this
*/
function createPlatform(position){
    //create upper platform (small section)
    const upperPlatformGeo = new THREE.CylinderGeometry(0.5,0.8,0.3,16,2,false);
    const upperPlatformMat = new THREE.MeshStandardMaterial({
        color:0xdfdfdf
        ,
    });
    const upperPlatform = new THREE.Mesh(upperPlatformGeo,upperPlatformMat);
    const platform = new THREE.Object3D();
    platform.add(upperPlatform);

    //create lower platform (large section)
    const lowerPlatformGeo = new THREE.CylinderGeometry(1,1,0.5,16,2);
    const lowerPlatform = new THREE.Mesh(lowerPlatformGeo,materialsArray[4]);
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
/*
Creates icosahedron floating above platform (THREE.Vector3)
Icosahedron should be about 3 y
Platform will be -2.5 dy from icosahedron
*/
function addPlatPlusIco(icoPosition){
    const platformPlusIco = new THREE.Object3D();
    const ico = createIcosahedron(icoPosition);
    const platPosition = icoPosition.add(new THREE.Vector3(0,-2.5,0));
    const platform = createPlatform(platPosition);
    platformPlusIco.add(ico);
    platformPlusIco.add(platform);
    icosahedronArray.push(ico);
    scene.add(platformPlusIco);
    new ClickableObject(ico);
}

/*
Function to draw all shapes 
*/
let ico;
function drawShapes(){
    const icoLocations = [
        new THREE.Vector3(10,3,10)
        ,new THREE.Vector3(0,3,7)
        ,new THREE.Vector3(3,3,14)
        ,new THREE.Vector3(-4,3,-7)
    ]
    const plane = new THREE.Mesh(new THREE.BoxGeometry(300,300,0.1),new THREE.MeshPhongMaterial({color:0xffffff}));
    plane.rotation.x = -Math.PI /2;
    plane.receiveShadow = true;

    icoLocations.forEach((i)=>addPlatPlusIco(i));
    scene.add(plane);
}
/*
Makes icosahedron bounce and rotate
*/
function animateIcosahedron(icosahedron){
    icosahedron.position.y += (Math.sin(icoClock.getDelta()) * 0.015);
    icosahedron.rotation.x +=0.01;
    icosahedron.rotation.y +=0.01;
}
/*
Makes given model spin (called in animate)
*/
function animateModel(model){
    model.position.y += (Math.sin(icoClock.getDelta()) * 0.015);
    //model.rotation.x +=0.01;
    model.rotation.y +=0.01;
}
/*
Draws all lights (directional and ambient)
*/
let directionalLight;
function lights(){
    directionalLight = new THREE.DirectionalLight(0xffffff,1);
    directionalLight.castShadow = true;
    directionalLight.position.set(225,300,150);
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = - 200;
    directionalLight.shadow.camera.left = - 200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 2000;
    const ambientLight = new THREE.AmbientLight(0xffffff,1);
    scene.add(directionalLight,ambientLight);
    scene.traverse((child) => {
        if(typeof(child) === THREE.Object3D){
            child.castShadow = true;
        }
    });
}
/*
Draws helpers for lights, grid, etc
 */
function drawHelpers() {
    const gridHelper = new THREE.GridHelper(200,50);
    const axes = new THREE.AxesHelper(5);
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,100,0xffffff);
    scene.add( 
        gridHelper
        ,axes
        ,directionalLightHelper
        ,new THREE.CameraHelper( directionalLight.shadow.camera ) 
        );
    
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
All function calls
 */
init();
drawShapes();
lights();
animate();
drawHelpers();
window.addEventListener("resize",onWindowResize);
canvas.addEventListener("pointermove",onPointerMove,false);
canvas.addEventListener("onclick",onClick)
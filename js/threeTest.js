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
let icosahedronArray = [];
let modelsArray = [];
let scene,camera,canvas,renderer,controls,loader,globalClock;
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
    controls = new OrbitControls( camera, renderer.domElement );
    loader = new GLTFLoader();
    loader.load("/objects/github_logo.glb", (gltf) => {
        const model = gltf.scene;
        model.castShadow = true;
        model.position.set(3, 3, 5);
        modelsArray.push(model);
        scene.add(model);
        console.log(model);
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
    projector = new THREE.Projector();
    mouseVector = new THREE.Vector3();
    mouseVector.x = 2 * (e.clientX / containerWidth) - 1;
    mouseVector.y = 1 - 2 * ( e.clientY / containerHeight );
}
var raycaster = projector.pickingRay( mouseVector.clone(), camera );
var intersects = raycaster.intersectObjects( cubes.children );

function animate() {
	requestAnimationFrame(animate);
    icosahedronArray.forEach((i) => {
        animateIcosahedron(i);
    });
    modelsArray.forEach((i) => {
        animateModel(i);
    })
    controls.update();
	renderer.render(scene,camera);
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
    
    //set position of group
    icosahedron.position.copy(location);
    icoClock = new Clock();
    return icosahedron; // group of 2
}

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

function addPlatPlusIco(icoPosition){
    const ico = createIcosahedron(icoPosition);
    const platPosition = icoPosition.add(new THREE.Vector3(0,-2.5,0));
    const platform = createPlatform(platPosition);
    icosahedronArray.push(ico);
    scene.add(ico,platform);
}
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
function animateIcosahedron(icosahedron){
    icosahedron.position.y += (Math.sin(icoClock.getDelta()) * 0.015);
    icosahedron.rotation.x +=0.01;
    icosahedron.rotation.y +=0.01;
}
function animateModel(model){
    model.position.y += (Math.sin(icoClock.getDelta()) * 0.015);
    //model.rotation.x +=0.01;
    model.rotation.y +=0.01;
}
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
init();
drawShapes();
lights();
animate();
drawHelpers();
window.addEventListener("resize",onWindowResize);
canvas.addEventListener("mousemove",onMouseMove,false);
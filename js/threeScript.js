import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Clock } from 'three';


let scene,camera,canvas,renderer,controls,loader;
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
    });
    //enable shadows 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x3d3d3e );
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls = new OrbitControls( camera, renderer.domElement );
    loader = new GLTFLoader();
    controls.update();

    //draw plane
    const planeGeo = new THREE.PlaneGeometry(500,500);
    const planeMat = new THREE.MeshStandardMaterial({
        color:0xfefeff
        ,transparent:false
    });
    const plane = new THREE.Mesh(planeGeo,planeMat);
    plane.receiveShadow=true;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
}

// document.body.appendChild( renderer.domElement );
init();

const pointLight = new THREE.PointLight(0xFFFFFF,1,0);
pointLight.position.set(new THREE.Vector3(-3, 5, -5) );
const ambientLight = new THREE.AmbientLight(0xffffff);
pointLight.castShadow = true;
//Set up shadow properties for the light
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );

directionalLight.castShadow = true;
const directionalTarget = new THREE.Object3D(100,50,100);
scene.add( 
    pointLight
    ,directionalTarget
    ,directionalLight
    //,ambientLight 
    );
    
    directionalLight.target = directionalTarget;
function createIcosahedron(location){
    // if(typeof(location) != THREE.Vector3){
    //     return TypeError;
    // }
    //create outer Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.5);
    const outerMat = new THREE.MeshStandardMaterial({
        color:0x5f5f5f
        ,transparent: true
        ,opacity:0.4
    });
    const outerIco = new THREE.Mesh(outerGeo, outerMat);
    let icosahedron = new THREE.Object3D();
    icosahedron.add(outerIco);
    
    //create inner Icosahedron
    const innerGeo = new THREE.IcosahedronGeometry(1);
    const innerMat = new THREE.MeshStandardMaterial({
        color: 0x44c5f6
        ,transparent:false
        ,opacity:0.8
    });
    const innerIco = new THREE.Mesh(innerGeo,innerMat);
    innerIco.castShadow = true;
    icosahedron.add(innerIco);
    
    //set position of group
    icosahedron.position.copy(location);
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
let ico;
function drawObjects(){
    ico = createIcosahedron(new THREE.Vector3(-2,2.5,-5));
    scene.add(ico);
    const plat = createPlatform(new THREE.Vector3(-2,0.5,-5));
    scene.add(plat);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(2,16,16),new THREE.MeshStandardMaterial({color:0xEEEEEE}));
    sphere.castShadow=true;
    sphere.position.y = 1;
    scene.add(sphere);

}

var iy = 0
function animateIcosahedron(icosahedron){
    iy+=0.05;
    icosahedron.position.y += (Math.sin(iy) * 0.015);
    icosahedron.rotation.x +=0.01;
    icosahedron.rotation.y +=0.01;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
	requestAnimationFrame(animate);
    animateIcosahedron(ico);
    controls.update();
	renderer.render(scene,camera);
}

function drawHelpers()
{
    const pointLightHelper = new THREE.PointLightHelper(pointLight);
    const gridHelper = new THREE.GridHelper(200,50);
    const axes = new THREE.AxesHelper(5);
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,100);
    scene.add( 
        gridHelper
        ,pointLightHelper
        ,axes
        ,directionalLightHelper 
        );
    
}
drawObjects();
drawHelpers();
animate();

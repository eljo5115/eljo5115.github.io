import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Clock } from 'three';



const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({antialias:true,canvas:canvas});
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xfdfdfd );
renderer.setSize( window.innerWidth, window.innerHeight );

// document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
const loader = new GLTFLoader();



const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.position.set( 5, 5, 5 );
const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add( pointLight,ambientLight );

const icosaGeo = new THREE.IcosahedronGeometry(1.5);
const icosaMat = new THREE.MeshDepthMaterial({
    color:0x5f5f5f
    ,transparent: true
    ,opacity:0.1
});
const icosahedron = new THREE.Mesh(icosaGeo, icosaMat);
scene.add (icosahedron);

var iy = 0
function animateIcosahedron(){
    iy+=0.05;
    icosahedron.position.y = (Math.sin(iy) * 0.15) + 0.5;
    icosahedron.rotation.x +=0.01;
    icosahedron.rotation.y +=0.01;
}
camera.position.z = 5;

function animateCube(){
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
}



function animate() {
	requestAnimationFrame( animate );
    animateCube();
    animateIcosahedron();
	renderer.render( scene, camera );
}

function drawHelpers()
{
    const pointLightHelper = new THREE.PointLightHelper(pointLight);
    const gridHelper = new THREE.GridHelper(200,50);
    scene.add( gridHelper,pointLightHelper );
}

drawHelpers();
animate();

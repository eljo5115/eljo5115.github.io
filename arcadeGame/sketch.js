const TILE_SIZE = 64;
const HALF_TILE = TILE_SIZE / 2;
const WIDTH = 12;
const HEIGHT = 9;
//TODOS
/* 
add items
game over condition

*/

class Block
{
  constructor(ex,ey,type=0)
  {
  //ex,ey are indexes in mapArray
    this.x = ex*TILE_SIZE+HALF_TILE;
    this.y = ey*TILE_SIZE+HALF_TILE;

    this.texture = ""; //path to img

    this.self = new Sprite(this.x,this.y,TILE_SIZE,TILE_SIZE,this.texture)
    this.self.bounciness = 0;
    //set block types

    this.adjBlocks = {};

    this.self.collider="static";
    switch(type)
    {
      case 0:{
        this.self.image = airTexture; //open space
        this.self.collider = "none";
        this.diggable = false;
        //choose item randomly
      }
      case 1:{
        this.self.image = dirtTexture; //brown for dirt (diggable)
        this.diggable = true;
        break;
      }
      case 2:{
        this.self.image = stoneTexture; // grey for stone (not diggable)
        this.diggable = false;
        break;
      }
    }    
  }
  digBlock()
  {
    if(this.diggable)
    {
      this.self.image=airTexture;
      this.self.collider = "none";
    }
    else
    {
      return 1;
    }
  }
  // updateAdjBlocks(){
  //   let ex = (this.x-HALF_TILE)/TILE_SIZE;
  //   let ey = (this.y-HALF_TILE)/TILE_SIZE
  //   if(ex==WIDTH)
  //   {
  //     this.adjBlocks.right = mapArray[0][ey];
  //   }
  //   else if(ex==0)
  //   {
  //     this.adjBlocks.left = mapArray[WIDTH-1][ey];
  //   }
  //   else
  //   {
  //     this.adjBlocks.right = mapArray[ex+1][ey];
  //     this.adjBlocks.left = mapArray[ex-1][ey];
  //   }
  //   this.adjBlocks.down=mapArray[ex][ey-1];
  // }
}


class Item{
  constructor(ex,ey){
    this.x = ex*TILE_SIZE+HALF_TILE;
    this.y = ey*TILE_SIZE+HALF_TILE;
    this.self = new Sprite(this.x,this.y,TILE_SIZE,TILE_SIZE);
    this.self.collider="none"
  }
}


class Bomb extends Item{
  constructor(x,y){
    super(x,y);
    this.ex = x;
    this.ey = y;
    this.self.image=bombImage;
  }
  pickUp(){
    if(player.self.overlaps(this.self)){
      //blow up
      console.log("boom");
      this.blowUp();
      this.self.remove();
    }
  }
  blowUp(){
    for(let i = -1; i < 2;i++){
      for(let j = -1; j < 2; j++){
        console.log(i,j,mapArray[this.ex+i][this.ey+j]);
        // mapArray[this.ex+i][this.ey+j].self.collider = "none";
        // mapArray[this.ex+i][this.ey+j].self.image = airTexture;

      }
    }
  }
  
}

class Diamond extends Item{
  constructor(x,y){
    super(x,y)
    this.self.image=diamondImage;
  }
  pickUp(){
    if(this.self.overlaps(player.self)){
      //increase score
      score++;
      console.log("woohoo points");
      this.self.remove();
    }
  }
}



class Player
{
  constructor(x,y)
  {
  this.self = new Sprite(x,y,TILE_SIZE-16,TILE_SIZE-2);
  this.self.img = playerImg;
  this.self.collider="d";
  this.self.rotationLock = true;
  this.self.bounciness = 0;
  }
  move()
  {
    let blockColumn = Math.floor(this.self.x/TILE_SIZE);
    let blockRow = Math.floor(this.self.y/TILE_SIZE);

    if(blockColumn <= 0){
      this.self.x=HALF_TILE;
    }
    else if(blockColumn >= WIDTH){
      this.self.x=WIDTH*TILE_SIZE-HALF_TILE;
    }

  //let activeBlocks = mapArray[blockColumn][blockRow].adjBlocks;
    
    
    let activeBlocks = {
      "inside":mapArray[blockRow][blockColumn],
      "left":mapArray[blockRow][blockColumn-1],
      "right":mapArray[blockRow][blockColumn+1],
      "down":mapArray[blockRow+1][blockColumn]
    };
    
    //console.log(activeBlocks);

    this.self.vel.x = 0;

    if(kb.pressed('left') && activeBlocks.left.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x-TILE_SIZE,this.self.y)
        ,1);
    }
    if(kb.pressed('right') && activeBlocks.right.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x+TILE_SIZE,this.self.y)
        ,1);
    }

    if(kb.pressed("x")){
      activeBlocks.down.digBlock();
    }
    this.self.x = activeBlocks.inside.x;

    if(activeBlocks.inside.item){
      activeBlocks.inside.item.pickUp();
    }
  }
}

function createBlocks()
{
  //game start creates 2d array
  let mapArray = new Array(HEIGHT);
  for (let i = 0;i<HEIGHT;i++)
  {
    let a = new Array(WIDTH);
    mapArray[i] = a;
  }
  let row;
  for(let col=0;col<WIDTH;col++)
  {
    for (row=0;row<HEIGHT;row++)
    {
      let b;

      //MAP INITIALIZATION
      //IN PROGRESS

      //random types
      if(row > 0)
      {  
        if(col==0 || col==WIDTH-1)
        {
          b = new Block(col,row,2);
        }
        else
        {
          let types = [0,1,1,1,2]; //types weighted within array
          const t = types[Math.floor(Math.random() * types.length)];
          b = new Block(col,row,t);
        }
      }
      else
      {
        b = new Block(col,row,0); // air block
      }
      mapArray[row][col] = b; // [y][x]
    }
  }
  return mapArray;
}

let player;
let cameraDY = 0.1;
let mapArray;
let blockRow;
let dirtTexture;
let stoneTexture;
let airTexture;
let diamondImage;
let bombImage;
let playerImg;
let score = 0;


// SYSTEM RESERVED FUNCTIONS
function preload(){
  playerImg = loadImage("./img/player2-07.png");
  dirtTexture = loadImage("./img/dirt-02.png");
  stoneTexture = loadImage("./img/stone-02.png");
  airTexture = loadImage("./img/air-01.png");
  diamondImage = loadImage("./img/diamond.png");
  bombImage = loadImage("./img/bomb.png");
}

function setup() 
{
  let canvas = createCanvas(WIDTH * TILE_SIZE, HEIGHT*TILE_SIZE);
  world.gravity.y=1;
  canvas.center("horizontal");
  background(255);
  stroke(255);
  strokeWeight(1);
  mapArray = createBlocks();
  player = new Player(TILE_SIZE*(WIDTH/2)+HALF_TILE,HALF_TILE-2);
}

function draw() 
{
  let scoreStr = "Score: " + score.toString();
  
  blockRow = Math.floor(player.self.y/TILE_SIZE);
  background(220);

  if(blockRow > (HEIGHT-2)){
    for(let i = 0; i<HEIGHT;i++){
      for(let j = 0; j<WIDTH;j++){
      mapArray[i][j].self.remove();
      }
    }
    mapArray = createBlocks();
    let px = player.self.x;
    player.self.remove();
    delete player;
    player = new Player(px,HALF_TILE-2);
  }
  player.move();
  // fill(255,255,255);
  // textSize(30);
  // textAlign(CENTER,CENTER);
  // text(scoreStr,WIDTH/2,40);
}

//debug functions
function drawGridCoords(rows, cols) 
{
  //FOR DEBUGGING
  // overlay for showing coordinates of each tile
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var x = j * TILE_SIZE;
      var y = i * TILE_SIZE;
      text(j + "," + i, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }
  }
}
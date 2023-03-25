const TILE_SIZE = 64;
const HALF_TILE = TILE_SIZE / 2;
const WIDTH = 16;
const HEIGHT = 30;
//TODOS
/* 
add items
game over condition

*/

class Block
{
  constructor(ex,ey,type=0,itemType=2)
  {
  //ex,ey are indexes in mapArray
    this.x = ex*TILE_SIZE+HALF_TILE;
    this.y = ey*TILE_SIZE+HALF_TILE;


    this.self = new Sprite(this.x,this.y,TILE_SIZE,TILE_SIZE,this.texture)
    this.self.bounciness = 0;
    this.destructable = true;
    //set block types

    this.self.collider="static";
    switch(type)
    {
      case 0:{
        // air, may contain item
        this.self.image = airTexture; //open space
        this.self.collider = "none";
        this.diggable = false;

        if(ey > 1){
          switch(itemType){
            case 0:{
              this.item = new Bomb(ex,ey);
              break;
            }
            case 1:{
              this.item = new Diamond(ex,ey);
              break;
            }
            default:{
              this.item = null;
              break;
            }
          }
        }
        break;
      }
      case 1:{
        //dirt (diggable)
        this.self.image = dirtTexture; 
        this.diggable = true;
        break;
      }
      case 2:{
        // stone (not diggable)
        this.self.image = stoneTexture; 
        this.diggable = false;
        break;
      }
      case 3:{
        // obsidian (unbreakable)
        this.self.image = unbreakableTexture;
        this.destructable = false;
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
  constructor(ex,ey){
    super(ex,ey);
    this.ex = ex;
    this.ey = ey;
    this.self.image=bombImage;
  }
  pickUp(){
    if(player.self.overlaps(this.self)){
      //blow up
      score++;
      console.log("boom");
      this.blowUp();
      this.self.remove();
    }
  }
  blowUp(){
    for(let j = -1; j < 2; j++){
    for(let i = -1; i < 2;i++){
        if((mapArray[this.ey+i][this.ex+j].destructable)){
        mapArray[this.ey+i][this.ex+j].self.collider = "none";
        mapArray[this.ey+i][this.ex+j].self.image = airTexture;
        }
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

    if(blockColumn >= 0){
      this.self.x = WIDTH*TILE_SIZE-HALF_TILE;
    }
    else if(blockColumn >= WIDTH){
      this.self.x=HALF_TILE;
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
    if(true){
    if(kb.pressed('left') && activeBlocks.left.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x-TILE_SIZE,this.self.y),1);
    }
    if(kb.pressed('right') && activeBlocks.right.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x+TILE_SIZE,this.self.y),1);
    }
  }
    if(kb.pressed("x")){
      activeBlocks.down.digBlock();
    }
    this.self.x = activeBlocks.inside.x;

    if(activeBlocks.inside.item){
      activeBlocks.inside.item.pickUp();
    }
    console.log(activeBlocks);
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

      //random types
      if(col==0 || col==WIDTH-1)
      {
        b = new Block(col,row,3);
      }
      else
      {
        if(row > 0)
        {  
          let blockTypes = [0,0,1,1,1,0,0,1,1,1,2,3]; //types weighted within array
          let itemTypes = [0,1,2];
          const t = blockTypes[Math.floor(Math.random() * blockTypes.length)];
          const it = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          b = new Block(col,row,t,it);
        }
        else { b = new Block(col,row,0,2); }// air block, no item
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
let unbreakableTexture;
let score = 0;


// SYSTEM RESERVED FUNCTIONS
function preload(){
  playerImg = loadImage("./img/player2-07.png");
  dirtTexture = loadImage("./img/dirt-02.png");
  stoneTexture = loadImage("./img/stone-02.png");
  airTexture = loadImage("./img/air-01.png");
  diamondImage = loadImage("./img/diamond.png");
  bombImage = loadImage("./img/bomb.png");
  unbreakableTexture = loadImage("./img/obsidian.png");
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
  clear();
  fill("blue");
  rect(0,-HEIGHT*TILE_SIZE,WIDTH,HEIGHT*TILE_SIZE);
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
  camera.y = player.self.y+800;
  console.log(mapArray[0][0]);
  mapArray[0][0].self.textColor = "white"
  mapArray[0][0].self.text = scoreStr;
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
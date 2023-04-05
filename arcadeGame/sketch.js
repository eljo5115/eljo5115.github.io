const TILE_SIZE = 64;
const HALF_TILE = TILE_SIZE / 2;
const WIDTH = 14;
const HEIGHT = 30;
//TODOS
/* 
  sound (bomb,dig,music?,diamond, undiggable)
  animation (bomb, dig)
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
      return 1; // successful dig
    }
    else
    {
      return 0; // unsuccessful dig
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
      this.self.remove();
    }
  }
}

class Player
{
  constructor(x,y)
  {
  this.self = new Sprite(x,y,TILE_SIZE-16,TILE_SIZE-2);
  this.self.addAni("dig","./img/digginAnimations/digginAnimation-01.png",6);
  this.self.addAni("idle","./img/idleAnimation/idleAnimation-01.png",3);
  this.self.img = playerImg;
  this.self.collider="d";
  this.self.rotationLock = true;
  this.self.bounciness = 0;
  }
  move()
  {
    //this.self.ani = "idle";
    this.self.ani.frameDelay = 25;
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
    if(kb.pressed("x"))
    {
      this.self.ani.frameDelay = 10;
      this.self.ani = ["dig","idle"];
      let success = activeBlocks.down.digBlock();
      if(success){
        //play dig sound
      }else{
        //play doink sound
      }
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

      //random types
      if(col==0 || col==WIDTH-1)
      {
        b = new Block(col,row,3);
      }
      else
      {
        if(row > 0)
        {  
          let blockTypes = [0,0,1,1,1,0,0,1,1,1,2,3]; //types weighted within array (change for balancing)
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
let gameOver;
let stuckCounter;
let textSprite = null;
let diggingAni;
let scoreStr;
let score = 0;


// SYSTEM RESERVED FUNCTIONS
function preload(){
  playerImg = loadImage("./img/player.png");
  dirtTexture = loadImage("./img/dirt.png");
  stoneTexture = loadImage("./img/stone.png");
  airTexture = loadImage("./img/air.png");
  diamondImage = loadImage("./img/diamond.png");
  bombImage = loadImage("./img/bomb.png");
  unbreakableTexture = loadImage("./img/obsidian.png");
}

function setup() 
{
  let canvas = new Canvas(WIDTH * TILE_SIZE, HEIGHT*TILE_SIZE);
  world.gravity.y=10;
  canvas.center("horizontal");
  background(255);
  stroke(0);
  strokeWeight(1);
  gameOver = false;
  mapArray = createBlocks();
  player = new Player(TILE_SIZE*(WIDTH/2)+HALF_TILE,HALF_TILE-2);
  cameraDY = 0;
  
}

function cleanup()
{
  // removes all sprites for reset
  for(let i = 0; i<HEIGHT;i++){
    for(let j = 0; j<WIDTH;j++){
    mapArray[i][j].self.remove();
    }
  }
  if(textSprite){
    textSprite.remove();
  }
  textSprite = null;
  player.self.remove();
  delete player;
}

function draw() 
{
  clear();
  camera.on();

  if(!gameOver)
  {
    scoreStr = "Score: " + score.toString();
    
    blockRow = Math.floor(player.self.y/TILE_SIZE);
    //background(21,21,21);
    background(116,204,229);//01110100 11001100 11100101

    if(blockRow > (HEIGHT-2))
    {
      cleanup();
      mapArray = createBlocks();
      let px = player.self.x;
      player = new Player(px,HALF_TILE-2);
      score+=10;
    }

    player.move();
    //camera.y = player.self.y+600;
    camera.y= player.self.y + 800;
    textSize(10);
    strokeWeight(0);
    mapArray[0][0].self.textColor = "white"
    mapArray[0][0].self.text = scoreStr;

    if(player.self.vel.y == 0)
    {
      //flash MOVE
      camera.off();
      fill("red");
      //textSize(32);
      text("move",WIDTH*TILE_SIZE,player.self.y,0,0);
      stuckCounter++;
    }
    else
    {
      stuckCounter = 0;
    }
    if(stuckCounter > 300)
    {
      gameOver = true;
    }
  }
  else
  {
    if(!textSprite){
      textSprite= new Sprite(WIDTH * HALF_TILE, player.self.y - HALF_TILE ,0,0);
      console.log(textSprite);
    }
    //draw game over screen, play again?
    cameraDY = 0;
    player.self.ani.stop();
    textSprite.collider = "static";
    textSprite.y = player.self.y;
    textSprite.textColor = color(255,255,255);
    textSprite.textSize = 50;
    textSprite.text = scoreStr+"\nGAME OVER\nPress'r' to restart\n";


    //textSize(50);
    if(kb.presses("r"))
    {
      score = 0;
      cleanup();
      setup();
      gameOver = false;
    }
  }
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
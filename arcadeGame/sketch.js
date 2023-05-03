const TILE_SIZE = 64;
const HALF_TILE = TILE_SIZE / 2;

//const WIDTH = 15
//const HEIGHT = 25
const WIDTH = Math.min(Math.floor(visualViewport.width/TILE_SIZE),1080);
const HEIGHT =Math.min(Math.floor(visualViewport.height/TILE_SIZE),1920);
//var scoreFile = require("high_scores.txt")
//TODOS
/* 
  sound (bomb,dig,music?,diamond, undiggable)
  state machine animations for player
  animation (bomb, dig) line 150
  dig left/right
*/
const States = {
  gameOver: 0,
  isTitleScreen: 1,
  isGamePlay: 2,
}

const playerStates = {
  idle:0,
  dig:1,
  fall:2,
}

class Block
{
  constructor(ex,ey,blockType=0,itemType=2)
  {
  //ex,ey are indexes in mapArray
    this.x = ex*TILE_SIZE+HALF_TILE;
    this.y = ey*TILE_SIZE+HALF_TILE;


    this.self = new Sprite(this.x,this.y,TILE_SIZE,TILE_SIZE,this.texture)
    this.self.bounciness = 0;
    this.destructable = true;
    //set block types

    this.self.collider="static";
    switch(blockType)
    {
      case 0:{
        // air, may contain item
        this.self.image = airTexture //open space
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
    //exact x,y pixels
    this.x = ex*TILE_SIZE+HALF_TILE;
    this.y = ey*TILE_SIZE+HALF_TILE;
    //index in mapArray
    this.indexX = ex;
    this.indexY = ey;
    //sprite instance
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
  pickUp()
  {
    if(player.self.overlaps(this.self))
    {
      //blow up
      score++;
      this.blowUp();
      this.self.remove();
      mapArray[this.indexY][this.indexX].item=null;
    }
  }
  blowUp()
  {
    //destroys blocks in a 3x3 area
    //add animation?
    for(let j = -1; j < 2; j++)
    {
      for(let i = -1; i < 2;i++)
      {
        if((mapArray[this.ey+i][this.ex+j].destructable))
        {
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
      mapArray[this.indexY][this.indexX].item=null;
    }
  }
}

class Player
{
  //implement states
  
  constructor(x,y)
  {
  this.self = new Sprite(x,y,TILE_SIZE-16,TILE_SIZE-2);
  this.self.addAni("dig","./img/diggingAnimation/diggingAnimation1.png",5);
  this.self.addAni("idle","./img/idleAnimation/idleFrame1.png",3);
  this.self.addAni("falling","./img/falling_loop/a_falling_loop1.png",3);
  this.self.img = playerImg;
  this.self.collider="d";
  this.self.rotationLock = true;
  this.self.bounciness = 0;
  this.playerState = playerStates.idle
  }
  move()
  {
    //this.playerState = playerStates.idle
    let blockColumn = Math.floor(this.self.x/TILE_SIZE);
    let blockRow = Math.floor(this.self.y/TILE_SIZE);

  //let activeBlocks = mapArray[blockColumn][blockRow].adjBlocks;
    
    
    let activeBlocks = {
      "inside":mapArray[blockRow][blockColumn],
      "left":mapArray[blockRow][blockColumn-1],
      "right":mapArray[blockRow][blockColumn+1],
      "down":mapArray[blockRow+1][blockColumn]
    };
    

    this.self.vel.x = 0;

    if(kb.presses('left') && activeBlocks.left.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x-TILE_SIZE,this.self.y),1);
    }
    if(kb.presses('right') && activeBlocks.right.self.collider=="none"){
      this.self.moveTowards(
        createVector(this.self.x+TILE_SIZE,this.self.y),1);
    }
    if(kb.pressed("x"))
    {
      let success = activeBlocks.down.digBlock();
      this.playerState = playerStates.dig
      if(success){
        //play dig sound
      }else{
        //play doink sound
      }
    }
    if(this.self.vel.y > 0.1)
    {
      this.playerState = playerStates.fall;
    }

    this.self.x = activeBlocks.inside.x;

    if(activeBlocks.inside.item){
      activeBlocks.inside.item.pickUp();
    }

    switch(this.playerState)
    {
      case playerStates.idle:
      {
        this.self.ani.frameDelay = 25;
        this.self.ani = "idle";
      }
      case playerStates.dig:
      {
        this.self.ani.frameDelay = 10;
        this.self.ani = ["dig",'idle'];
      }
      case playerStates.fall:
      {
        this.self.ani.frameDelay = 7;
        this.self.ani = "falling";
        this.self.ani.loop();
      }
      default:
      {
        console.log("bad player state")
        this.self.ani = "idle";
      }
    }
    console.log(this.self.ani)
  }

}

function makeWeightArray(weights=[])
{
  //createBlocks helper function
  //takes in an unlimited number of weights and returns an array with the appropriate number of items
  let weightArray = [];
  for(var i = 0;i<weights.length;i++ )
  {
    for(var j = 0; j < weights[i];j++)
    {
      weightArray.push(i);
    }
  }
  return weightArray;
}

function createBlocks(airWeight,dirtWeight,stoneWeight,obsidianWeight)
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
          if(pageNumber==0)
          {
            if(row == 1)
            {
              b = new Block(col,row,1,2)
            }
            else if(row == 2)
            {
              if(col == 3)
              {
                b = new Block(col,row,0,0)
              }
              else
              {
                b = new Block(col,row,2)
              }
            }
            else if(row == 3)
            {
              if (col == 3)
              {
                b = new Block(col,row,0,0)
              }
              else if (col == 2 || col == 4){
                b = new Block(col,row,2,2)
              }
              else
              {
                b = new Block(col,row,3)
              }
            }
            else
            {
              let blockTypes = makeWeightArray([airWeight,dirtWeight,stoneWeight,obsidianWeight]);
              let itemTypes = [0,1,2];
              const t = blockTypes[Math.floor(Math.random() * blockTypes.length)];
              const it = itemTypes[Math.floor(Math.random() * itemTypes.length)];
              b = new Block(col,row,t,it);
            }
            
          }
          else
          {
            let blockTypes = makeWeightArray([airWeight,dirtWeight,stoneWeight,obsidianWeight]);
            let itemTypes = [0,1,2];
            const t = blockTypes[Math.floor(Math.random() * blockTypes.length)];
            const it = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            b = new Block(col,row,t,it);
          }
        }
        else { b = new Block(col,row,0,2); }// air block, no item
      }
      mapArray[row][col] = b; // [y][x]
      }
    }
    return mapArray;
}

function drawAllBlocks(){
  for (var i=0;i<HEIGHT;i++){
      for (var j=0;j<WIDTH;j++){
        mapArray[i][j].self.draw()
        if(mapArray[i][j].item){
          mapArray[i][j].item.self.draw()
        }
      }
    }
}

function drawTitleScreen()
{
  let startText;
  image(titleBackground, 0,0,WIDTH*TILE_SIZE,HEIGHT*TILE_SIZE)
  stroke(0);
  fill(0);
  textSize(24)
  strokeWeight(1);
  startText = text("Press x to start", 400,400);

}

let player;
let cameraDY;
let mapArray;
let blockRow;
let dirtTexture;
let stoneTexture;
let airTexture;
let diamondImage;
let bombImage;
let playerImg;
let unbreakableTexture;
let stuckCounter;
let diggingAni;
let scoreStr;
let titleBackground;
let score = 0;
let pageNumber = 0;
let state = States.isTitleScreen;
let gameAssets = false;

// SYSTEM RESERVED FUNCTIONS
function preload(){
  playerImg = loadImage("./img/player-02.png");
  unbreakableTexture = loadImage("./img/obsidian-ai2.png");
  dirtTexture = loadImage("./img/dark-dirt-ai.png");
  stoneTexture = loadImage("./img/stone-04.png");
  airTexture = loadImage("./img/air.png");
  diamondImage = loadImage("./img/dollaz.png");
  bombImage = loadImage("./img/bomb.png");
  titleBackground = loadImage("./img/background.png")
}

function gameSetup(px)
{
  if (px != 0){
    player = new Player(px,HALF_TILE-2);
  }
  else
  {
    player = new Player(TILE_SIZE*(WIDTH/2)+HALF_TILE,HALF_TILE-2);
  }
  mapArray = createBlocks(40,40,20,10);
  gameAssets = true;
}

function setup() 
{
  let canvas = new Canvas(WIDTH * TILE_SIZE, visualViewport.height);
  world.gravity.y=10;
  //canvas.center("vertical");
  canvas.center("horizontal");
  background(255);
  stroke(0);
  strokeWeight(1);
  score = 0;
  cameraDY = 1;
  state = States.isTitleScreen;
  //camera.y = 0;
}

function cleanup()
{
  // removes all sprites for reset
  for(let i = 0; i<HEIGHT;i++)
  {
    for(let j = 0; j<WIDTH;j++)
    {
      if (mapArray)
      {
        if(mapArray[i][j].self)
        {
          mapArray[i][j].self.remove();
        if(mapArray[i][j].item)
          {
            mapArray[i][j].item.self.remove();
            mapArray[i][j].item = null;
          }
        } 
      }
    }
  }
  player.self.remove();
  delete player;
  pageNumber = 0;
  camera.y = 0
  gameAssets = false;
}

function draw() 
{
  clear();
  console.log(state)
  switch(state){
    case States.gameOver:
    {
      for(let i = 0; i<HEIGHT;i++)
      {
        for(let j = 0; j<WIDTH;j++)
        {
          mapArray[i][j].self.visible = false
          if (mapArray[i][j].item)
          {
            mapArray[i][j].item.self.visible = false;
          }
        }
      }
      camera.off();
      clear();
      fill(255);
      textSize(50);
      text(scoreStr+"\nGame Over!\nPress 'r' to restart",canvas.w/2-50,canvas.h/2);
      //rect(0,0,canvas.w,canvas.h);
      cameraDY = 0;
      
      
      if(kb.presses("r"))
      {
        cleanup();
        state = States.isTitleScreen
      }
      break;
    }
    case States.isGamePlay:
    {
      camera.on();
      let px;
      if(!gameAssets)
      {
        gameSetup(px);
      }
      scoreStr = "Score: " + score.toString();
      blockRow = Math.floor(player.self.y/TILE_SIZE);
      background(116,204,229);

      if(blockRow > (HEIGHT-2)) //player made it to the bottom
      {
        cleanup();
        pageNumber++;
        px = player.self.x;
        score+=10;
      }
      else
      {
        px = 0
      }
      drawAllBlocks();
      player.move();

      if(player.self.y > camera.y)//if player gets ahead of the camera
      {
        camera.y = player.self.y
      }
      else if(player.self.y > 3*TILE_SIZE)//normal camera movement starts after player gets to 3rd row
      {
        camera.y += cameraDY;
      } 

      player.self.draw()

      if(player.self.y < Math.floor(camera.y - canvas.h/2-TILE_SIZE))//game over check
      {
        state = States.gameOver;
      }
      //console.log("camera:",camera.y-(HEIGHT/6)*TILE_SIZE,"player:",player.self.y)

      //drawing UI
      camera.off()
      fill(255)
      textSize(20)
      text("Boss dollars: $" + score.toString(), 16,16)
      break;
    }
    case States.isTitleScreen:
    {
      //camera.off()
      drawTitleScreen()
      if (kb.pressed("x"))
      {
        //starts the game
        setup()
        state = States.isGamePlay
      }
      break;
    }
    default:{
      console.error("state undefined", UndefinedState)
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
// class Block{
//     constructor(ex,ey){
//         this.active = false;
//         this.x = ex;
//         this.y = ey;
//         this.texture = color(0,0,0); //TODO
//         this.adjBlocks = new Array();
//     };
//     drawSelf(){
//         fill(this.texture);
//         rect(this.x,this.y,TILE_SIZE,TILE_SIZE);
//     };
// }

// class Game{
//     constructor(width,height){
//         this.textures= [
//             "",
//             "",
//             "",
//         ]; // links to images in a folder
//         this.blocks = new Array(width);
//         for(let i=0;i<width;i++){
//             let a = new Array(height);
//             this.blocks[i] = a;
//         };
//         //starting point for game
//         for (let i=0;i<height;i++){
//             for (let j=0;j<width;j++){
//                 var b = new Block(i,j);
//                 b.texture=color(i*10,j*10,i*j);
//                 this.blocks[i][j] = b;
//             };
//         };
//     };

//     drawBlocks()
//     {
//         console.log(this.blocks);
//         for(const b in this.blocks){
//             for(const b2 in b){b2.drawSelf();}
//     }
// }
// }

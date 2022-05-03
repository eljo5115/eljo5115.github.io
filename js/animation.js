var draw = SVG.find('#a');//get canvas
var pacman = SVG.find('#pacman');//get pacman /GROUP/
var timeline = new SVG.Timeline();
var foodTimeline = new SVG.Timeline();
var walkable = SVG.find("#walkable");
var body = document.getElementById("background");
var text = draw.text("Double click to stop, click to play").attr({x:"75%",y:"5%"});
text.attr({fill:"white"});
var text2 = draw.text("waka waka").attr({x:"20%",y:"80%",fill:"pink"});
const duration = 2000;
food1 = [];
food2 = [];
food3 = [];
food1.length = 8;
food2.length = 9;
food3.length = 5;
for(var i = 0; i<food1.length;i++){
    //draw food for pacman
    food1[i] = draw.circle(25).attr({position:"absolute", fill:"#fff",cx:775,cy:100*i+150});
    food1[i].animate(0,(200*i + 50)).attr({fill:"black"});
}
for(var i=0;i<food2.length;i++){
    food2[i] = draw.circle(25).attr({position:"absolute", fill:"#fff",cx:775+i*100,cy:850});
    food2[i].animate(0,(200*i + 2050)).attr({fill:"black"});
}
for(var i=0;i<food2.length;i++){
    food3[i] = draw.circle(25).attr({position:"absolute", fill:"#fff",cx:1575,cy:850 + 100*i});
    food3[i].animate(0,(200*i + 4050)).attr({fill:"black"});
}

var runners = [];
pacman.timeline(timeline);
pacman.front();
//animations for pacman
pacman.center('50%',-180);

runners[0] = pacman.animate(duration,0).dy(1050).ease("<>");
runners[1] = pacman.animate(0).rotate(-90).ease("<>");
runners[2] = pacman.animate(duration).dy(800).ease("<>");
runners[3] = pacman.animate(0).rotate(90).ease("<>");
runners[4] = pacman.animate(duration).dy(350).ease("<>");
draw.dblclick(function() { timeline.stop() });
draw.click(function() { timeline.play()});

pacman.timeline().persist(true);

console.log(timeline);
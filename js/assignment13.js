const customName = document.getElementById('customname');
const randomize = document.querySelector('.randomize');
const story = document.getElementById('story');

function randomValueFromArray(array){
  const random = Math.floor(Math.random()*array.length);
  return array[random];
}


const insertX = ["Willy the Goblin", "Big Daddy", "Father Christmas"];
const insertY = ["the soup kitchen", "Disneyland", "the White House"];
const insertZ = ["spontaneously combusted", "melted into a puddle on the sidewalk", "turned into a slug and crawled away"];

var xItem = randomValueFromArray(insertX);
var yItem = randomValueFromArray(insertY);
var zItem = randomValueFromArray(insertZ);

const storyText = "It was 94 fahrenheit outside, so :insertx: went for a walk. When they got to :inserty:, they stared in horror for a few moments, then :insertz:. Bob saw the whole thing, but was not surprised — :insertx: weighs 300 pounds, and it was a hot day.";
var newStory = storyText;
randomize.addEventListener('click', result);

function result() {

  if(customName.value !== '') {
    const name = customName.value;
    newStory = newStory.replace("Bob",name);
  }

  if(document.getElementById("uk").checked) {
    const weight = Math.round(300);
    const temperature =  Math.round(94);
    const stone = weight/14;
    const centigrade = (temperature-32) *5/9;
    newStory = newStory.replace("94 fahrenheit", Math.floor(centigrade) +" Celsius");
    newStory = newStory.replace("300 pounds", Math.floor(stone) + " stone");
  }
newStory = newStory.replace(/:insertx:/g, xItem);
newStory = newStory.replace(":inserty:", yItem);
newStory = newStory.replace(":insertz:", zItem);
  story.textContent = newStory;
  story.style.visibility = 'visible';
}

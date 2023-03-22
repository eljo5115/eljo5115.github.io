const wrapper = document.getElementById("wrapper");

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const uniqueRand = (min, max, prev) => {
    let next = prev;
    
    while(prev === next) next = rand(min, max);
    
    return next;
}



const combinations = [
    { configuration: 1, roundness: 1 },
    { configuration: 1, roundness: 2 },
    { configuration: 1, roundness: 4 },
    { configuration: 2, roundness: 2 },
    { configuration: 2, roundness: 3 },
    { configuration: 3, roundness: 3 },
    { configuration: 4, roundness: 1 },
    { configuration: 4, roundness: 2 },
    { configuration: 4, roundness: 3 },
  ];

let prev=0;

const parent = document.getElementById("wrapper");
let paused = false;


for(const child of parent.children){
	child.addEventListener(
		"mouseenter",
		(event) =>{
			paused = true;
		}
						  );
}

for(const child of parent.children){
	child.addEventListener(
		"mouseleave",
		(event) =>{
			paused = false;
		}
						  );
}

setInterval( () => {
	if(!paused){
    const index = uniqueRand(0, combinations.length - 1, prev),
    combination = combinations[index];

    wrapper.dataset.configuration = combination.configuration;
    wrapper.dataset.roundness = combination.roundness;
    
    prev = index;
	}
},3000);
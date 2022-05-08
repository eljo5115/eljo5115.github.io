let path = document.querySelector("path");
            let pathLength = path.getTotalLength();

            path.style.strokeDasharray = pathLength + " " + pathLength;
            path.style.strokeDashoffset = pathLength;

            window.addEventListener("scroll", () =>{
                var scrollPercentage = (document.documentElement.scrollTop - document.body.scrollTop) /( document.documentElement.scrollHeight - document.documentElement.clientHeight);
                var drawLength = pathLength * scrollPercentage;
                path.style.strokeDashoffset = pathLength - drawLength;

                const target = document.querySelectorAll(".scroll");
                var index = 0, length = target.length;
for(index;index<length;index++){
    var pos = window.pageYOffset * target[index].dataset.rate;

    if(target[index].dataset.direction == "vertical"){
        target[index].style.transform = "translate3d(0px,'+pos+'px,0px)";


    }
    else{
        var posX = window.pageXOffset * target[index].dataset.ratex;
        var posY = window.pageYOffset * target[index].dataset.ratey;

        target[index].style.transform = "translate3d('+posX+'px,'+posY+'px,0px)";

    }
}
} );


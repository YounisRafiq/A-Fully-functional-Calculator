let input = document.querySelector(".input");
let Btns = document.querySelectorAll("button");

let Str = "";
let arr = Array.from(Btns);
arr.forEach(button => {
    button.addEventListener('click' , (e) => {
        if(e.target.innerHTML == "="){
            Str = eval(Str);
            input.value = Str;
        }
        else if(e.target.innerHTML == "AC"){
            Str = '';
            input.value = Str;
        }
        else if(e.target.innerHTML == "DEL"){
            Str = Str.substring(0 , Str.length-1);
            input.value = Str;
        }
        else {
            Str += e. target.innerHTML;
            input.value = Str;
        }

        
    })
})
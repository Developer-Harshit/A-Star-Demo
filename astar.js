// constants
const EMPTY = 0;
const ROCK = 1;
const START = 2;
const END = 3;
const OPENED = 4;
const CLOSED = 5;
const PATH = 6;

// state
let grid = [];
let sidx = 0;
let eidx = 63;
let width = 8;
let height = 8;

const STOP = 0;
const PLAY = 1;
const NEXT = 2;

let run_state = STOP;
let nodemap = [];
let openset = [];
let closeset = [];
let goal;
let start;
let cameFrom = {};
let path_found = false;

function print_msg(str){
    let msg_box = document.getElementById("msg-box");
    msg_box.innerText = str;
}

function clear_grid(){
    console.log("GRID LENTH _> ",grid.length)
    for(let idx = 0 ; idx < grid.length; idx++){

        let block_div = document.querySelector(`[data-idx="${idx}"]`);
        block_div.dataset.state = EMPTY;
        grid[idx] = EMPTY;
    }
    fill_block(0,START);
    fill_block(width*height - 1 , END);
    init_astar();
}

function fill_block(idx,state){
    let block_div = document.querySelector(`[data-idx="${idx}"]`);
    switch (state) {
        case START:
            let start_div = document.querySelector(`[data-state="${START}"]`);
            if (start_div) start_div.dataset.state = EMPTY;
            grid[idx] = EMPTY;
            sidx = idx;
            break;
        case END:
            let end_div = document.querySelector(`[data-state="${END}"]`);
            if (end_div) end_div.dataset.state = EMPTY;
            grid[idx] = EMPTY;
            eidx = idx;
            break;
        default:
            if(idx == sidx || idx == eidx) return;
            break;
    }
    
    if (state == EMPTY || state == ROCK) grid[idx] = state;
    block_div.dataset.state = state;
    
}

function fill_random(){
    for(let idx = 0 ; idx < grid.length; idx++){
        fill_block(idx,Math.random() > 0.8 ? ROCK : EMPTY);
    }
    fill_block(0,START);
    fill_block(width*height - 1 , END);
    init_astar();
}

let selected_state = ROCK;

function create_block(idx){
    

    let block_div = document.createElement("div");
    block_div.classList.add("block-div");
    block_div.dataset.idx = idx;
    block_div.dataset.state = EMPTY;//state;
    block_div.addEventListener("click",function (e){
        let bidx = +(e.target.dataset.idx);
        let bstate = +(e.target.dataset.state);
        if (bstate == START || bstate == END) return;
        
        fill_block(bidx,selected_state);
        init_astar();
    });
    return block_div;
}

function create_grid(w,h){
    width = w;
    height = h;

    const grid_div = document.getElementById("grid-div");
    grid_div.style.gridTemplateColumns = `repeat(${w},1fr)`;
    grid_div.style.gridTemplateRows = `repeat(${h},1fr)`;
    
    // clearing data
    grid = [];
    while(grid_div.firstChild){
        grid_div.removeChild(grid_div.lastChild);
    }
    
    const n = w*h;
    for(let idx = 0 ; idx < n ; idx++){
        
        grid_div.appendChild(create_block(idx));
        grid.push(EMPTY);
    }
    fill_block(0,START);
    fill_block(width*height - 1 , END);
    init_astar();
}


function toggle_gridlines(){
    const grid_div = document.getElementById("grid-div");
    if (!grid_div.style.gap || grid_div.style.gap == "initial") grid_div.style.gap = "2px";
    else grid_div.style.gap = "initial";
    
}
function start_game(){
    create_grid(32,32);
    toggle_gridlines();
    const fill_btn = document.getElementById("fill-btn");
    fill_btn.addEventListener("click",fill_random);
    const clear_btn = document.getElementById("clear-btn");
    clear_btn.addEventListener("click",clear_grid);
    const line_btn = document.getElementById("line-btn");
    line_btn.addEventListener("click",toggle_gridlines);
    
    
    const size_slt = document.getElementById("size-select");
    size_slt.addEventListener("change",(e)=>{
        let size = +e.target.value;
        create_grid(size,size);
        console.log(size);

    });
    const play_btn = document.getElementById("play-btn");
    play_btn.addEventListener("click",()=>{
        run_state = PLAY;
        play_btn.classList.add("active");

    })
    const stop_btn = document.getElementById("stop-btn");
    stop_btn.addEventListener("click",()=>{
        run_state = STOP;
        play_btn.classList.remove("active");
    })
    const next_btn = document.getElementById("next-btn");
    next_btn.addEventListener("click",()=>{
        run_state = NEXT;
        play_btn.classList.remove("active");
    })
    const reset_btn = document.getElementById("reset-btn");
    reset_btn.addEventListener("click",()=>{
        for (let idx = 0; idx < grid.length; idx++) {
            fill_block(idx,grid[idx]);    
        }
        init_astar();
        run_state = STOP;
        document.getElementById("play-btn").classList.remove("active");
        
    })

    fill_random();
    init_astar();
    requestAnimationFrame(a_star);
}

addEventListener("DOMContentLoaded",start_game);





///////////////////////////////////////
function init_astar(){
    nodemap = [];
    for (let idx = 0; idx < grid.length; idx++) {
        let ntype = grid[idx] == ROCK ? ROCK : EMPTY;
        nodemap.push(create_node(idx,ntype));
    }
    
    goal = nodemap[eidx];
    start = nodemap[sidx];
    
    start.g = 0;
    start.f = get_h(start);
    openset = [start];
    closeset = [];
    cameFrom = {};
    path_found = false;
}


function contains_node(nlist,node){
    for (let i = 0; i < nlist.length; i++) {
        if (nlist[i].idx == node.idx) return true;
    }
    return false;
}
function contains_idx(idx_list,node){
    for (let i = 0; i < idx_list.length; i++) {
        if (idx_list[i] == node) return true;
    }
    return false;
}
function gen_path(current){
    const path_blocks = document.querySelectorAll(`[data-state="${PATH}"]`);
    path_blocks.forEach(element => {
        
        fill_block(+element.dataset.idx,CLOSED);
    });
    
    while (current in cameFrom){
        current = cameFrom[current];
        fill_block(current,PATH);
    }
}

function create_node(idx,ntype){
    return {
        idx,
        f: Infinity,
        g : Infinity,
        x : idx % width,
        y : Math.floor(idx / width),
        type : ntype,

    }
}

function get_h(node){
    return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
}

function get_current(){
    let current = openset[0];
    for (let idx = 1; idx < openset.length; idx++) {
        const node = openset[idx];
        if (current.f > node.f) current = node;    
    }
    return current;
}

const N_OFFSETS = [
//  nx, ny,
     0,  1,
     0, -1,
     1,  0,
    -1,  0
]
function get_neighbours(current){
    for (let i = 0; i < N_OFFSETS.length; i+=2) {
        let nx = current.x + N_OFFSETS[i];
        let ny = current.y + N_OFFSETS[i+1];
        let node = nodemap[ nx + ny * width];
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || node.type == ROCK) continue;
    }
}

function a_star(){
    requestAnimationFrame(a_star);
    if (run_state == STOP) return;
    if (run_state == NEXT) run_state = STOP;
    
    
    if (path_found) {
        return;
    }
    if (openset.length == 0 ) {
        print_msg("No valid path found");
        document.getElementById("play-btn").classList.remove("active");
        run_state = STOP;
        return;
    }
    let current = get_current();
    if (current.idx == eidx){
        path_found = true;
        print_msg("Path Found");
        document.getElementById("play-btn").classList.remove("active");
        run_state = STOP;
        gen_path(current.idx);
        return;
    }
    print_msg("Running A Star");
    let temp_idx =  openset.indexOf(current);
    if (temp_idx > -1) openset.splice(temp_idx,1);
    closeset.push(current);
    fill_block(current.idx,CLOSED);
    


    // neighbours
    for (let i = 0; i < N_OFFSETS.length; i+=2) {
        let nx = current.x + N_OFFSETS[i];
        let ny = current.y + N_OFFSETS[i+1];
        let neighbour = nodemap[ nx + ny * width];
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || neighbour.type == ROCK) continue;
        
        let tentG = current.g + 1;
        if (tentG < neighbour.g){
            cameFrom[neighbour.idx] = current.idx;
            
            neighbour.g = tentG
            neighbour.f = tentG + get_h(neighbour);
        }
        if (!contains_node(openset,neighbour)){
            if (!contains_node(closeset,neighbour)){
                openset.push(neighbour);
                fill_block(neighbour.idx,OPENED);
            }
        }
    }
    gen_path(current.idx);
}

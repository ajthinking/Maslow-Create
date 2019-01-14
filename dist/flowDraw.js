//import utils from './utils'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight/2

//put some content in the sidebar at launch
let sideBar = document.querySelector('.sideBar');
let lowerHalfOfScreen = document.querySelector('.flex-parent');
lowerHalfOfScreen.setAttribute("style","height:"+innerHeight/2.1+"px");

// Event Listeners
let flowCanvas = document.getElementById('flow-canvas');
flowCanvas.addEventListener('contextmenu', showmenu);

flowCanvas.addEventListener('mousemove', event => {
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        molecule.clickMove(event.clientX,event.clientY);        
    });
})

flowCanvas.addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight

    init()
})

flowCanvas.addEventListener('mousedown', event => {
    //every time the mouse button goes down
    
    var clickHandledByMolecule = false;
    
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        if (molecule.clickDown(event.clientX,event.clientY) == true){
            clickHandledByMolecule = true;
        }
    });
    
    if(!clickHandledByMolecule){
        currentMolecule.updateIO();
        currentMolecule.updateSidebar();
    }
    
})

flowCanvas.addEventListener('dblclick', event => {
    //every time the mouse button goes down
    
    var clickHandledByMolecule = false;
    
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        if (molecule.doubleClick(event.clientX,event.clientY) == true){
            clickHandledByMolecule = true;
        }
    });
    
    if (clickHandledByMolecule == false){
        showmenu(event);
    }
})

flowCanvas.addEventListener('mouseup', event => {
    //every time the mouse button goes up
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        molecule.clickUp(event.clientX,event.clientY);      
    });
})

window.addEventListener('keydown', event => {
    //every time the mouse button goes up
    
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        molecule.keyPress(event.key);      
    });
})




// Node prototype objects

var AttachmentPoint = {
    
    defaultRadius: 8,
    expandedRadius: 14,
    radius: 8,
    
    hoverDetectRadius: 8,
    hoverOffsetX: 0,
    hoverOffsetY: 30,
    defaultOffsetX: 0,
    defaultOffsetY: 0,
    offsetX: 0,
    offsetY: 0,
    showHoverText: false,
    
    type: "output",
    value: 10, //The default input value when nothing is connected

    create: function(values){
        var instance = Object.create(this);
        Object.keys(values).forEach(function(key) {
            instance[key] = values[key];
        });
        
        instance.connectors = [];
        
        instance.offsetX = instance.defaultOffsetX;
        instance.offsetY = instance.defaultOffsetY;
        instance.x = instance.parentMolecule.x + instance.offsetX;
        instance.y = instance.parentMolecule.y + instance.offsetY;
        return instance;
    },
    
    draw: function() {
        
        c.beginPath();
        c.fillStyle = this.parentMolecule.color;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        if (this.showHoverText){
            if(this.type == "input"){
                c.textAlign = "end";
                c.fillText(this.name, this.x - (this.radius + 3), this.y+2)
            }
            else{
                c.textAlign = "start"; 
                c.fillText(this.name, this.x + (this.radius + 3), this.y+2)
            }
        }
        c.fill();
        c.closePath();
        
    },

    clickDown: function(x,y){
        if(distBetweenPoints (this.x, x, this.y, y) < this.defaultRadius){
            
            if(this.type == 'output'){                  //begin to extend a connector from this if it is an output
                var connector = Connector.create({
                    parentMolecule: this.parentMolecule, 
                    attachmentPoint1: this
                });
                this.connectors.push(connector);
            }
            
            if(this.type == 'input'){ //connectors can only be selected by clicking on an input
                this.connectors.forEach(connector => {     //select any connectors attached to this node
                    connector.selected = true;
                });
            }
            
            return true; //indicate that the click was handled by this object
        }
        else{
            if(this.type == 'input'){ //connectors can only be selected by clicking on an input
                this.connectors.forEach(connector => {      //unselect any connectors attached to this node
                    connector.selected = false;
                });
            }
            return false; //indicate that the click was not handled by this object
        }
    },

    clickUp: function(x,y){
        this.connectors.forEach(connector => {
            connector.clickUp(x, y);       
        });
    },

    clickMove: function(x,y){
        //expand if touched by mouse
        
        var distFromCursor = distBetweenPoints (this.x, x, this.y, y);
        
        //If we are hovering over the attachment point, indicate that by making it big
        if (distFromCursor < this.defaultRadius){
            this.radius = this.expandedRadius;
        }
        else{
            this.radius = this.defaultRadius;
        }
        
        
        //If we are close to the attachment point move it to it's hover location to make it accessable
        if (distFromCursor < this.hoverDetectRadius){
            this.offsetX = this.hoverOffsetX;
            this.offsetY = this.hoverOffsetY;
            this.showHoverText = true;
            this.hoverDetectRadius = this.defaultRadius + distBetweenPoints (this.defaultOffsetX, this.hoverOffsetX, this.defaultOffsetY, this.hoverOffsetY); 
        }
        else{
            this.offsetX = this.defaultOffsetX;
            this.offsetY = this.defaultOffsetY;
            this.showHoverText = false;
            this.hoverDetectRadius = this.defaultRadius;
        }
        
        this.connectors.forEach(connector => {
            connector.clickMove(x, y);       
        });
    },
    
    keyPress: function(key){
        this.connectors.forEach(connector => {
            connector.keyPress(key);       
        });
    },
    
    deleteSelf: function(){
        //remove any connectors which were attached to this attachment point
        
        this.connectors.forEach(connector => {
            connector.deleteSelf();       
        });
    },
    
    updateSidebar: function(){
        this.parent.updateSidebar();
    },
    
    wasConnectionMade: function(x,y, connector){
        //this function returns itself if the cordinates passed in are within itself
        if (distBetweenPoints(this.x, x, this.y, y) < this.radius){
            
            
            if(this.connectors.length > 0 && this.type == 'input'){ //Don't accept a second connection to an input
                return false;
            }
            
            this.connectors.push(connector);
            return this;
        }
        return false;
    },

    update: function() {
        this.x = this.parentMolecule.x + this.offsetX;
        this.y = this.parentMolecule.y + this.offsetY;
        this.draw()
        
        this.connectors.forEach(connector => {
            connector.update();       
        });
    }
}

var Connector =  {
    
    isMoving: true,
    color: 'black',
    selected: false,

    create: function(values){
        var instance = Object.create(this);
        Object.keys(values).forEach(function(key) {
            instance[key] = values[key];
        });
        
        instance.startX = instance.parentMolecule.outputX;
        instance.startY = instance.parentMolecule.y;
        
        return instance;
    },
    
    draw: function() {
        
        c.beginPath();
        c.fillStyle = this.color;
        c.globalCompositeOperation = 'destination-over'; //draw under other elements;
        if(this.selected){
            c.lineWidth = 3;
        }
        else{
            c.lineWidth = 1;
        }
        c.moveTo(this.startX, this.startY);
        c.bezierCurveTo(this.startX + 100, this.startY, this.endX - 100, this.endY, this.endX, this.endY);
        c.stroke();
        c.globalCompositeOperation = 'source-over'; //switch back to drawing on top
    },

    clickUp: function(x,y){
        
        var connectionNode = false;
        if(this.isMoving){  //we only want to attach the connector which is currently moving
            currentMolecule.nodesOnTheScreen.forEach(molecule => {                  //for every molecule on the screen  (should run three times)
                molecule.children.forEach(child => {
                    var thisConnectionValid = child.wasConnectionMade(x,y, this);
                    if(thisConnectionValid){
                        connectionNode = thisConnectionValid;
                    }
                });
            });
        }
        
        //FIXME: This bit needs to be refactored, its pretty ugly as is
        
        if(this.isMoving){
            if (connectionNode && connectionNode.type === "input" ){
                this.attachmentPoint2 = connectionNode;
            }
            else{
                //remove this connector from the stack
                this.attachmentPoint1.connectors.pop();
            }
        }
        
        this.isMoving = false;
        
    },

    clickMove: function(x,y){
        if (this.isMoving == true){
            this.endX = x;
            this.endY = y;
        }
    },
    
    keyPress: function(key){
        if(this.selected){
            if (key == 'Delete'){
                this.deleteSelf();
            }
        }
    },
    
    deleteSelf: function(){
        
        this.attachmentPoint2.connectors = []; //free up the point to which this was attached
        
        this.attachmentPoint1.connectors.splice(this.attachmentPoint1.connectors.indexOf(this),1); //remove this connector from the output it is attached to
    },
    
    update: function() {
        
        this.startX = this.attachmentPoint1.x
        this.startY = this.attachmentPoint1.y
        if (this.attachmentPoint2){  //check to see if the attachment point is defined
            this.endX = this.attachmentPoint2.x;
            this.endY = this.attachmentPoint2.y;
        }
        this.draw()
    },

    wasConnectionMade: function(x,y, connector){
        return false;
    }

}

var DrawingNode = {
    x: 0,
    y:  0,
    radius: 20,
    defaultColor: '#F3EFEF',
    selectedColor: 'green',
    selected: false,
    color: '#F3EFEF',
    name: "name",
    parentMolecule: null,
    isMoving: false,
    
    create: function(values){
        var instance = Object.create(this);
        Object.keys(values).forEach(function(key) {
            instance[key] = values[key];
        });
        
        instance.children = [];
        return instance;
    },
    
    draw: function() {
    
        this.inputX = this.x - this.radius
        this.outputX = this.x + this.radius
        
        this.children.forEach(child => {
            child.draw();       
        });
        
        c.beginPath();
        c.fillStyle = this.color;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.textAlign = "start"; 
        c.fillText(this.name, this.x + this.radius, this.y-this.radius);
        c.fill();
        c.closePath();
    },
    
    addIO: function(type, name, target){
        
        //compute the baseline offset from parent node
        var offset;
        if (type == "input"){
            offset = -1* target.radius;
        }
        else{
            offset = target.radius;
        }
        
        //compute hover offset from parent node
        //find the number of elements of the same type already in the array 
        var numberOfSameTypeIO = target.children.filter(child => child.type == type).length;
        //multiply that number by an offset to find the new x offset
        var hoverOffsetComputed = numberOfSameTypeIO * -30;
        
        input = AttachmentPoint.create({
            parentMolecule: target, 
            defaultOffsetX: offset, 
            defaultOffsetY: 0,
            hoverOffsetX: offset,
            hoverOffsetY: hoverOffsetComputed,
            type: type,
            name: name
        });
        target.children.push(input);
    },
    
    clickDown: function(x,y){
        //returns true if something was done with the click
        
        
        var clickProcessed = false;
        
        var distFromClick = distBetweenPoints(x, this.x, y, this.y);
        
        if (distFromClick < this.radius){
            this.color = this.selectedColor;
            this.isMoving = true;
            this.selected = true;
            this.updateSidebar();
            clickProcessed = true;
        }
        else{
            this.color = this.defaultColor;
            this.selected = false;
        }
        
        this.children.forEach(child => {
            if(child.clickDown(x,y) == true){
                clickProcessed = true;
            }
        });
        
        return clickProcessed; 
    },

    doubleClick: function(x,y){
        //returns true if something was done with the click
        
        
        var clickProcessed = false;
        
        var distFromClick = distBetweenPoints(x, this.x, y, this.y);
        
        if (distFromClick < this.radius){
            clickProcessed = true;
        }
        
        return clickProcessed; 
    },

    clickUp: function(x,y){
        this.isMoving = false;
        
        this.children.forEach(child => {
            child.clickUp(x,y);     
        });
    },

    clickMove: function(x,y){
        if (this.isMoving == true){
            this.x = x;
            this.y = y;
        }
        
        this.children.forEach(child => {
            child.clickMove(x,y);       
        });
    },
    
    keyPress: function(key){
        //runs whenver a key is pressed
        if (key == 'Delete'){
            if(this.selected == true){
                this.deleteNode();
            }
        }
        
        this.children.forEach(child => {
            child.keyPress(key);
        });
    },
    
    updateSidebar: function(){
        //updates the sidebar to display information about this node
        
        //remove everything in the sideBar now
        while (sideBar.firstChild) {
            sideBar.removeChild(sideBar.firstChild);
        }
        
        //add the name as a title
        var name = document.createElement('h1');
        name.textContent = this.name;
        name.setAttribute("style","text-align:center;");
        sideBar.appendChild(name);
        
        //Create a list element
        valueList = document.createElement("ul");
        sideBar.appendChild(valueList);
        valueList.setAttribute("class", "sidebar-list");
        
        //Add options to set all of the inputs
        this.children.forEach(child => {
            if(child.type == 'input'){
                createEditableValueListItem(valueList,child,"value", child.name, true);
            }
        });
        
        return valueList;
    },
    
    deleteNode: function(){
        //deletes this node and all of it's children
        
        this.children.forEach(child => {
            child.deleteSelf();       
        });
        
        this.parent.nodesOnTheScreen.splice(this.parent.nodesOnTheScreen.indexOf(this),1); //remove this node from the list
    },
    
    update: function() {
        
        this.children.forEach(child => {
            child.update();     
        });
        
        this.draw()
    }
}

var Atom = DrawingNode.create({
    codeBlock: ""
});

// Types of nodes

var Input = Atom.create({
    codeBlock: "",
    type: "input",
    name: "Input",
    height: 16,
    radius: 15,
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.addIO("output", "number or geometry", instance);
        
        return instance;
    },
    updateSidebar: function(){
        //updates the sidebar to display information about this node
        
        var valueList =  DrawingNode.updateSidebar.call(this); //call the super function
        
        createEditableValueListItem(valueList,this,"name", "Name", false);
        
    },
    draw: function() {
        
        this.children.forEach(child => {
            child.draw();       
        });
        
        
        c.fillStyle = this.color;
        
        c.textAlign = "start"; 
        c.fillText(this.name, this.x + this.radius, this.y-this.radius);

        
        c.beginPath();
        c.moveTo(this.x - this.radius, this.y - this.height/2);
        c.lineTo(this.x - this.radius + 10, this.y);
        c.lineTo(this.x - this.radius, this.y + this.height/2);
        c.lineTo(this.x + this.radius, this.y + this.height/2);
        c.lineTo(this.x + this.radius, this.y - this.height/2);
        c.fill();
        c.closePath();

    }
});

var Output = Atom.create({
    codeBlock: "",
    type: "output",
    name: "Output",
    height: 16,
    radius: 15,
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.addIO("input", "number or geometry", instance);
        
        return instance;
    },
    draw: function() {
        
        this.children.forEach(child => {
            child.draw();       
        });
        
        c.beginPath();
        c.fillStyle = this.color;
        c.rect(this.x - this.radius, this.y - this.height/2, 2*this.radius, this.height);
        c.textAlign = "end"; 
        c.fillText(this.name, this.x + this.radius, this.y-this.radius);
        c.fill();
        c.closePath();
        
        c.beginPath();
        c.moveTo(this.x + this.radius, this.y - this.height/2);
        c.lineTo(this.x + this.radius + 10, this.y);
        c.lineTo(this.x + this.radius, this.y + this.height/2);
        c.fill();
    }
});

var Constant = Atom.create({
    codeBlock: "",
    type: "constant",
    name: "Constant",
    height: 16,
    radius: 15,
    value: 0,
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.addIO("output", "number", instance);
        return instance;
    },
    updateSidebar: function(){
        //updates the sidebar to display information about this node
        
        var valueList = DrawingNode.updateSidebar.call(this); //call the super function
        
        createEditableValueListItem(valueList,this,"value", "Value", true);
        createEditableValueListItem(valueList,this,"name", "Name", false);
        
    },
    draw: function() {
        
        this.children.forEach(child => {
            child.draw();       
        });
        
        c.beginPath();
        c.fillStyle = this.color;
        c.rect(this.x - this.radius, this.y - this.height/2, 2*this.radius, this.height);
        c.textAlign = "start"; 
        c.fillText(this.name, this.x + this.radius, this.y-this.radius);
        c.fill();
        c.closePath();
    }
});

var Molecule = Atom.create({
    children: [], 
    name: "Molecule",
    topLevel: false, //a flag to signal if this node is the top level node
    
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.nodesOnTheScreen = [];
        
        if (!instance.topLevel){
            goUpOneLevel = UpOneLevelBtn.create({
                parentMolecule: instance, 
                x: 50,
                y: 50
            });
            instance.nodesOnTheScreen.push(goUpOneLevel);
        }
        return instance;
    },
    
    draw: function(){
        DrawingNode.draw.call(this); //Super call to draw the rest
        
        //draw the circle in the middle
        c.beginPath();
        c.fillStyle = "#949294";
        c.arc(this.x, this.y, this.radius/2, 0, Math.PI * 2, false);
        c.closePath();
        c.fill();
        
    },
    
    updateIO: function(){
        
        this.children = [];
        
        this.nodesOnTheScreen.forEach(node => {
            
            if(node.type == "input"){
                this.addIO("input", node.name, this);
            }
            if(node.type == "output"){
                this.addIO("output", node.name, this);
            }
        });
    },
    
    doubleClick: function(x,y){
        //returns true if something was done with the click
        
        
        var clickProcessed = false;
        
        var distFromClick = distBetweenPoints(x, this.x, y, this.y);
        
        if (distFromClick < this.radius){
            currentMolecule = this; //set this to be the currently displayed molecule
            clickProcessed = true;
        }
        
        return clickProcessed; 
    }
});

var UpOneLevelBtn = Atom.create({
    name: "Go Up One Level",
    children: [],
    color: '#F3EFEF',
    defaultColor: '#F3EFEF',
    selectedColor: '#F3EFEF',
    radius: 30,
    
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        return instance;
    },
    
    draw: function() {
        
        this.children.forEach(child => {
            child.draw();       
        });
        
        
        c.fillStyle = this.color;
        
        c.textAlign = "start"; 
        c.fillText(this.name, this.x, this.y-(this.radius-5));

        var shaftWidth = 7;
        
        c.beginPath();
        c.moveTo(this.x, this.y - this.radius/2);
        c.lineTo(this.x + this.radius/2, this.y);
        c.lineTo(this.x + shaftWidth, this.y);
        c.lineTo(this.x + shaftWidth, this.y + this.radius/2);
        c.lineTo(this.x - shaftWidth, this.y + this.radius/2);
        c.lineTo(this.x - shaftWidth, this.y);
        c.lineTo(this.x - this.radius/2, this.y);
        c.fill();
        c.closePath();

    },
    
    doubleClick: function(x,y){
        //returns true if something was done with the click
        
        var clickProcessed = false;
        var distFromClick = distBetweenPoints(x, this.x, y, this.y);
        
        if (distFromClick < this.radius){
            this.parentMolecule.updateIO(); //updates the IO shown on the parent molecule
            currentMolecule = this.parentMolecule.parent; //set parent this to be the currently displayed molecule
            clickProcessed = true;
        }
        
        return clickProcessed; 
    }
});

var Sphereoid = Atom.create({
    name: "Sphereoid",
    sphereRadius: 10,
    codeBlock: "some code to create a sphere",
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.addIO("input", "radius", instance);
        instance.addIO("output", "geometry", instance);
        return instance;
    }
});

var Cubeoid = Atom.create({
    name: "Cubeoid",
    xL: 10,
    yL: 10,
    zL: 10,
    codeBlock: "some code to create a sphere",
    create: function(values){
        var instance = DrawingNode.create.call(this, values);
        instance.addIO("input", "L", instance);
        instance.addIO("input", "W", instance);
        instance.addIO("input", "H", instance);
        instance.addIO("output", "geometry", instance);
        return instance;
    }
});

var Readme = Atom.create({
    codeBlock: "",
    readmeText: "Readme text here",
    type: "readme",
    name: "README",
    radius: 20,
    updateSidebar: function(){
        //updates the sidebar to display information about this node
        
        var valueList = DrawingNode.updateSidebar.call(this); //call the super function
        
        createEditableValueListItem(valueList,this,"readmeText", "Notes", false);
        
    },
    draw: function() {
        
        DrawingNode.draw.call(this); //Super call to draw the rest
        
        //draw the two slashes on the node//
        c.strokeStyle = "#949294";
        c.lineWidth = 3;
        c.lineCap = "round";
        
        c.beginPath();
        c.moveTo(this.x - 11, this.y + 10);
        c.lineTo(this.x, this.y - 10);
        c.stroke();
        
        c.beginPath();
        c.moveTo(this.x, this.y + 10);
        c.lineTo(this.x + 11, this.y - 10);
        c.stroke();
    }
});

// Implementation

var availableTypes = [Molecule, Sphereoid, Cubeoid, Input, Output, Constant, Readme];

let currentMolecule;
let menu;

function init() {
    currentMolecule = Molecule.create({x: 0, y: 0, topLevel: true, name: "Maslow Create"});
    
    menu = document.querySelector('.menu');
    menu.classList.add('off');
    menu.addEventListener('mouseleave', hidemenu);
    
    availableTypes.forEach(type => {
        var newElement = document.createElement("LI");
        var text = document.createTextNode(type.name);
        newElement.setAttribute("class", "menu-item");
        newElement.setAttribute("id", type.name);
        newElement.appendChild(text); 
        menu.appendChild(newElement); 
        
        document.getElementById(type.name).addEventListener('click', placeNewNode);
    }); 
}

function distBetweenPoints(x1, x2, y1, y2){
    var a2 = Math.pow(x1 - x2, 2);
    var b2 = Math.pow(y1 - y2, 2);
    var dist = Math.sqrt(a2 + b2);
    
    return dist;
}

function createEditableValueListItem(list,object,key, label, resultShouldBeNumber){
    var listElement = document.createElement("LI");
    list.appendChild(listElement);
    
    
    //Div which contains the entire element
    var div = document.createElement("div");
    listElement.appendChild(div);
    div.setAttribute("class", "sidebar-item");
    
    //Left div which displays the label
    var labelDiv = document.createElement("div");
    div.appendChild(labelDiv);
    var labelText = document.createTextNode(label + ":");
    labelDiv.appendChild(labelText);
    labelDiv.setAttribute("class", "sidebar-subitem");
    
    
    //Right div which is editable and displays the value
    var valueTextDiv = document.createElement("div");
    div.appendChild(valueTextDiv);
    var valueText = document.createTextNode(object[key]);
    valueTextDiv.appendChild(valueText);
    valueTextDiv.setAttribute("contenteditable", "true");
    valueTextDiv.setAttribute("class", "sidebar-subitem");
    valueTextDiv.setAttribute("id", label);
    
    
    document.getElementById(label).addEventListener('focusout', event => {
        var valueInBox = document.getElementById(label).textContent;
        if(resultShouldBeNumber){
            valueInBox = parseFloat(valueInBox);
        }
        object[key] = valueInBox;
        object.updateSidebar();
    });
    
    //prevent the return key from being used when editing a value
    document.getElementById(label).addEventListener('keypress', function(evt) {
        if (evt.which === 13) {
            evt.preventDefault();
            document.getElementById(label).blur();  //shift focus away if someone presses enter
        }
    });

}

function createNewMolecule(x,y, parent){
    
    var typeToCreate = Math.floor(Math.random() * (availableTypes.length));
    var molecule = availableTypes[typeToCreate].create({x: x, y: y});
    currentMolecule.nodesOnTheScreen.push(molecule);
}

function placeNewNode(ev){
    hidemenu();
    let clr = ev.target.id;
    
    
    availableTypes.forEach(type => {
        if (type.name === clr){
            var molecule = type.create({x: menu.x, y: menu.y, parent: currentMolecule});
            currentMolecule.nodesOnTheScreen.push(molecule);
        }
    });
    
}

function showmenu(ev){
    //stop the real right click menu
    ev.preventDefault(); 
    //show the custom menu
    menu.style.top = `${ev.clientY - 20}px`;
    menu.style.left = `${ev.clientX - 20}px`;
    menu.x = ev.clientX;
    menu.y = ev.clientY;
    menu.classList.remove('off');
}

function hidemenu(ev){
    menu.classList.add('off');
    menu.style.top = '-200%';
    menu.style.left = '-200%';
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    //c.fillText('T', mouse.x, mouse.y)
    currentMolecule.nodesOnTheScreen.forEach(molecule => {
        molecule.update();
    });
}

init()
animate()

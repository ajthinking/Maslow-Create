import Atom from '../prototypes/atom'

export default class Intersection extends Atom {
    
    constructor(values){
        
        super(values);
        
        this.addIO("input", "geometry1", this, "geometry", "");
        this.addIO("input", "geometry2", this, "geometry", "");
        this.addIO("output", "geometry", this, "geometry", "");
        
        this.name = "Intersection";
        this.atomType = "Intersection";
        this.defaultCodeBlock = "intersection(~geometry1~,~geometry2~)";
        this.codeBlock = "";
        
        this.setValues(values);
    }
}
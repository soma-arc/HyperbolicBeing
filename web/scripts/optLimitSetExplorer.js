function mobiusOnPoint(t, z){
    if(z.isInfinity()){
	if(!t.c.isZero()){
	    return t.a.div(t.c);
	}else{
	    return Complex.INFINITY;
	}
    }else{
	numerix = t.a.mult(z).add(t.b);
	denominator = t.c.mult(z).add(t.d);

	if(denominator.isZero()){
	    return Complex.INFINITY;
	}else{
	    return numerix.div(denominator);
	}
    }
}

var OptLimitSetExplorer = function(gens){
    this.gens = gens;
    this.maxLevel = 0;
    this.fixPoints = [mobiusOnPoint(gens[0], Complex.INFINITY),
                      mobiusOnPoint(gens[1], Complex.INFINITY),
                      mobiusOnPoint(gens[2], Complex.INFINITY)];
    this.tags = new Array(this.maxLevel + 1);
    this.words = new Array(this.maxLevel + 1);
    this.tags[0] = -1;
    this.words[0] = SL2C.UNIT;
    this.words[1] = this.gens[1]
    this.tags[1] = 1;
    this.level = 1;
    this.points = [];
}

OptLimitSetExplorer.prototype = {
    init: function(maxLevel){
        this.maxLevel = maxLevel;
        this.tags = new Array(this.maxLevel + 1);
        this.words = new Array(this.maxLevel + 1);
        this.tags[0] = -1;
        this.words[0] = SL2C.UNIT;
        this.words[1] = this.gens[1]
        this.tags[1] = 1;
        this.level = 1;
        this.points = [];
    },
    run: function(maxLevel, epsilon){
        this.init(maxLevel);
	this.points.push(0, 0);
	do{
	    while(this.branchTermination(epsilon) == false){
		this.goForward();
	    }
	    do{
		this.goBackward();
	    }while(this.level != 0 && this.isAvailableTurn() == false);
	    this.turnAndGoForward();
	}while(this.level != 1 || this.tags[1] != 0);
	this.points.push(1, 0);
	return this.points;
    },
    goForward: function(){
        this.level++;

        this.tags[this.level] = (this.tags[this.level - 1] + 1) % 3;
        this.words[this.level] = this.words[this.level -1].mult(this.gens[this.tags[this.level]]);
    },
    isAvailableTurn: function(){
        if((this.tags[this.level] + 2) % 3 != (this.tags[this.level + 1] + 1) % 3 ||
	   (this.level == 2 && this.tags[1] == 2 && this.tags[2] == 1 && this.tags[3] == 2)){
	    return false;
	}
	return true;
    },
    goBackward: function(){
        this.level--;
    },
    turnAndGoForward: function(){
	this.tags[this.level + 1] = (this.tags[this.level + 1] + 1)%3;
	this.words[this.level + 1] = this.words[this.level].mult(this.gens[this.tags[this.level + 1]]);
	this.level++;
    },
    branchTermination: function(epsilon){
        var p1 = mobiusOnPoint(this.words[this.level], this.fixPoints[(this.tags[this.level] + 1) % 3])
	var p2 = mobiusOnPoint(this.words[this.level], this.fixPoints[(this.tags[this.level] + 2) % 3]);
	if((p1.dist(p2)) < epsilon || this.level == this.maxLevel){
	    this.points.push(p1.re, p1.i, p2.re, p2.i);
	    return true;
	}
	return false;
    }

}

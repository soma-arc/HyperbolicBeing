var ComplexProbability = function(a1, a2, origin){
    this.origin = origin;
    this.a1 = a1;
    this.a2 = a2;
    this.a0 = (Complex.ONE).sub(a1).sub(a2);
    this.setData();
}

ComplexProbability.prototype = {
    setQ: function(Q){
        this.a1 = Q.sub(this.origin);
	this.a2 = this.r0.sub(Q);
	this.a0 = Complex.ONE.sub(this.a1).sub(this.a2);
	this.setData();
    },
    moveQ: function(step){
        var Q = q0.add(step);
	this.a1 = Q.sub(this.origin);
	this.a2 = r0.sub(Q);
	this.a0 = Complex.ONE.sub(this.a1).sub(this.a2);
	this.setData();
    },
    setR: function(R){
        this.a2 = R.sub(origin).sub(this.a1);
	this.a0 = Complex.ONE.sub(this.a1).sub(this.a2);
	this.setData();
    },
    moveR: function(step){
        var R = this.r0.add(step);
	this.a2 = R.sub(this.origin).sub(this.a1);
	this.a0 = Complex.ONE.sub(this.a1).sub(this.a2);
	this.setData();
    },
    setData: function(){
        this.x = Complex.sqrt(Complex.ONE.div(this.a0.mult(this.a1)));
	this.y = Complex.sqrt(Complex.ONE.div(this.a1.mult(this.a2)));
	this.z = Complex.sqrt(Complex.ONE.div(this.a2.mult(this.a0)));

	// this.mirrorVecX = Complex.I.div(this.x);
	// this.mirrorVecY = Complex.I.div(this.y);
	// this.mirrorVecZ = Complex.I.div(this.z);

        this.p0 = this.origin;
	this.q0 = this.p0.add(this.a1);
	this.r0 = this.q0.add(this.a2);
    },
    calcGen: function(p, x){
        return new SL2C(x.mult(p),
                        x.mult(p.mult(p)).mult(Complex.MINUS_ONE).sub(Complex.ONE.div(x)),
        		x,
                        x.mult(p).mult(Complex.MINUS_ONE));
    },
    getGens: function(){
        return [this.calcGen(this.p0, this.x),
                this.calcGen(this.q0, this.y),
                this.calcGen(this.r0, this.z)];
    }
}

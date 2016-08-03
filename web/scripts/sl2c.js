var SL2C = function(a, b, c, d){
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
};

SL2C.prototype = {
    mult: function(m){
	// if(typeof m == 'Number'){
	//     return new SL2C(this.a * m, this.b * m,
	// 		      this.c * m, this.d * m);
	// }else if(m instanceof Complex){
	//     return new SL2C(this.a.mult(m), this.b.mult(m),
	// 		      this.c.mult(m), this.d.mult(m));
	// }
	return new SL2C(
	    this.a.mult(m.a).add(this.b.mult(m.c)),
	    this.a.mult(m.b).add(this.b.mult(m.d)),
	    this.c.mult(m.a).add(this.d.mult(m.c)),
	    this.c.mult(m.b).add(this.d.mult(m.d)));
    },
    determinant: function(){
	return this.a.mult(this.d).sub(this.b.mult(this.c));
    },
    inverse: function(){
	var one = new Complex(1.0, 0.0);
	return new SL2C(this.d, this.b.mult(-1.0),
			  this.c.mult(-1.0), this.a).mult(one.div(this.determinant()));
    },
    trace: function(){
	return this.a.add(this.d);
    }
};

SL2C.UNIT = new SL2C(Complex.ONE, Complex.ZERO,
                     Complex.ZERO, Complex.ONE);

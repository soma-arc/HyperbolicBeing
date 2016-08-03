var SQRT2 = Math.sqrt(2);
var Complex = function(re, i){
    this.re = re;
    this.i = i;

    arguments.callee.sqrt = function(c){
        if(c.isInfinity())
            return c;
	if(c.i > 0){
	    return new Complex((Math.sqrt(c.re + Math.sqrt(c.re*c.re + c.i*c.i)) / SQRT2),
	                       (Math.sqrt(-c.re + Math.sqrt(c.re*c.re + c.i*c.i)) / SQRT2));
	}else if(c.i < 0){
	    return new Complex((Math.sqrt(c.re + Math.sqrt(c.re*c.re + c.i*c.i)) / SQRT2),
	                       (-Math.sqrt(-c.re + Math.sqrt(c.re*c.re + c.i*c.i)) / SQRT2));
	}

	if(c.re < 0){
	    return new Complex(0.0, Math.sqrt(Math.abs(c.re)));
	}
	return new Complex(Math.sqrt(c.re), 0);
    };
};
Complex.prototype = {
    add: function(c){
	return new Complex(this.re + c.re, this.i + c.i);
    },
    sub: function(c){
	return new Complex(this.re - c.re, this.i - c.i);
    },
    mult: function(c){
	return new Complex(this.re * c.re - this.i * c.i, this.re * c.i + this.i * c.re);
    },
    div: function(c){
	var denom = c.re * c.re + c.i * c.i;
	if(denom == 0){
	    return Complex.INFINITY;
	}else if(denom == Number.POSITIVE_INFINITY){
	    return new Complex(0, 0);
	}
	return new Complex((this.re * c.re + this.i * c.i) / denom,
			   (this.i * c.re - this.re * c.i) / denom);
    },
    abs : function(){
	return Math.sqrt(this.re * this.re + this.i * this.i);
    },
    conjugation : function(){
	return new Complex(this.re , - this.i);
    },
    isInfinity : function(){
	if(this.re == Number.POSITIVE_INFINITY || this.i == Number.POSITIVE_INFINITY ||
           this.re == Number.NEGATIVE_INFINITY || this.i == Number.NEGATIVE_INFINITY){
	    return true;
	}
	return false;
    },
    isZero : function(){
	if(this.re == 0 && this.i == 0){
	    return true;
	}
	return false;
    },
    dist: function(c){
        return Math.sqrt(Math.pow(this.re - c.re, 2) + Math.pow(this.i - c.im, 2));
    },
};

Complex.ZERO = new Complex(0, 0);
Complex.ONE = new Complex(1, 0);
Complex.MINUS_ONE = new Complex(-1, 0);
Complex.INFINITY = new Complex(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

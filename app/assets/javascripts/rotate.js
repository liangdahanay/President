var ImageTrans1 = function(container,score){
    this._initialize( container, null );
    this._score=score;
    this._initMode();
    this._rate=0;  //没有四舍五入的， 梁屌是傻逼
    this._rate1=0; //四舍五入的， 梁屌是傻逼
    this._sen=4; //灵敏度，值越高，转动按钮幅度变化越快 必须大于等一1
    this._pre=0;
    this._predif=0;
  
    if ( this._support ) {
        this._initContainer();
        this._init();
    } else {
        this.onError("not support");
    }
};
ImageTrans1.prototype = {
  _initialize: function(container, options) {
    var container = this._container = $$(container);
    this._clientWidth = container.clientWidth;
    this._clientHeight = container.clientHeight;
    this._img = new Image();
    this._style = {};
    this._x = this._y = 1;
    this._radian = 0;
    this._support = false;
    this._init = this._load = this._show = this._dispose = $$.emptyFunction;
    
    var opt = this._setOptions(options);
    
    
    this.onPreLoad = opt.onPreLoad;
    this.onLoad = opt.onLoad;
    this.onError = opt.onError;
    
    this._LOAD = $$F.bind( function(){
        this.onLoad(); this._load(); this.reset();
        this._img.style.visibility = "visible";
    }, this );
    
    $$CE.fireEvent( this, "init" );
  },
  _setOptions: function(options) {
    this.options = {
        mode:        "css3",
        onPreLoad:    function(){},
        onLoad:        function(){},
        onError:    function(err){}
    };
    return $$.extend(this.options, options || {});
  },
  _initMode: function() {
    var modes = ImageTrans1.modes;
    this._support = $$A.some( this.options.mode.toLowerCase().split("|"), function(mode){
        mode = modes[ mode ];
        if ( mode && mode.support ) {
            mode.init && (this._init = mode.init);
            mode.load && (this._load = mode.load);
            mode.show && (this._show = mode.show);
            mode.dispose && (this._dispose = mode.dispose);
            $$A.forEach( ImageTrans1.transforms, function(transform, name){
                this[ name ] = function(){
                    transform.apply( this, [].slice.call(arguments) );
                    this._show();
                }
            }, this );
            return true;
        }
    }, this );
  },

  _initContainer: function() {
    var container = this._container, style = container.style, position = $$D.getStyle( container, "position" );
    this._style = { "position": style.position, "overflow": style.overflow };
    if ( position != "relative" && position != "absolute" ) { style.position = "relative"; }
    style.overflow = "hidden";
    $$CE.fireEvent( this, "initContainer" );
  },

  load: function(src) {
    if ( this._support ) {
        var img = this._img, oThis = this;
        img.onload || ( img.onload = this._LOAD );
        img.onerror || ( img.onerror = function(){ oThis.onError("err image"); } );
        img.style.visibility = "hidden";
        this.onPreLoad();
        img.src = src;
    }
  },

  reset: function() {
    if ( this._support ) {
        this._x = this._y = 1; this._radian = 0;
        this._show();
    }
  },

  dispose: function() {
    if ( this._support ) {
        this._dispose();
        $$CE.fireEvent( this, "dispose" );
        $$D.setStyle( this._container, this._style );
        this._container = this._img = this._img.onload = this._img.onerror = this._LOAD = null;
    }
  }
};

ImageTrans1.modes = function(){
    var css3Transform;

    function initImg(img, container) {
        $$D.setStyle( img, {
            position: "absolute",
            border: 0, padding: 0, margin: 0, width: "auto", height: "auto",
            visibility: "hidden"
        });
        container.appendChild( img );
    }

    function getMatrix(radian, x, y) {
        var Cos = Math.cos(radian), Sin = Math.sin(radian);
        return {
            M11: Cos * x, M12:-Sin * y,
            M21: Sin * x, M22: Cos * y
        };
    }
	return {
		css3: {
			support: function(){
				var style = document.createElement("div").style;
				return $$A.some(
					[ "transform", "MozTransform", "webkitTransform", "OTransform" ],
					function(css){ if ( css in style ) {
						css3Transform = css; return true;
					}});
			}(),
			init: function() { initImg( this._img, this._container ); },
			load: function(){
				var img = this._img;
				$$D.setStyle( img, {
					top: ( this._clientHeight - img.height ) / 2 + "px",
					left: ( this._clientWidth - img.width ) / 2 + "px",
					visibility: "visible"
				});
			},
			show: function() {
				var matrix = getMatrix( this._radian, this._y, this._x );
				this._img.style[ css3Transform ] = "matrix("
					+ matrix.M11.toFixed(16) + "," + matrix.M21.toFixed(16) + ","
					+ matrix.M12.toFixed(16) + "," + matrix.M22.toFixed(16) + ", 0, 0)";
			},
			dispose: function(){ this._container.removeChild(this._img); }
		},
		filter: {
			support: function(){ return "filters" in document.createElement("div"); }(),
			init: function() {
				initImg( this._img, this._container );
				this._img.style.filter = "progid:DXImageTransform.Microsoft.Matrix(SizingMethod='auto expand')";
			},
			load: function(){
				this._img.onload = null;
				this._img.style.visibility = "visible";
			},
			show: function() {
				var img = this._img;
				$$.extend(
					img.filters.item("DXImageTransform.Microsoft.Matrix"),
					getMatrix( this._radian, this._y, this._x )
				);

				img.style.top = ( this._clientHeight - img.offsetHeight ) / 2 + "px";
				img.style.left = ( this._clientWidth - img.offsetWidth ) / 2 + "px";
			},
			dispose: function(){ this._container.removeChild(this._img); }
		},
		canvas: {
			support: function(){ return "getContext" in document.createElement('canvas'); }(),
			init: function() {
				var canvas = this._canvas = document.createElement('canvas'),
					context = this._context = canvas.getContext('2d');
				$$D.setStyle( canvas, { position: "absolute", left: 0, top: 0 } );
				canvas.width = this._clientWidth; canvas.height = this._clientHeight;
				this._container.appendChild(canvas);
			},
			show: function(){
				var img = this._img, context = this._context,
					clientWidth = this._clientWidth, clientHeight = this._clientHeight;
				context.save();
				context.clearRect( 0, 0, clientWidth, clientHeight );
				context.translate( clientWidth / 2 , clientHeight / 2 );
				context.rotate( this._radian );
				context.scale( this._y, this._x );
				context.drawImage( img, -img.width / 2, -img.height / 2 );
				context.restore();
			},
			dispose: function(){
				this._container.removeChild( this._canvas );
				this._canvas = this._context = null;
			}
		}
	};
}();

ImageTrans1.transforms = {
  rotate: function(radian) { this._radian = radian; },
};
ImageTrans1.prototype._initialize = (function(){
    var pre=0;
    var init = ImageTrans1.prototype._initialize,
        methods = {
            "init": function(){
                this._mrX = this._mrY = this._mrRadian = 0;
                this._mrSTART = $$F.bind( start, this );
                this._mrMOVE = $$F.bind( move, this );
                this._mrSTOP = $$F.bind( stop, this );
            },
            "initContainer": function(){
                $$E.addEvent( this._container, "mousedown", this._mrSTART );
            },
            "dispose": function(){
                $$E.removeEvent( this._container, "mousedown", this._mrSTART );
                this._mrSTOP();
                this._mrSTART = this._mrMOVE = this._mrSTOP = null;
            }
        };
    function start(e){
        var rect = $$D.clientRect( this._container );
        this._mrX = rect.left + this._clientWidth / 2;
        this._mrY = rect.top + this._clientHeight / 2;
        this._mrRadian = Math.atan2( e.clientY - this._mrY, e.clientX - this._mrX ) - this._radian;
        $$E.addEvent( document, "mousemove", this._mrMOVE );
        $$E.addEvent( document, "mouseup", this._mrSTOP );
        if ( $$B.ie ) {
            var container = this._container;
            $$E.addEvent( container, "losecapture", this._mrSTOP );
            container.setCapture();
        } else {
            $$E.addEvent( window, "blur", this._mrSTOP );
            e.preventDefault();
        }
    };
    function move(e){
	var angle=Math.atan2( e.clientY - this._mrY, e.clientX - this._mrX ) - this._mrRadian;
	this.rotate(angle);
	var dif=angle-this._pre;
	if(angle*this._pre<0)
	{
		if(this._predif>0&&dif<0||this._predif<0&&dif>0) dif=-1*dif;
	}
	if(dif<0)
	{
		if(this._rate+dif*this._sen<0) this._rate=0;
		else this._rate=Math.round(this._rate+dif*this._sen);	
	}
	else
	{
		if(this._rate+dif*this._sen>100) this._rate=100;
		else this._rate=Math.round(this._rate+dif*this._sen);
	}
	this._pre=angle;
	this._predif=dif;
	var remain=Math.round(this._rate%10);
	if(remain<=2) remain=0;
	else if(remain<=7) remain=5;
	else remain=10;
	this._rate1=Math.floor(this._rate/10)*10+remain;
	document.getElementById(this._score).innerHTML = "Score "+this._rate1;
	 document.getElementById('comment_score').value = this._rate1;
        window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
    };
    function stop(){
        $$E.removeEvent( document, "mousemove", this._mrMOVE );
        $$E.removeEvent( document, "mouseup", this._mrSTOP );
        if ( $$B.ie ) {
            var container = this._container;
            $$E.removeEvent( container, "losecapture", this._mrSTOP );
            container.releaseCapture();
        } else {
            $$E.removeEvent( window, "blur", this._mrSTOP );
        };
    };
    return function(){
        var options = arguments[1];
        if ( !options || options.mouseRotate !== false ) {
            $$A.forEach( methods, function( method, name ){
                $$CE.addEvent( this, name, method );
            }, this );
        }
        init.apply( this, arguments );
    }
})();


var ImageTrans2 = function(container,score){
    this._initialize( container, null );
    this._score=score;
    this._initMode();
    this._rate=0;  //没有四舍五入的， 梁屌是傻逼
    this._rate1=0; //四舍五入的， 梁屌是傻逼
    this._sen=2; //灵敏度，值越高，转动按钮幅度变化越快 必须大于等一1
    this._pre=0;
    this._predif=0;
  
    if ( this._support ) {
        this._initContainer();
        this._init();
    } else {
        this.onError("not support");
    }
};
ImageTrans2.prototype = {
  _initialize: function(container, options) {
    var container = this._container = $$(container);
    this._clientWidth = container.clientWidth;
    this._clientHeight = container.clientHeight;
    this._img = new Image();
    this._style = {};
    this._x = this._y = 1;
    this._radian = 0;
    this._support = false;
    this._init = this._load = this._show = this._dispose = $$.emptyFunction;
    
    var opt = this._setOptions(options);
    
    
    this.onPreLoad = opt.onPreLoad;
    this.onLoad = opt.onLoad;
    this.onError = opt.onError;
    
    this._LOAD = $$F.bind( function(){
        this.onLoad(); this._load(); this.reset();
        this._img.style.visibility = "visible";
    }, this );
    
    $$CE.fireEvent( this, "init" );
  },
  _setOptions: function(options) {
    this.options = {
        mode:        "css3",
        onPreLoad:    function(){},
        onLoad:        function(){},
        onError:    function(err){}
    };
    return $$.extend(this.options, options || {});
  },
  _initMode: function() {
    var modes = ImageTrans2.modes;
    this._support = $$A.some( this.options.mode.toLowerCase().split("|"), function(mode){
        mode = modes[ mode ];
        if ( mode && mode.support ) {
            mode.init && (this._init = mode.init);
            mode.load && (this._load = mode.load);
            mode.show && (this._show = mode.show);
            mode.dispose && (this._dispose = mode.dispose);
            $$A.forEach( ImageTrans2.transforms, function(transform, name){
                this[ name ] = function(){
                    transform.apply( this, [].slice.call(arguments) );
                    this._show();
                }
            }, this );
            return true;
        }
    }, this );
  },

  _initContainer: function() {
    var container = this._container, style = container.style, position = $$D.getStyle( container, "position" );
    this._style = { "position": style.position, "overflow": style.overflow };
    if ( position != "relative" && position != "absolute" ) { style.position = "relative"; }
    style.overflow = "hidden";
    $$CE.fireEvent( this, "initContainer" );
  },

  load: function(src) {
    if ( this._support ) {
        var img = this._img, oThis = this;
        img.onload || ( img.onload = this._LOAD );
        img.onerror || ( img.onerror = function(){ oThis.onError("err image"); } );
        img.style.visibility = "hidden";
        this.onPreLoad();
        img.src = src;
    }
  },

  reset: function() {
    if ( this._support ) {
        this._x = this._y = 1; this._radian = 0;
        this._show();
    }
  },

  dispose: function() {
    if ( this._support ) {
        this._dispose();
        $$CE.fireEvent( this, "dispose" );
        $$D.setStyle( this._container, this._style );
        this._container = this._img = this._img.onload = this._img.onerror = this._LOAD = null;
    }
  }
};

ImageTrans2.modes = function(){
    var css3Transform;

    function initImg(img, container) {
        $$D.setStyle( img, {
            position: "absolute",
            border: 0, padding: 0, margin: 0, width: "auto", height: "auto",
            visibility: "hidden"
        });
        container.appendChild( img );
    }

    function getMatrix(radian, x, y) {
        var Cos = Math.cos(radian), Sin = Math.sin(radian);
        return {
            M11: Cos * x, M12:-Sin * y,
            M21: Sin * x, M22: Cos * y
        };
    }
	return {
		css3: {
			support: function(){
				var style = document.createElement("div").style;
				return $$A.some(
					[ "transform", "MozTransform", "webkitTransform", "OTransform" ],
					function(css){ if ( css in style ) {
						css3Transform = css; return true;
					}});
			}(),
			init: function() { initImg( this._img, this._container ); },
			load: function(){
				var img = this._img;
				$$D.setStyle( img, {
					top: ( this._clientHeight - img.height ) / 2 + "px",
					left: ( this._clientWidth - img.width ) / 2 + "px",
					visibility: "visible"
				});
			},
			show: function() {
				var matrix = getMatrix( this._radian, this._y, this._x );
				this._img.style[ css3Transform ] = "matrix("
					+ matrix.M11.toFixed(16) + "," + matrix.M21.toFixed(16) + ","
					+ matrix.M12.toFixed(16) + "," + matrix.M22.toFixed(16) + ", 0, 0)";
			},
			dispose: function(){ this._container.removeChild(this._img); }
		},
		filter: {
			support: function(){ return "filters" in document.createElement("div"); }(),
			init: function() {
				initImg( this._img, this._container );
				this._img.style.filter = "progid:DXImageTransform.Microsoft.Matrix(SizingMethod='auto expand')";
			},
			load: function(){
				this._img.onload = null;
				this._img.style.visibility = "visible";
			},
			show: function() {
				var img = this._img;
				$$.extend(
					img.filters.item("DXImageTransform.Microsoft.Matrix"),
					getMatrix( this._radian, this._y, this._x )
				);

				img.style.top = ( this._clientHeight - img.offsetHeight ) / 2 + "px";
				img.style.left = ( this._clientWidth - img.offsetWidth ) / 2 + "px";
			},
			dispose: function(){ this._container.removeChild(this._img); }
		},
		canvas: {
			support: function(){ return "getContext" in document.createElement('canvas'); }(),
			init: function() {
				var canvas = this._canvas = document.createElement('canvas'),
					context = this._context = canvas.getContext('2d');
				$$D.setStyle( canvas, { position: "absolute", left: 0, top: 0 } );
				canvas.width = this._clientWidth; canvas.height = this._clientHeight;
				this._container.appendChild(canvas);
			},
			show: function(){
				var img = this._img, context = this._context,
					clientWidth = this._clientWidth, clientHeight = this._clientHeight;
				context.save();
				context.clearRect( 0, 0, clientWidth, clientHeight );
				context.translate( clientWidth / 2 , clientHeight / 2 );
				context.rotate( this._radian );
				context.scale( this._y, this._x );
				context.drawImage( img, -img.width / 2, -img.height / 2 );
				context.restore();
			},
			dispose: function(){
				this._container.removeChild( this._canvas );
				this._canvas = this._context = null;
			}
		}
	};
}();

ImageTrans2.transforms = {
  rotate: function(radian) { this._radian = radian; },
};
ImageTrans2.prototype._initialize = (function(){
    var pre=0;
    var init = ImageTrans2.prototype._initialize,
        methods = {
            "init": function(){
                this._mrX = this._mrY = this._mrRadian = 0;
                this._mrSTART = $$F.bind( start, this );
                this._mrMOVE = $$F.bind( move, this );
                this._mrSTOP = $$F.bind( stop, this );
            },
            "initContainer": function(){
                $$E.addEvent( this._container, "mousedown", this._mrSTART );
            },
            "dispose": function(){
                $$E.removeEvent( this._container, "mousedown", this._mrSTART );
                this._mrSTOP();
                this._mrSTART = this._mrMOVE = this._mrSTOP = null;
            }
        };
    function start(e){
        var rect = $$D.clientRect( this._container );
        this._mrX = rect.left + this._clientWidth / 2;
        this._mrY = rect.top + this._clientHeight / 2;
        this._mrRadian = Math.atan2( e.clientY - this._mrY, e.clientX - this._mrX ) - this._radian;
        $$E.addEvent( document, "mousemove", this._mrMOVE );
        $$E.addEvent( document, "mouseup", this._mrSTOP );
        if ( $$B.ie ) {
            var container = this._container;
            $$E.addEvent( container, "losecapture", this._mrSTOP );
            container.setCapture();
        } else {
            $$E.addEvent( window, "blur", this._mrSTOP );
            e.preventDefault();
        }
    };
    function move(e){
	var angle=Math.atan2( e.clientY - this._mrY, e.clientX - this._mrX ) - this._mrRadian;
	this.rotate(angle);
	var dif=angle-this._pre;
	if(angle*this._pre<0)
	{
		if(this._predif>0&&dif<0||this._predif<0&&dif>0) dif=-1*dif;
	}
	if(dif<0)
	{
		if(this._rate+dif*this._sen<0) this._rate=0;
		else this._rate=Math.round(this._rate+dif*this._sen);	
	}
	else
	{
		if(this._rate+dif*this._sen>100) this._rate=100;
		else this._rate=Math.round(this._rate+dif*this._sen);
	}
	this._pre=angle;
	this._predif=dif;
	var remain=Math.round(this._rate%10);
	if(remain<=2) remain=0;
	else if(remain<=7) remain=5;
	else remain=10;
	this._rate1=Math.floor(this._rate/10)*10+remain;
	document.getElementById(this._score).innerHTML = "Score "+this._rate1;   
	document.getElementById('comment2_score').value = this._rate1;
        window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
    };
    function stop(){
        $$E.removeEvent( document, "mousemove", this._mrMOVE );
        $$E.removeEvent( document, "mouseup", this._mrSTOP );
        if ( $$B.ie ) {
            var container = this._container;
            $$E.removeEvent( container, "losecapture", this._mrSTOP );
            container.releaseCapture();
        } else {
            $$E.removeEvent( window, "blur", this._mrSTOP );
        };
    };
    return function(){
        var options = arguments[1];
        if ( !options || options.mouseRotate !== false ) {
            $$A.forEach( methods, function( method, name ){
                $$CE.addEvent( this, name, method );
            }, this );
        }
        init.apply( this, arguments );
    }
})();




if ( typeof Object.getPrototypeOf !== "function" ) {
  // http://ejohn.org/blog/objectgetprototypeof/
  if ( typeof "test".__proto__ === "object" ) {
    Object.getPrototypeOf = function(object){
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object){
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}

Object.prototype.inherit = function(clas, inherit) {
	if(!clas.__hasInherited) {
		var proto = Object.getPrototypeOf(this);
		for(var k in inherit.prototype) {
			if(!proto[k]) {
				// TODO:
				// In Webkit hasOwnProperty returns true only on real properties (get/set), not methods.
				// In Rhino hasOwnProperty returns true for methods also. 
				if(inherit.prototype.hasOwnProperty(k) && typeof(inherit.prototype[k]) != 'function') {
					Object.defineProperty(proto, k, Object.getOwnPropertyDescriptor(inherit.prototype, k)); 
				} else {
					proto[k] = inherit.prototype[k];
				}
			}
		}                                                             
		for(var k in inherit) {
		     if(k != 'prototype' && !clas[k]) {
				clas[k] = inherit[k];
			}
		}
		clas.__hasInherited = true;
	}	
};

var JDS = {
	using: function () {
		if(!window.usingsLoading) {
				window.usingsLoading = {};
				window.numUsingsLoading = 0;
		}
			
		for(var i=0;i < arguments.length;i++) {
			if(!window.usingsLoading[arguments[i]]) {
					window.usingsLoading[arguments[i]] = true;
					window.numUsingsLoading++;
					var script = document.createElement("script");
					script.type = 'text/javascript';
					var src = 'js/'+arguments[i].replace(/\./g, '/')+'.js';
					
					if(typeof Envjs != 'undefined') {
					   // TODO: No hardcoding!
					   src = 'file:///Users/hallvar/Code/DnB.Fagdag/'+src;
				       load(src);
					} else {
						script.src = src;
						document.body.appendChild(script);
					}
			}
		}
	
		window.setTimeout(function() {
			// TODO: Check if script has not been loaded
		}, 10*1000);
	},
	
	defineClass: function(value) {
		if(!JDS._initialized) {
			JDS._initialized = true;
			window.onload = function() {
				JDS._hadonload = true;
				if(window.numUsingsLoading === 0) {
					setTimeout(function() {
						JDS.onusingsloaded();
					}, 0);	
				}
			}
		} 
		if(!window.usingsLoading) {
            window.usingsLoading = {};
            window.numUsingsLoading = 1;
        }
		var name = value.name.replace(/\$/g, '.');
		if(name != null && window.usingsLoading[name]) {
			window.usingsLoading[name] = false;
			window.numUsingsLoading--;
		}
		
		// configure namespace
		var path = name.split('.');
		var cur = window;
		for(var i=0;i < path.length-1;i++) {
			var part = path[i];
			cur[part] = cur[part] || {};
			cur = cur[part];
		}
		
		cur[path[path.length-1]] = value;
		                                             
		if(window.numUsingsLoading === 0) {
			if(JDS._hadonload) {
				setTimeout(function() {
				JDS.onusingsloaded();   

			 	//var evt = document.createEvent("Event");
				//evt.initEvent('usingsloaded', false, false);                               
				//window.dispatchEvent(evt);
				}, 0);
			}	
		}
		return value;
	},
	
	onusingsloaded: function() {
		
	}
};

Function.prototype.bind = function(scope) {
	var _function = this;
	return function() {
          return _function.apply(scope, arguments);
    };
};

/* Copyright (c) 2010 Hallvar Helleseth (hallvar@gmail.com) All Rights Reserved
 * Released under the MIT licence (www.opensource.org/licenses/mit-license.php)
 */

/**
 * Joddes is an overly simple JavaScript framework
 */
var JDS = {
	version: '0.1',
	
	/**
	 * Base URL from where all Joddes using JavaScript files are located
	 */  
	baseUrl: 'js',
	
	/**
	 * Base URL from where all Joddes using JavaScript files are located
	 * when running in EnvJS
	 */
	envJsBaseUrl: '',
	
	/**
	 * How many milliseconds to wait for usings to be loaded before
	 * logging a warning to the console
	 */
	loadingTimeout: 30*1000,
	
	/**
	 * Load a specified set of javascript files/classes
	 * Ex: JDS.using("MyNamespace.MyClass", "MyNamespace2.MyClass2");
	 * will load js/MyNamespace/MyClass.js and js/MyNamespace2/MyClass2.js
	 * Once all usings have been loaded JDS.onusingsloaded will be called.
	 * JDS.onusingsloaded may be overriden
	 *
	 * @param {param String} ... one or more names of classes to load
	 * @returns {void}
	 */
	using: function () {
		for(var i=0, l=arguments.length;i < l;i++) {
			var name = arguments[i];
			if(typeof JDS._usingsLoading[name] == 'undefined') {
				JDS._usingsLoading[name] = true;
				JDS._numUsingsLoading++;
				var script = document.createElement('script');
				var src = JDS.baseUrl+'/'+name.replace(/\./g, '/')+'.js';
					
				if(typeof Envjs != 'undefined') {
				   src = JDS.envJsBaseUrl+'/'+src;
			       load(src);
				} else {
					script.src = src;
					var done = false;
					
					(function(script, name, done) {
					script.onload = script.onreadystatechange = function (e) {
			            if(eval('typeof('+name+');') == 'undefined') {
			            		throw new Error('Failed to load '+name);
			            }
			            
			            if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') ) {
			                done = true;
			                script.onload = script.onreadystatechange = null;
			                document.body.removeChild(script);
			            }
			        };
			        })(script, name, done);
					
					document.body.appendChild(script);
				}
			}
		}
	
		if(typeof(JDS._loadingCheckTimer) != 'undefined') {
			window.clearTimeout(JDS._loadingCheckTimer);
		}
	
		JDS._loadingCheckTimer = window.setTimeout(function() {
			delete JDS._loadingCheckTimer;
			if(JDS._numUsingsLoading > 0) {
				var msg = 'Not all JDS.usings have been loaded yet. This could mean they have errors or does not exist.';
				for(var k in JDS._usingsLoading) {
					if(JDS._usingsLoading[k] === true) {
					    msg += 'Still waiting for: '+k;
					}
				}
				throw new Error(msg);
			}
		}, JDS.loadingTimeout);
	},
	
	/**
	 * Call to notify that a "using" has finished loading
	 * @param {String} name Full name of the class to notify as loaded
	 * @returns {void} 
	 */
	setUsingsLoaded: function(name)
	{
		if(!JDS._usingsLoading) {
            JDS._usingsLoading = {};
            JDS._numUsingsLoading = 0;
        }
        
        if(JDS._usingsLoading[name]) {
			JDS._usingsLoading[name] = false;
			JDS._numUsingsLoading--;
		} else {
			JDS._usingsLoading[name] = false;
		}
		
		if(JDS._numUsingsLoading === 0) {
			if(JDS._hadonload) {
				setTimeout(function() {
					JDS.onusingsloaded();
				}, 0);
			}	
		}
	},
	
	/**
	 * Ex: var constructor = JDS.defineClass(function MyNamespace$MyClass() {});
	 *
	 * @param {Function} value constructor of the class. Must be a named
	 *  				       function where the name is the full name
	 *                         of the class, e.g MyNamespace.MyClass
	 * @returns {Function} input value is returned unmodified
	 */
	defineClass: function(value) {
		if(!JDS._initialized) {
			JDS._initialized = true;
			window.onload = function() {
				JDS._hadonload = true;
				if(JDS._numUsingsLoading === 0) {
					setTimeout(function() {
						JDS.onusingsloaded();
					}, 0);	
				}
			}
		} 
		
		var name = value.name.replace(/\$/g, '.');
		                          
		// configure namespace
		var path = name.split('.');
		var cur = window;
		for(var i=0;i < path.length-1;i++) {
			var part = path[i];
			cur[part] = cur[part] || {};
			cur = cur[part];
		}
		                          
		cur[path[path.length-1]] = value;
		                          
		JDS.setUsingsLoaded(name);
		
		return value;
	},
	
	/**
	 * Override this method, it will be called once all
	 * outstanding "usings" have been loaded
	 *
	 * @returns {void}
	 */
	onusingsloaded: function() {
		var evt = document.createEvent('Event');
		evt.initEvent('usingsloaded', false, false);                               
		window.dispatchEvent(evt);	
	},
	                     
	// priv
	_usingsLoading: {},
	_numUsingsLoading: 0,
};

/* Below this point you will find extensions to native objects */
      
if ( typeof Object.getPrototypeOf !== 'function' ) {
  // http://ejohn.org/blog/objectgetprototypeof/
  if ( typeof 'test'.__proto__ === 'object' ) {
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

/**
 * Enables a "class" to inherit from another class
 * Ex:
 * JDS.defineClass(function MyNamespace$MyClass() { 
 *     this.inherit(MyNamespace.MyClass, MyNamespace2.MyClass);
 * };
 *
 * MyNamespace.MyClass will then inherit methods from MyNamespace2.MyClass
 *
 * @param {clas} constructor function of class to inherit to.
 * @param {inherit} constructor function of class to inherit from
 * @returns {void}
 */
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

Object.prototype.GetType = function() {
	return new System.Type(this.constructor);
}

/** 
 * Bind a function or method to a specific scope:
 * Ex: myFunc.bind(obj)();
 * inside myFunc, "obj" is assigned to "this"
 */
Function.prototype.bind = function(scope) {
	var _function = this;
	return function() {
          return _function.apply(scope, arguments);
    };
};
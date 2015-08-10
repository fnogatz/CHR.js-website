(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CHR=f()}})(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){function EventEmitter(){this._events=this._events||{};this._maxListeners=this._maxListeners||undefined}module.exports=EventEmitter;EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._maxListeners=undefined;EventEmitter.defaultMaxListeners=10;EventEmitter.prototype.setMaxListeners=function(n){if(!isNumber(n)||n<0||isNaN(n))throw TypeError("n must be a positive number");this._maxListeners=n;return this};EventEmitter.prototype.emit=function(type){var er,handler,len,args,i,listeners;if(!this._events)this._events={};if(type==="error"){if(!this._events.error||isObject(this._events.error)&&!this._events.error.length){er=arguments[1];if(er instanceof Error){throw er}throw TypeError('Uncaught, unspecified "error" event.')}}handler=this._events[type];if(isUndefined(handler))return false;if(isFunction(handler)){switch(arguments.length){case 1:handler.call(this);break;case 2:handler.call(this,arguments[1]);break;case 3:handler.call(this,arguments[1],arguments[2]);break;default:len=arguments.length;args=new Array(len-1);for(i=1;i<len;i++)args[i-1]=arguments[i];handler.apply(this,args)}}else if(isObject(handler)){len=arguments.length;args=new Array(len-1);for(i=1;i<len;i++)args[i-1]=arguments[i];listeners=handler.slice();len=listeners.length;for(i=0;i<len;i++)listeners[i].apply(this,args)}return true};EventEmitter.prototype.addListener=function(type,listener){var m;if(!isFunction(listener))throw TypeError("listener must be a function");if(!this._events)this._events={};if(this._events.newListener)this.emit("newListener",type,isFunction(listener.listener)?listener.listener:listener);if(!this._events[type])this._events[type]=listener;else if(isObject(this._events[type]))this._events[type].push(listener);else this._events[type]=[this._events[type],listener];if(isObject(this._events[type])&&!this._events[type].warned){var m;if(!isUndefined(this._maxListeners)){m=this._maxListeners}else{m=EventEmitter.defaultMaxListeners}if(m&&m>0&&this._events[type].length>m){this._events[type].warned=true;console.error("(node) warning: possible EventEmitter memory "+"leak detected. %d listeners added. "+"Use emitter.setMaxListeners() to increase limit.",this._events[type].length);if(typeof console.trace==="function"){console.trace()}}}return this};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.once=function(type,listener){if(!isFunction(listener))throw TypeError("listener must be a function");var fired=false;function g(){this.removeListener(type,g);if(!fired){fired=true;listener.apply(this,arguments)}}g.listener=listener;this.on(type,g);return this};EventEmitter.prototype.removeListener=function(type,listener){var list,position,length,i;if(!isFunction(listener))throw TypeError("listener must be a function");if(!this._events||!this._events[type])return this;list=this._events[type];length=list.length;position=-1;if(list===listener||isFunction(list.listener)&&list.listener===listener){delete this._events[type];if(this._events.removeListener)this.emit("removeListener",type,listener)}else if(isObject(list)){for(i=length;i-->0;){if(list[i]===listener||list[i].listener&&list[i].listener===listener){position=i;break}}if(position<0)return this;if(list.length===1){list.length=0;delete this._events[type]}else{list.splice(position,1)}if(this._events.removeListener)this.emit("removeListener",type,listener)}return this};EventEmitter.prototype.removeAllListeners=function(type){var key,listeners;if(!this._events)return this;if(!this._events.removeListener){if(arguments.length===0)this._events={};else if(this._events[type])delete this._events[type];return this}if(arguments.length===0){for(key in this._events){if(key==="removeListener")continue;this.removeAllListeners(key)}this.removeAllListeners("removeListener");this._events={};return this}listeners=this._events[type];if(isFunction(listeners)){this.removeListener(type,listeners)}else{while(listeners.length)this.removeListener(type,listeners[listeners.length-1])}delete this._events[type];return this};EventEmitter.prototype.listeners=function(type){var ret;if(!this._events||!this._events[type])ret=[];else if(isFunction(this._events[type]))ret=[this._events[type]];else ret=this._events[type].slice();return ret};EventEmitter.listenerCount=function(emitter,type){var ret;if(!emitter._events||!emitter._events[type])ret=0;else if(isFunction(emitter._events[type]))ret=1;else ret=emitter._events[type].length;return ret};function isFunction(arg){return typeof arg==="function"}function isNumber(arg){return typeof arg==="number"}function isObject(arg){return typeof arg==="object"&&arg!==null}function isUndefined(arg){return arg===void 0}},{}],2:[function(require,module,exports){if(typeof Object.create==="function"){module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor;ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}}else{module.exports=function inherits(ctor,superCtor){ctor.super_=superCtor;var TempCtor=function(){};TempCtor.prototype=superCtor.prototype;ctor.prototype=new TempCtor;ctor.prototype.constructor=ctor}}},{}],3:[function(require,module,exports){var process=module.exports={};var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){draining=false;if(currentQueue.length){queue=currentQueue.concat(queue)}else{queueIndex=-1}if(queue.length){drainQueue()}}function drainQueue(){if(draining){return}var timeout=setTimeout(cleanUpNextTick);draining=true;var len=queue.length;while(len){currentQueue=queue;queue=[];while(++queueIndex<len){currentQueue[queueIndex].run()}queueIndex=-1;len=queue.length}currentQueue=null;draining=false;clearTimeout(timeout)}process.nextTick=function(fun){var args=new Array(arguments.length-1);if(arguments.length>1){for(var i=1;i<arguments.length;i++){args[i-1]=arguments[i]}}queue.push(new Item(fun,args));if(queue.length===1&&!draining){setTimeout(drainQueue,0)}};function Item(fun,array){this.fun=fun;this.array=array}Item.prototype.run=function(){this.fun.apply(null,this.array)};process.title="browser";process.browser=true;process.env={};process.argv=[];process.version="";process.versions={};function noop(){}process.on=noop;process.addListener=noop;process.once=noop;process.off=noop;process.removeListener=noop;process.removeAllListeners=noop;process.emit=noop;process.binding=function(name){throw new Error("process.binding is not supported")};process.cwd=function(){return"/"};process.chdir=function(dir){throw new Error("process.chdir is not supported")};process.umask=function(){return 0}},{}],4:[function(require,module,exports){module.exports=function isBuffer(arg){return arg&&typeof arg==="object"&&typeof arg.copy==="function"&&typeof arg.fill==="function"&&typeof arg.readUInt8==="function"}},{}],5:[function(require,module,exports){(function(process,global){var formatRegExp=/%[sdj%]/g;exports.format=function(f){if(!isString(f)){var objects=[];for(var i=0;i<arguments.length;i++){objects.push(inspect(arguments[i]))}return objects.join(" ")}var i=1;var args=arguments;var len=args.length;var str=String(f).replace(formatRegExp,function(x){if(x==="%%")return"%";if(i>=len)return x;switch(x){case"%s":return String(args[i++]);case"%d":return Number(args[i++]);case"%j":try{return JSON.stringify(args[i++])}catch(_){return"[Circular]"}default:return x}});for(var x=args[i];i<len;x=args[++i]){if(isNull(x)||!isObject(x)){str+=" "+x}else{str+=" "+inspect(x)}}return str};exports.deprecate=function(fn,msg){if(isUndefined(global.process)){return function(){return exports.deprecate(fn,msg).apply(this,arguments)}}if(process.noDeprecation===true){return fn}var warned=false;function deprecated(){if(!warned){if(process.throwDeprecation){throw new Error(msg)}else if(process.traceDeprecation){console.trace(msg)}else{console.error(msg)}warned=true}return fn.apply(this,arguments)}return deprecated};var debugs={};var debugEnviron;exports.debuglog=function(set){if(isUndefined(debugEnviron))debugEnviron=process.env.NODE_DEBUG||"";set=set.toUpperCase();if(!debugs[set]){if(new RegExp("\\b"+set+"\\b","i").test(debugEnviron)){var pid=process.pid;debugs[set]=function(){var msg=exports.format.apply(exports,arguments);console.error("%s %d: %s",set,pid,msg)}}else{debugs[set]=function(){}}}return debugs[set]};function inspect(obj,opts){var ctx={seen:[],stylize:stylizeNoColor};if(arguments.length>=3)ctx.depth=arguments[2];if(arguments.length>=4)ctx.colors=arguments[3];if(isBoolean(opts)){ctx.showHidden=opts}else if(opts){exports._extend(ctx,opts)}if(isUndefined(ctx.showHidden))ctx.showHidden=false;if(isUndefined(ctx.depth))ctx.depth=2;if(isUndefined(ctx.colors))ctx.colors=false;if(isUndefined(ctx.customInspect))ctx.customInspect=true;if(ctx.colors)ctx.stylize=stylizeWithColor;return formatValue(ctx,obj,ctx.depth)}exports.inspect=inspect;inspect.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]};inspect.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"};function stylizeWithColor(str,styleType){var style=inspect.styles[styleType];if(style){return"["+inspect.colors[style][0]+"m"+str+"["+inspect.colors[style][1]+"m"}else{return str}}function stylizeNoColor(str,styleType){return str}function arrayToHash(array){var hash={};array.forEach(function(val,idx){hash[val]=true});return hash}function formatValue(ctx,value,recurseTimes){if(ctx.customInspect&&value&&isFunction(value.inspect)&&value.inspect!==exports.inspect&&!(value.constructor&&value.constructor.prototype===value)){var ret=value.inspect(recurseTimes,ctx);if(!isString(ret)){ret=formatValue(ctx,ret,recurseTimes)}return ret}var primitive=formatPrimitive(ctx,value);if(primitive){return primitive}var keys=Object.keys(value);var visibleKeys=arrayToHash(keys);if(ctx.showHidden){keys=Object.getOwnPropertyNames(value)}if(isError(value)&&(keys.indexOf("message")>=0||keys.indexOf("description")>=0)){return formatError(value)}if(keys.length===0){if(isFunction(value)){var name=value.name?": "+value.name:"";return ctx.stylize("[Function"+name+"]","special")}if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),"regexp")}if(isDate(value)){return ctx.stylize(Date.prototype.toString.call(value),"date")}if(isError(value)){return formatError(value)}}var base="",array=false,braces=["{","}"];if(isArray(value)){array=true;braces=["[","]"]}if(isFunction(value)){var n=value.name?": "+value.name:"";base=" [Function"+n+"]"}if(isRegExp(value)){base=" "+RegExp.prototype.toString.call(value)}if(isDate(value)){base=" "+Date.prototype.toUTCString.call(value)}if(isError(value)){base=" "+formatError(value)}if(keys.length===0&&(!array||value.length==0)){return braces[0]+base+braces[1]}if(recurseTimes<0){if(isRegExp(value)){return ctx.stylize(RegExp.prototype.toString.call(value),"regexp")}else{return ctx.stylize("[Object]","special")}}ctx.seen.push(value);var output;if(array){output=formatArray(ctx,value,recurseTimes,visibleKeys,keys)}else{output=keys.map(function(key){return formatProperty(ctx,value,recurseTimes,visibleKeys,key,array)})}ctx.seen.pop();return reduceToSingleString(output,base,braces)}function formatPrimitive(ctx,value){if(isUndefined(value))return ctx.stylize("undefined","undefined");if(isString(value)){var simple="'"+JSON.stringify(value).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return ctx.stylize(simple,"string")}if(isNumber(value))return ctx.stylize(""+value,"number");if(isBoolean(value))return ctx.stylize(""+value,"boolean");if(isNull(value))return ctx.stylize("null","null")}function formatError(value){return"["+Error.prototype.toString.call(value)+"]"}function formatArray(ctx,value,recurseTimes,visibleKeys,keys){var output=[];for(var i=0,l=value.length;i<l;++i){if(hasOwnProperty(value,String(i))){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,String(i),true))}else{output.push("")}}keys.forEach(function(key){if(!key.match(/^\d+$/)){output.push(formatProperty(ctx,value,recurseTimes,visibleKeys,key,true))}});return output}function formatProperty(ctx,value,recurseTimes,visibleKeys,key,array){var name,str,desc;desc=Object.getOwnPropertyDescriptor(value,key)||{value:value[key]};if(desc.get){if(desc.set){str=ctx.stylize("[Getter/Setter]","special")}else{str=ctx.stylize("[Getter]","special")}}else{if(desc.set){str=ctx.stylize("[Setter]","special")}}if(!hasOwnProperty(visibleKeys,key)){name="["+key+"]"}if(!str){if(ctx.seen.indexOf(desc.value)<0){if(isNull(recurseTimes)){str=formatValue(ctx,desc.value,null)}else{str=formatValue(ctx,desc.value,recurseTimes-1)}if(str.indexOf("\n")>-1){if(array){str=str.split("\n").map(function(line){return"  "+line}).join("\n").substr(2)}else{str="\n"+str.split("\n").map(function(line){return"   "+line}).join("\n")}}}else{str=ctx.stylize("[Circular]","special")}}if(isUndefined(name)){if(array&&key.match(/^\d+$/)){return str}name=JSON.stringify(""+key);if(name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)){name=name.substr(1,name.length-2);name=ctx.stylize(name,"name")}else{name=name.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'");name=ctx.stylize(name,"string")}}return name+": "+str}function reduceToSingleString(output,base,braces){var numLinesEst=0;var length=output.reduce(function(prev,cur){numLinesEst++;if(cur.indexOf("\n")>=0)numLinesEst++;return prev+cur.replace(/\u001b\[\d\d?m/g,"").length+1},0);if(length>60){return braces[0]+(base===""?"":base+"\n ")+" "+output.join(",\n  ")+" "+braces[1]}return braces[0]+base+" "+output.join(", ")+" "+braces[1]}function isArray(ar){return Array.isArray(ar)}exports.isArray=isArray;function isBoolean(arg){return typeof arg==="boolean"}exports.isBoolean=isBoolean;function isNull(arg){return arg===null}exports.isNull=isNull;function isNullOrUndefined(arg){return arg==null}exports.isNullOrUndefined=isNullOrUndefined;function isNumber(arg){return typeof arg==="number"}exports.isNumber=isNumber;function isString(arg){return typeof arg==="string"}exports.isString=isString;function isSymbol(arg){return typeof arg==="symbol"}exports.isSymbol=isSymbol;function isUndefined(arg){return arg===void 0}exports.isUndefined=isUndefined;function isRegExp(re){return isObject(re)&&objectToString(re)==="[object RegExp]"}exports.isRegExp=isRegExp;function isObject(arg){return typeof arg==="object"&&arg!==null}exports.isObject=isObject;function isDate(d){return isObject(d)&&objectToString(d)==="[object Date]"}exports.isDate=isDate;function isError(e){return isObject(e)&&(objectToString(e)==="[object Error]"||e instanceof Error)}exports.isError=isError;function isFunction(arg){return typeof arg==="function"}exports.isFunction=isFunction;function isPrimitive(arg){return arg===null||typeof arg==="boolean"||typeof arg==="number"||typeof arg==="string"||typeof arg==="symbol"||typeof arg==="undefined"}exports.isPrimitive=isPrimitive;exports.isBuffer=require("./support/isBuffer");function objectToString(o){return Object.prototype.toString.call(o)}function pad(n){return n<10?"0"+n.toString(10):n.toString(10)}var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function timestamp(){var d=new Date;var time=[pad(d.getHours()),pad(d.getMinutes()),pad(d.getSeconds())].join(":");return[d.getDate(),months[d.getMonth()],time].join(" ")}exports.log=function(){console.log("%s - %s",timestamp(),exports.format.apply(exports,arguments))};exports.inherits=require("inherits");exports._extend=function(origin,add){if(!add||!isObject(add))return origin;var keys=Object.keys(add);var i=keys.length;while(i--){origin[keys[i]]=add[keys[i]]}return origin};function hasOwnProperty(obj,prop){return Object.prototype.hasOwnProperty.call(obj,prop)}}).call(this,require("_process"),typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./support/isBuffer":4,_process:3,inherits:2}],6:[function(require,module,exports){module.exports=Table;function Table(){this.rows=[];this.row={__printers:{}}}Table.prototype.newRow=function(){this.rows.push(this.row);this.row={__printers:{}};return this};Table.prototype.cell=function(col,val,printer){this.row[col]=val;this.row.__printers[col]=printer||string;return this};Table.prototype.separator="  ";function string(val){return val===undefined?"":""+val}function length(str){return str.replace(/\u001b\[\d+m/g,"").length}Table.string=string;Table.leftPadder=leftPadder;function leftPadder(ch){return function(val,width){var str=string(val);var len=length(str);var pad=width>len?Array(width-len+1).join(ch):"";return pad+str}}var padLeft=Table.padLeft=leftPadder(" ");Table.rightPadder=rightPadder;function rightPadder(ch){return function padRight(val,width){var str=string(val);var len=length(str);var pad=width>len?Array(width-len+1).join(ch):"";return str+pad}}var padRight=rightPadder(" ");Table.number=function(digits){return function(val,width){if(val==null)return"";if(typeof val!="number")throw new Error(""+val+" is not a number");var str=digits==null?val+"":val.toFixed(digits);return padLeft(str,width)}};function each(row,fn){for(var key in row){if(key=="__printers")continue;fn(key,row[key])}}Table.prototype.columns=function(){var cols={};for(var i=0;i<2;i++){this.rows.forEach(function(row){var idx=0;each(row,function(key){idx=Math.max(idx,cols[key]||0);cols[key]=idx;idx++})})}return Object.keys(cols).sort(function(a,b){return cols[a]-cols[b]})};Table.prototype.print=function(){var cols=this.columns();var separator=this.separator;var widths={};var out="";this.rows.forEach(function(row){each(row,function(key,val){var str=row.__printers[key].call(row,val);widths[key]=Math.max(length(str),widths[key]||0)})});this.rows.forEach(function(row){var line="";cols.forEach(function(key){var width=widths[key];var str=row.hasOwnProperty(key)?""+row.__printers[key].call(row,row[key],width):"";line+=padRight(str,width)+separator});line=line.slice(0,-separator.length);out+=line+"\n"});return out};Table.prototype.toString=function(){var cols=this.columns();var out=new Table;out.separator=this.separator;cols.forEach(function(col){out.cell(col,col)});out.newRow();out.pushDelimeter(cols);out.rows=out.rows.concat(this.rows);if(this.totals&&this.rows.length){out.pushDelimeter(cols);this.forEachTotal(out.cell.bind(out));out.newRow()}return out.print()};Table.prototype.pushDelimeter=function(cols){cols=cols||this.columns();cols.forEach(function(col){this.cell(col,undefined,leftPadder("-"))},this);return this.newRow()};Table.prototype.forEachTotal=function(cb){for(var key in this.totals){var aggr=this.totals[key];var acc=aggr.init;var len=this.rows.length;this.rows.forEach(function(row,idx){acc=aggr.reduce.call(row,acc,row[key],idx,len)});cb(key,acc,aggr.printer)}};Table.prototype.printTransposed=function(opts){opts=opts||{};var out=new Table;out.separator=opts.separator||this.separator;this.columns().forEach(function(col){out.cell(0,col,opts.namePrinter);this.rows.forEach(function(row,idx){out.cell(idx+1,row[col],row.__printers[col])});out.newRow()},this);return out.print()};Table.prototype.sort=function(cmp){if(typeof cmp=="function"){this.rows.sort(cmp);return this}var keys=Array.isArray(cmp)?cmp:this.columns();var comparators=keys.map(function(key){var order="asc";var m=/(.*)\|\s*(asc|des)\s*$/.exec(key);if(m){key=m[1];order=m[2]}return function(a,b){return order=="asc"?compare(a[key],b[key]):compare(b[key],a[key])}});return this.sort(function(a,b){for(var i=0;i<comparators.length;i++){var order=comparators[i](a,b);if(order!=0)return order}return 0})};function compare(a,b){if(a===b)return 0;if(a===undefined)return 1;if(b===undefined)return-1;if(a===null)return 1;if(b===null)return-1;if(a>b)return 1;if(a<b)return-1;return compare(String(a),String(b))}Table.prototype.total=function(col,opts){opts=opts||{};this.totals=this.totals||{};this.totals[col]={reduce:opts.reduce||Table.aggr.sum,printer:opts.printer||padLeft,init:opts.init==null?0:opts.init};return this};Table.aggr={};Table.aggr.printer=function(prefix,printer){printer=printer||string;return function(val,width){return padLeft(prefix+printer(val),width)}};Table.aggr.sum=function(acc,val){return acc+val};Table.aggr.avg=function(acc,val,idx,len){acc=acc+val;return idx+1==len?acc/len:acc};Table.print=function(obj,format,cb){var opts=format||{};format=typeof format=="function"?format:function(obj,cell){for(var key in obj){if(!obj.hasOwnProperty(key))continue;var params=opts[key]||{};cell(params.name||key,obj[key],params.printer)}};var t=new Table;var cell=t.cell.bind(t);if(Array.isArray(obj)){cb=cb||function(t){return t.toString()};obj.forEach(function(item){format(item,cell);t.newRow()})}else{cb=cb||function(t){return t.printTransposed({separator:" : "})};format(obj,cell);t.newRow()}return cb(t)};Table.log=function(obj,format,cb){console.log(Table.print(obj,format,cb))};Table.prototype.log=function(){console.log(this.toString())}},{}],7:[function(require,module,exports){(function(global){var rng;if(global.crypto&&crypto.getRandomValues){var _rnds8=new Uint8Array(16);rng=function whatwgRNG(){crypto.getRandomValues(_rnds8);return _rnds8}}if(!rng){var _rnds=new Array(16);rng=function(){for(var i=0,r;i<16;i++){if((i&3)===0)r=Math.random()*4294967296;_rnds[i]=r>>>((i&3)<<3)&255}return _rnds}}module.exports=rng}).call(this,typeof global!=="undefined"?global:typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],8:[function(require,module,exports){var _rng=require("./rng");var _byteToHex=[];var _hexToByte={};for(var i=0;i<256;i++){_byteToHex[i]=(i+256).toString(16).substr(1);_hexToByte[_byteToHex[i]]=i}function parse(s,buf,offset){var i=buf&&offset||0,ii=0;buf=buf||[];s.toLowerCase().replace(/[0-9a-f]{2}/g,function(oct){if(ii<16){buf[i+ii++]=_hexToByte[oct]}});while(ii<16){buf[i+ii++]=0}return buf}function unparse(buf,offset){var i=offset||0,bth=_byteToHex;return bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]+"-"+bth[buf[i++]]+bth[buf[i++]]+"-"+bth[buf[i++]]+bth[buf[i++]]+"-"+bth[buf[i++]]+bth[buf[i++]]+"-"+bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]+bth[buf[i++]]}var _seedBytes=_rng();var _nodeId=[_seedBytes[0]|1,_seedBytes[1],_seedBytes[2],_seedBytes[3],_seedBytes[4],_seedBytes[5]];var _clockseq=(_seedBytes[6]<<8|_seedBytes[7])&16383;var _lastMSecs=0,_lastNSecs=0;function v1(options,buf,offset){var i=buf&&offset||0;var b=buf||[];options=options||{};var clockseq=options.clockseq!==undefined?options.clockseq:_clockseq;var msecs=options.msecs!==undefined?options.msecs:(new Date).getTime();var nsecs=options.nsecs!==undefined?options.nsecs:_lastNSecs+1;var dt=msecs-_lastMSecs+(nsecs-_lastNSecs)/1e4;if(dt<0&&options.clockseq===undefined){clockseq=clockseq+1&16383}if((dt<0||msecs>_lastMSecs)&&options.nsecs===undefined){nsecs=0}if(nsecs>=1e4){throw new Error("uuid.v1(): Can't create more than 10M uuids/sec")}_lastMSecs=msecs;_lastNSecs=nsecs;_clockseq=clockseq;msecs+=122192928e5;var tl=((msecs&268435455)*1e4+nsecs)%4294967296;b[i++]=tl>>>24&255;b[i++]=tl>>>16&255;b[i++]=tl>>>8&255;b[i++]=tl&255;var tmh=msecs/4294967296*1e4&268435455;b[i++]=tmh>>>8&255;b[i++]=tmh&255;b[i++]=tmh>>>24&15|16;b[i++]=tmh>>>16&255;b[i++]=clockseq>>>8|128;b[i++]=clockseq&255;var node=options.node||_nodeId;for(var n=0;n<6;n++){b[i+n]=node[n]}return buf?buf:unparse(b)}function v4(options,buf,offset){var i=buf&&offset||0;if(typeof options=="string"){buf=options=="binary"?new Array(16):null;options=null}options=options||{};var rnds=options.random||(options.rng||_rng)();rnds[6]=rnds[6]&15|64;rnds[8]=rnds[8]&63|128;if(buf){for(var ii=0;ii<16;ii++){buf[i+ii]=rnds[ii]}}return buf||unparse(rnds)}var uuid=v4;uuid.v1=v1;uuid.v4=v4;uuid.parse=parse;uuid.unparse=unparse;module.exports=uuid},{"./rng":7}],9:[function(require,module,exports){function allDifferent(r){return r.every(function(e,t){return r.slice(t+1).every(function(r){return e!=r})})}var History=require("./src/history"),Store=require("./src/store"),Constraint=require("./src/constraint"),dynamicCaller=require("./src/dynamic-caller");module.exports={History:History,Store:Store,Constraint:Constraint,Helper:{allDifferent:allDifferent,dynamicCaller:dynamicCaller}}},{"./src/constraint":13,"./src/dynamic-caller":14,"./src/history":15,"./src/store":20}],10:[function(require,module,exports){function fakeScope(scope,expr,isGuard){with(scope)var func=eval("("+expr+")");var params=util.getFunctionParameters(func||function(){}),parts=[indent(0)+(isGuard?"":";")+"(function () {",indent(1)+"with (self.Scope) {",indent(2)+(isGuard?"return ":";")+"("+expr+").apply(self, ["+params+"])",indent(1)+"}",indent(0)+"}())"];return isGuard?parts.map(function(e){return e.trim()}).join(""):parts}module.exports=fakeScope;var util=require("./util"),indent=util.indent},{"./util":12}],11:[function(require,module,exports){function Compiler(e,n){n=n||{},this.rule=e,this.replacements=n.replacements||{},this.scope=n.scope||{},this.opts={"this":n["this"]||"this",helper:n.helper||"self.Helper"}}function escape(e){return"string"==typeof e?'"'+e+'"':e}module.exports=Compiler;var util=require("./util"),fakeScope=require("./fake-scope"),indent=util.indent,indentBy=util.indentBy,destructuring=util.destructuring;Compiler.prototype.headNo=function(e){var n=this;e=e||0;var t=this.rule,r=this.opts;if(!t.head[e])throw new Error("No constraint with number "+e+" in this rule head");var i=t.head[e];if("Constraint"!==i.type)throw new Error("No constraint at number "+e);var a=[];a.push("var self = "+r["this"],""),i.arity>0&&a.push(indent(0,destructuring(i,"constraint.args")).join("\n"),indent(0));var s,o=0,p=[];for(s=0;s<t.head.length;s++)s!==e?(p.push("id"+(s+1)),a.push(indent(o)+'self.Store.lookup("'+t.head[s].name+'", '+t.head[s].arity+").forEach(function (id"+(s+1)+") {"),o++,a.push(indent(o,"if (!self.Store.alive(id"+(s+1)+")) {"),indent(o+1)+"return",indent(o,"}")),t.head[s].arity>0&&a.push(indent(o,destructuring(t.head[s],"self.Store.args(id"+(s+1)+")")).join("\n")),a.push(indent(o))):p.push("constraint.id");var u=[];t.guard.forEach(function(e){if("Replacement"!==e.type)return void u.push(e);if(e.hasOwnProperty("num")){var t=util.getFunctionParameters(n.replacements[e.num]);return void a.push(indent(o+0)+'if (!replacements["'+e.num+'"].apply(self, ['+t+"])) {",indent(o+1)+"return",indent(o+0)+"}")}return e.hasOwnProperty("expr")?void a.push(indent(o+0)+"if (!"+fakeScope(n.scope,e.expr.original,!0)+") {",indent(o+1)+"return",indent(o+0)+"}"):void 0}),u!==t.guard.length&&a.push(indent(o)),a.push(indent(o+0)+"var ids = [ "+p.join(", ")+" ]",indent(o+0)+"if (ids.every(function(id) { return self.Store.alive(id) })) {",indent(o+1)+"if ("+r.helper+".allDifferent(ids)) {"),o+=2,u.length>0&&(a.push(indent(o)+this.generateGuards()),o+=1),a.push(indent(o+0)+'if (self.History.notIn("'+t.name+'", ids)) {',indent(o+1)+'self.History.add("'+t.name+'", ids)'),o+=1;for(var d=t.r+1;d<=t.head.length;d++)a.push(indent(o)+"self.Store.kill(ids["+(d-1)+"])");for(t.body.length>0&&t.body.forEach(function(e){var t=n.generateTell(e).map(indentBy(o));a=a.concat(t)}),o-=1,a.push(indent(o)+"}"),u.length>0&&(o-=1,a.push(indent(o)+"}")),o-=2,a.push(indent(o+1)+"}",indent(o+0)+"}"),s=t.head.length-1;s>=0;s--)s!==e&&(o--,a.push(indent(o)+"})"));return a=a.map(indentBy(1))},Compiler.prototype.generateGuards=function(){var e=this,n=this.rule,t="if (",r=[];return n.guard.forEach(function(n){"Replacement"!==n.type&&r.push(e.generateGuard(n))}),t+=r.join(" && "),t+=") {"},Compiler.prototype.generateGuard=function(e){return"BinaryExpression"===e.type?this.generateBinaryExpression(e):"false"},Compiler.prototype.generateTell=function(e){var n=this,t="";if("Constraint"===e.type)return t+="self."+e.name+"(",t+=e.parameters.map(function(e){return n.generateExpression(e)}).join(", "),t+=")",[t];if("Replacement"!==e.type)return t+=["if (!("+n.generateBinaryExpression(e)+")) {",indent(1)+"self.Store.invalidate()",indent(1)+"return","}"].join("\n"),[t];if(e.hasOwnProperty("original"))return[";(function() { "+e.original+" })()"];if(e.hasOwnProperty("num")){var r=util.getFunctionParameters(n.replacements[e.num]);return['replacements["'+e.num+'"].apply(self, ['+r+"])"]}return e.hasOwnProperty("expr")?fakeScope(n.scope,e.expr.original):void 0},Compiler.prototype.generateBinaryExpression=function(e){var n=this;return["left","right"].map(function(t){return"Identifier"===e[t].type?e[t].name:"Literal"===e[t].type?e[t].value:"BinaryExpression"===e[t].type?"("+n.generateBinaryExpression(e[t])+")":void 0}).join(" "+e.operator+" ")},Compiler.prototype.generateExpression=function(e){return"Identifier"===e.type?e.name:"BinaryExpression"===e.type?this.generateBinaryExpression(e):"Literal"===e.type?escape(e.value):void 0}},{"./fake-scope":10,"./util":12}],12:[function(require,module,exports){function indent(n,t,e){return n=n||0,"number"==typeof t&&(e=t,t=null),e=e||2,t=t||null,t&&"string"==typeof t?t.split("\n").map(function(t){return indent(n,e)+t}).join("\n"):t&&t instanceof Array?t.map(indentBy(n,e)):Array(n*e+1).join(" ")}function indentBy(n,t){return function(e){return indent(n,t)+e}}function destructuring(n,t){var e=[];return n.parameters.forEach(function(n,r){return"Literal"===n.type?(e.push(indent(0)+"if ("+t+"["+r+"] !== "+escape(n.value)+") {"),e.push(indent(1)+"return"),void e.push(indent(0)+"}")):void e.push("var "+n.name+" = "+t+"["+r+"]")}),e}function getFunctionParameters(n){var t=n.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1];return t}module.exports={},module.exports.indent=indent,module.exports.indentBy=indentBy,module.exports.destructuring=destructuring,module.exports.getFunctionParameters=getFunctionParameters},{}],13:[function(require,module,exports){function Constraint(t,i,s){this.name=t,this.arity=i,this.functor=t+"/"+i,this.args=s,this.id=null,this.alive=!0,this.activated=!1,this.stored=!1,this.hist=null}function escape(t){return"string"==typeof t?'"'+t+'"':t}module.exports=Constraint,Constraint.prototype.toString=function(){var t=this.name;return this.arity>0&&(t+="(",t+=this.args.map(escape).join(","),t+=")"),t}},{}],14:[function(require,module,exports){function dynamicCaller(n){return function(){var r=Array.prototype.slice.call(arguments),t=arguments.length,e=n+"/"+t;if("undefined"==typeof this.Constraints[e])throw new Error("Constraint "+e+" not defined.");var i=new Constraint(n,t,r);this.Store.add(i);var a=this;this.Rules.ForEach(function(n){n[e]&&n.fire(a,i)})}}module.exports=dynamicCaller;var Constraint=require("./constraint")},{"./constraint":13}],15:[function(require,module,exports){function History(){this._history={}}function hash(t){return t.join("_")}module.exports=History,History.prototype.add=function(t,r){this._history.hasOwnProperty(t)||(this._history[t]=[]);var o=hash(r);this._history[t].push(o)},History.prototype.notIn=function(t,r){if(!this._history.hasOwnProperty(t))return!0;var o=hash(r),i=this._history[t].indexOf(o)>=0;return!i}},{}],16:[function(require,module,exports){(function(){function e(e){
function t(e){var o,s;if("object"==typeof e&&e.type&&"Program"===e.type)o=e,s=[],arguments[1]&&"object"==typeof arguments[1]&&arguments[1]instanceof Array&&(s=arguments[1]);else if("object"==typeof e&&e instanceof Array&&"string"==typeof e[0]){var u=[e[0]];Array.prototype.slice.call(arguments,1).forEach(function(r,t){u.push(r),u.push(e[t+1])}),e=i(u),s=Array.prototype.slice.call(arguments,1),o=n(e)}else"string"==typeof e&&arguments[1]&&arguments[1]instanceof Array?(o=n(e),s=arguments[1]):"string"==typeof e&&(s=Array.prototype.filter.call(arguments,r),e=i(Array.prototype.slice.call(arguments)),o=n(e));var a=o.body;a.forEach(function(e){t.Rules.Add(e,s)})}return e=e||{},e.store=e.store||new s.Store,e.history=e.history||new s.History,e.rules=e.rules||new u(t),e.scope=e.scope||{},t.Store=e.store,t.History=e.history,t.Rules=e.rules,t.Scope=e.scope,t.Constraints={},Object.defineProperty(t,"Functors",{get:function(){return Object.keys(t.Constraints)}}),t.Helper=s.Helper,t}function r(e){return"function"==typeof e}var t,o=this;o&&o.CHR&&(t=o.CHR);var n,s=require("../runtime"),u=require("./rules"),i=require("./join-parts");n=o.parseCHR,e.Constraint=s.Constraint,e.noConflict=function(){return o.CHR=t,e},"undefined"!=typeof exports?"undefined"!=typeof module&&module.exports?exports=module.exports=e:exports.CHR=e:o.CHR=e}).call(this)},{"../runtime":9,"./join-parts":17,"./rules":19}],17:[function(require,module,exports){function joinParts(t){var r=t[0].trim(),i=0;return t.forEach(function(t,n){if(0!==n){if("string"==typeof t){var e=t.trim();if(0===e.length)return;return isComma(e)?void(r+=","):isPipe(e)?void(r+=" |"):(startsWithSeparator(t)?startsWithPipe(t)&&" "!==r.slice(-1)[0]&&(r+=" "):needsComma(r)&&(r+=", "),void(r+=e))}return"function"==typeof t?(needsComma(r)&&(r+=","),r+=" ${"+i+"}",void i++):void 0}}),r}function needsComma(t){return!t.match(/[,|>]\s*$/)}function startsWithSeparator(t){return t.match(/^\s*[,|]/)}function startsWithPipe(t){return t.match(/^\s*\|/)}function isComma(t){return t.match(/^\s*,\s*$/)}function isPipe(t){return t.match(/^\s*\|\s*$/)}module.exports=joinParts},{}],18:[function(require,module,exports){function Rule(e,t){"undefined"==typeof e.name&&(e.name="_"+uuid()),t=t||{},t.globalReplacements=t.replacements||{},this.Scope=t.scope||{},this._source=e,this.Replacements={},this._setReplacements(t.globalReplacements),this.Name=e.name,this._compile(e)}module.exports=Rule;var uuid=require("uuid").v1,HeadCompiler=require("./compile/head");Rule.prototype._compile=function(e){for(var t,n,r,o=this,i=new HeadCompiler(e,{replacements:o.Replacements,scope:o.Scope}),a=e.head.length-1;a>=0;a--)t=e.head[a],r=i.headNo(a).join("\n"),this._addConstraintCaller(t.functor,r);for(var u=0;u<e.body.length;u++)n=e.body[u],"Constraint"===n.type&&(this[n.functor]||(this[n.functor]=[]))},Rule.prototype._addConstraintCaller=function(e,t){var n=new Function("constraint","replacements",t);this[e]||(this[e]=[]),this[e].push(n)},Rule.prototype._setReplacements=function(e){var t=this;["guard","body"].forEach(function(n){t._source[n]=t._source[n].map(function(n){if("Replacement"!==n.type)return n;var r;if(n.hasOwnProperty("num")){if(r=n.num,!e[r])throw new Error("There is no replacement with number "+r);return t.Replacements[r]=e[r],n}if(n.hasOwnProperty("expr")&&e&&e.length>0){var o=e.shift();r=uuid(),t.Replacements[r]=o;var i={type:"Replacement",num:r};return i}return n})})},Rule.prototype.fire=function(e,t){var n=this.Replacements;this[t.functor].forEach(function(r){r.call(e,t,n)})},Rule.prototype.toString=function(){return"[TODO]"}},{"./compile/head":11,uuid:8}],19:[function(require,module,exports){function Rules(r){this._chr=r,this.Order=[]}module.exports=Rules;var dynamicCaller=require("./dynamic-caller"),Rule=require("./rule");Rules.prototype.Add=function(r,e){var t=this,i=new Rule(r,{replacements:e,scope:t._chr.Scope}),s=i.Name;if(this.hasOwnProperty(s))throw new Error('Rule with name "'+s+'" multiple times specified');this[s]=i,this.Order.push(i.Name);var n;r.constraints.forEach(function(r){n=r.split("/")[0],t._chr[n]||(t._chr[n]=dynamicCaller(n).bind(t._chr)),t._chr[r]||(t._chr.Constraints[r]=[])}),r.head.forEach(function(r){t._chr.Constraints[r.functor].push(s)})},Rules.prototype.Reset=function(){var r,e=this,t=this._chr;for(var i in t.Constraints)r=i.split("/")[0],t.hasOwnProperty(r)&&delete t[r];t.Constraints={},this.ForEach(function(r){delete e[r.Name]}),this.Order=[]},Rules.prototype.ForEach=function(r,e){var t=this;this.Order.forEach(function(i){r.call(e,t[i])})}},{"./dynamic-caller":14,"./rule":18}],20:[function(require,module,exports){function Store(){this.reset()}module.exports=Store;var util=require("util"),events=require("events"),Table=require("easy-table");util.inherits(Store,events.EventEmitter),Store.prototype.reset=function(){this._lastId=0,this._store={},this._index={},this.length=0,this.invalid=!1},Store.prototype.add=function(t){var e=this._getNewConstraintId();return t.id=e,this._store[e]=t,this._addToIndex(t),this.length+=1,this.emit("add",t),e},Store.prototype.kill=function(t){var e=this._store[t];e&&(e.alive=!1,delete this._store[t],delete this._index[e.name][e.arity][e.id],this.length-=1,this.emit("remove",e))},Store.prototype._getNewConstraintId=function(){return this._lastId+=1,this._lastId},Store.prototype._addToIndex=function(t){var e=this._index;e.hasOwnProperty(t.name)||(e[t.name]={}),e[t.name].hasOwnProperty(t.arity)||(e[t.name][t.arity]={}),e[t.name][t.arity][t.id]=!0},Store.prototype.alive=function(t){return this._store[t]?this._store[t].alive:!1},Store.prototype.args=function(t){return this._store[t].args},Store.prototype.lookup=function(t,e){var r=this._index;return r.hasOwnProperty(t)&&r[t].hasOwnProperty(e)?Object.keys(r[t][e]):[]},Store.prototype.invalidate=function(){this.reset(),this.invalid=!0},Store.prototype.forEach=function(t){for(var e in this._store)t(this._store[e],e)},Store.prototype.map=function(t,e){var r=[];for(var i in this._store)r.push(t.call(e,this._store[i],i,this));return r},Store.prototype.toString=function(){if(0===this.length)return"(empty)";var t=new Table;return this.forEach(function(e){t.cell("ID",e.id),t.cell("Constraint",e.toString()),t.newRow()}),t.toString()}},{"easy-table":6,events:1,util:5}]},{},[16])(16)});
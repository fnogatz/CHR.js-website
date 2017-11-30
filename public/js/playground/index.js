!function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n||e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){function Editor(e){this.editor=e,this.delay=DELAY,this.onChange=function(){},this._oldSource=null,this._timer=null,this.setListeners()}module.exports=Editor;const DELAY=800;Editor.prototype.setListeners=function(){var e=this,t=e.editor;t.on("cursorActivity",e.scheduleBuild.bind(e)),t.on("focus",e.scheduleBuild.bind(e)),t.on("keydown",e.scheduleBuild.bind(e)),t.on("keypress",e.scheduleBuild.bind(e)),t.on("keyup",e.scheduleBuild.bind(e)),t.on("mousedown",e.scheduleBuild.bind(e)),t.on("mouseup",e.scheduleBuild.bind(e))},Editor.prototype.scheduleBuild=function(){var e=this;e.editor.getValue()===e._oldSource||(null!==e._timer&&(clearTimeout(e._timer),e._timer=null),e._timer=setTimeout(function(){e.build(),e._timer=null},e.delay))},Editor.prototype.build=function(e){var t=this,i=t.editor,o=i.getValue();t._oldSource=o,t.onChange(o,e)},Editor.prototype.setValue=function(e){this.editor.setValue(e),this.scheduleBuild()},Editor.prototype.deactivate=function(){this.editor.setOption("readOnly","nocursor")},Editor.prototype.reactivate=function(){this.editor.setOption("readOnly",!1)},Editor.prototype.highlight=function(e){var t=this.editor,i=e.location,o="marker mark-"+e.event.replace(":","-");return t.markText({line:i.start.line-1,ch:i.start.column-1},{line:i.end.line-1,ch:i.end.column-1},{className:o})||{clear:function(){}}}},{}],2:[function(require,module,exports){function updateQueryString(t,e,i){i||(i=window.location.href);var r,o=new RegExp("([?&])"+t+"=.*?(&|#|$)(.*)","gi");if(o.test(i))return void 0!==e&&null!==e?i.replace(o,"$1"+t+"="+e+"$2$3"):(r=i.split("#"),i=r[0].replace(o,"$1$3").replace(/(&|\?)$/,""),void 0!==r[1]&&null!==r[1]&&(i+="#"+r[1]),i);if(void 0!==e&&null!==e){var n=-1!==i.indexOf("?")?"&":"?";return r=i.split("#"),i=r[0]+n+t+"="+e,void 0!==r[1]&&null!==r[1]&&(i+="#"+r[1]),i}return i}function getParameterByName(t){t=t.replace(/[[]/,"\\[").replace(/[\]]/,"\\]");var e=new RegExp("[\\?&]"+t+"=([^&#]*)"),i=e.exec(window.location.search);return null===i?"":decodeURIComponent(i[1].replace(/\+/g," "))}function getTime(){var t=new Date;return("0"+t.getHours()).slice(-2)+":"+("0"+t.getMinutes()).slice(-2)+":"+("0"+t.getSeconds()).slice(-2)}function ExecutionTimer(){this.startDate=new Date,this.endDate=null,this.maxExecutionTime=ExecutionTimer.MAXEXECUTIONTIME,this.timer=null,this.onExceed=function(){}}var Editor=require("./editor"),Parser=require("./parser"),Solver=require("./solver"),util=require("./util");$(document).ready(function(){function t(t){b.queryInput.val(""),b.spinner.hide(),b.queryButton.prop("disabled",!1),b.clearStore.prop("disabled",!1),l(),o(),t&&t.store&&i(t.store),0===v&&(v=null)}function e(){b.switchTracing.bootstrapSwitch("state")||(b.timeoutErrorNotification.find(".mesg").text("The solver uses more time to terminate than normal. Do you want to trace the program?"),util.show(b.timeoutErrorNotification),b.spinner.hide(),b.switchTracing.bootstrapSwitch("disabled",!1),b.switchTracing.bootstrapSwitch("state",!0),b.switchTracing.bootstrapSwitch("disabled",!0),n())}function i(t){if(b.store.empty(),0===t.length)return b.store.append("<tr><td></td><td>(empty)</td></tr>"),void b.clearStore.hide();t.forEach(function(t){var e='<tr data-constraint-id="'+t.id+'"><td>'+t.id+"</td><td><code>"+t.string+"</code>";e+='<button type="button" title="Remove" class="close remove-constraint" data-constraint-id="'+t.id+'">×</button>',e+="</td></tr>",b.store.append(e),b.store.find("button.remove-constraint").on("click",c),b.store.find("button.reactivate-constraint").on("click",r)}),b.clearStore.show()}function r(){}function o(){$("#tracer-play").show().prop("disabled","disabled"),$("#tracer-pause").hide().prop("disabled","disabled"),$("#tracer-continue").prop("disabled","disabled"),$("#tracer-end").prop("disabled","disabled"),$("#tracer-abort").prop("disabled","disabled")}function n(){$("#tracer-play").show().prop("disabled",!1),$("#tracer-pause").hide().prop("disabled","disabled"),$("#tracer-continue").prop("disabled",!1),$("#tracer-end").prop("disabled",!1),$("#tracer-abort").prop("disabled",!1)}function c(t){var e;e="string"==typeof t?t:$(this).data("constraintId"),h.killConstraint(e),b.store.find('tr[data-constraint-id="'+e+'"]').remove(),0===b.store.find("tr").length&&(b.store.append("<tr><td></td><td>(empty)</td></tr>"),$("#clearStore").hide())}function a(){b.store.find("tr").each(function(t){$(this).attr("data-constraint-id")&&c($(this).attr("data-constraint-id"))})}function s(t){t=t||{};var e=new Gister({isAnonymous:!0});e.on("created",function(t){b.spinner.hide();var e=updateQueryString("gist",t.id);window.history.replaceState({},"Gist: "+t.id,e)}),e.on("error",function(t){b.spinner.hide(),b.gistErrorNotification.find(".mesg").text(t.toString())}),e.create({"chrjs.chr":S.getValue()})}function u(t){if(t.event&&("store:add"===t.event||"store:remove"===t.event))return void($('input[data-event="'+t.event+'"]').is(":checked")&&d(t));if(g=E.highlight(t),b.spinner.hide(),t&&t.store&&i(t.store),t&&t.event&&!$('input[data-event="'+t.event+'"]').is(":checked"))return g.clear(),b.spinner.show(),void h.continueBreakpoint();if(d(t),$("#tracer-pause").is(":visible")){var e=1e3*parseInt(b.tracerSpeed.val(),10);e=Math.max(0,e),m=setTimeout(function(){g.clear(),b.spinner.show(),h.continueBreakpoint()},e)}}function d(t){var e="";"string"==typeof t?e=t:"rule:try"===t.event?e='Try rule "'+t.rule+'" for '+t.constraint:"rule:try-occurrence"===t.event?e="Try occurrence "+t.occurrence+" for "+t.constraint:"store:add"===t.event?e="Added constraint "+t.constraintString+" to the store":"store:remove"===t.event&&(e="Removed constraint "+t.constraintString+" from the store");var i="<p><code>["+getTime()+"] "+e+"</code></p>";b.traceLogPanel.append(i),b.traceLogPanel.animate({scrollTop:b.traceLogPanel.prop("scrollHeight")},600)}function p(){E.deactivate(),b.compileButton.prop("disabled","disabled"),b.switchAutocompilation.bootstrapSwitch("disabled",!0),b.switchPersistentStore.bootstrapSwitch("disabled",!0),b.switchTracing.bootstrapSwitch("disabled",!0)}function l(){E.reactivate(),b.compileButton.prop("disabled",!1),b.switchAutocompilation.bootstrapSwitch("disabled",!1),b.switchPersistentStore.bootstrapSwitch("disabled",!1),b.switchTracing.bootstrapSwitch("disabled",!1)}var f,h,g,m,b={notifications:$("#notifications > *"),spinner:$("#spinner"),parsingErrorNotification:$("#notification-parsing-error"),queryErrorNotification:$("#notification-query-error"),gistErrorNotification:$("#notification-gist-error"),timeoutErrorNotification:$("#notification-timeout-error"),queryButton:$("#query button"),queryInput:$("#query input"),compileButton:$("#compile-button"),store:$("#store tbody"),clearStore:$("#clear-store"),switchAutocompilation:$('input[name="cb-live-compilation"]'),switchPersistentStore:$('input[name="cb-persistent-store"]'),switchTracing:$('input[name="cb-tracing"]'),switchTraceAutoplay:$('input[name="cb-trace-autoplay"]'),gistSave:$("#gist-save"),traceLog:$("#trace-log"),traceLogPanel:$("#trace-log .panel-body"),tracerSettings:$("#tracer-settings .dropdown-menu"),tracerSettingsOptions:$('#tracer-settings .dropdown-menu a:has(input[type="checkbox"])'),tracerSpeed:$("#tracer-speed")},w=[],v=null;!function(){b.compileButton.hide(),$('[data-type="switch"]').bootstrapSwitch(),b.switchAutocompilation.on("switchChange.bootstrapSwitch",function(t,e){e?(b.compileButton.fadeOut(),E.build({forced:!0})):(b.compileButton.fadeIn(),b.parsingErrorNotification.fadeOut())}),b.switchTracing.on("switchChange.bootstrapSwitch",function(t,e){e?b.traceLog.slideDown():b.traceLog.slideUp()}),b.gistSave.click(function(){s({public:!0})}),b.tracerSettingsOptions.on("click",function(t){var e,i=$(t.currentTarget),r=i.attr("data-value"),o=i.find("input");return(e=w.indexOf(r))>-1?(w.splice(e,1),setTimeout(function(){o.prop("checked",!1)},0)):(w.push(r),setTimeout(function(){o.prop("checked",!0)},0)),$(t.target).blur(),!1}),b.tracerSettings.find('a:has(input[type="text"])').on("click",function(t){return $(t.currentTarget).find("input").focus(),$(t.target).blur(),!1}),b.tracerSettings.on("click",function(t){return!1}),$("#tracer-play").click(function(){g.clear(),$("#tracer-play").hide().prop("disabled","disabled"),$("#tracer-pause").show().prop("disabled",!1),h.continueBreakpoint()}),$("#tracer-pause").click(function(){$("#tracer-play").show().prop("disabled",!1),$("#tracer-pause").hide().prop("disabled","disabled"),$("#tracer-continue").prop("disabled",!1),$("#tracer-end").prop("disabled",!1),$("#tracer-abort").prop("disabled",!1),0===v&&(v=null,h.getStore(function(t){i(t)})),m&&clearTimeout(m)}),$("#tracer-continue").click(function(){g.clear(),h.continueBreakpoint()}),$("#tracer-end").click(function(){g.clear(),o(),$("#tracer-play").hide(),$("#tracer-pause").show().prop("disabled",!1),v=0,h.continueBreakpoint()}),$("#tracer-abort").click(function(){g.clear(),d("Execution aborted."),util.hide(b.notifications),t()})}(),f=new Parser,h=new Solver({queryInput:b.queryInput}),f.onStart=function(){b.spinner.show(),util.hide(b.notifications)},f.onError=function(t,e){b.spinner.hide(),util.hide(b.notifications),"source"===t&&($("#notification-parsing-error .type").text("source code"),$("#notification-parsing-error .mesg").text(e),util.show(b.parsingErrorNotification)),"query"===t&&($("#notification-parsing-error .type").text("query"),$("#notification-parsing-error .mesg").text(e),util.show(b.parsingErrorNotification))},f.onEnd=function(t,e,i){if(b.spinner.hide(),util.hide(b.notifications),"source"===t)return void h.setSource(e);if("query"===t){if(i&&i.trace)return void h.callQuery(e,{trace:!0});h.callQuery(e)}};var y;h.onStart=function(){b.spinner.show(),util.hide(b.notifications),y=new ExecutionTimer,y.onExceed=e,y.start(),d("Execution started"),b.queryButton.prop("disabled","disabled"),b.clearStore.prop("disabled","disabled"),p()},h.onError=function(t){y.stop(),$("#notification-query-error .mesg").text(t),b.queryErrorNotification.show()},h.onEnd=function(e){y.stop(),d("Execution finished"),t(e)},h.onBreakpoint=function(t){return b.switchTracing.bootstrapSwitch("state")?0===v?void h.continueBreakpoint():void u(t):void h.continueBreakpoint()},h.onStoreEvent=function(t){b.switchTracing.bootstrapSwitch("state")&&u(t)},h.getOptions=function(){return{persistentStore:b.switchPersistentStore.bootstrapSwitch("state")}};var S=CodeMirror.fromTextArea($("#source").get(0),{lineNumbers:!0,theme:"monokai",styleActiveLine:!0,matchBrackets:!0});$(".CodeMirror, #source-control").click(function(){return!1}),$("#source-col").click(function(){S.setCursor(S.lineCount(),0),S.focus()});var E=new Editor(S);E.onChange=function(t,e){e=e||{},e.forced=e.forced||!1,(b.switchAutocompilation.bootstrapSwitch("state")||e.forced)&&f.parse("source",t)},b.compileButton.click(function(){E.build({forced:!0})}),b.queryButton.click(function(){var t=b.queryInput.val();b.switchTracing.bootstrapSwitch("state")?(b.traceLogPanel.empty(),n(),f.parse("query",t,{trace:!0})):f.parse("query",t)}),b.queryInput.keypress(function(t){13===t.which&&b.queryButton.click()}),$("#notifications > div button.close").click(function(t){$(this).parent().fadeOut()}),b.clearStore.click(function(t){a()}),S.focus(),function(){var t=getParameterByName("gist");if(t){b.spinner.show();var e=new Gister({isAnonymous:!0});e.on("error",function(t){b.spinner.hide(),b.gistErrorNotification.find(".mesg").text(t.toString())}),e.on("gist",function(t){if(b.spinner.hide(),!t.files||!t.files["chrjs.chr"])return void b.gistErrorNotification.find(".mesg").text("Given Gist has no CHR code.");E.setValue(t.files["chrjs.chr"].content)}),e.get(t)}}()}),ExecutionTimer.MAXEXECUTIONTIME=3e3,ExecutionTimer.prototype.start=function(t){var e=this;this.startDate=t||new Date,this.timer=setTimeout(function(){e.exceed()},this.maxExecutionTime)},ExecutionTimer.prototype.stop=function(t){this.stopDate=t||new Date,this.clearTimer()},ExecutionTimer.prototype.clearTimer=function(){this.timer&&(clearTimeout(this.timer),this.timer=null)},ExecutionTimer.prototype.exceed=function(){this.onExceed(),this.clearTimer()}},{"./editor":1,"./parser":3,"./solver":4,"./util":5}],3:[function(require,module,exports){function Parser(r,t){this.onStart=function(){},this.onEnd=function(){},this.onError=function(){},this.worker=new Worker(PARSERWORKER_URI),this._setEventListener()}module.exports=Parser;const BASE_URI=URI,PARSERWORKER_URI=BASE_URI+"/public/js/playground/parserworker.js";Parser.prototype.parse=function(r,t,e){e=e||{},this.onStart(),this.worker.postMessage({type:r,source:t,data:e})},Parser.prototype._setEventListener=function(){var r=this;this.worker.addEventListener("message",function(t){var e=t.data;if(e.error)return void r.onError(e.type,e.error);r.onEnd(e.type,e.parsed,e.data)})}},{}],4:[function(require,module,exports){function Solver(n){function t(n){i.info=n,i.setupQueryInput()}function o(n){if(n&&n.hasOwnProperty("error"))return void i.onError(n.error);i.onEnd(n)}function e(n){i.onBreakpoint(n)}function r(n){i.onStoreEvent(n)}var i=this;this._pluginConnected=!1,this._pluginConnectionTry=0,this.onStart=function(){},this.onError=function(){},this.onEnd=function(){},this.onBreakpoint=function(){},this.onStoreEvent=function(){},this.getOptions=function(){return{}},n=n||{},n.queryInput=n.queryInput||null;var u=new jailed.Plugin(CHRWORKER_URI,{setInfo:t,queryFinished:o,breakpoint:e,storeEvent:r});u.whenConnected(function(){u.remote.loadCHR(CHR_URI),i._pluginConnected=!0}),this.plugin=u,this.queryInput=n.queryInput}module.exports=Solver;const BASE_URI=URI,CHRWORKER_URI=BASE_URI+"/public/js/playground/chrworker.js",CHR_URI=BASE_URI+"/public/js/playground/chr-wop.js";Solver.RETRYTIME=200,Solver.MAXRETRIES=5,Solver.prototype.setSource=function(n){var t=this,o=this.getOptions()||{};if(!this._pluginConnected)return++this._pluginConnectionTry===Solver.MAXRETRIES?void this.onError("Could not connect to remote solver plugin."):void setTimeout(function(){t.setSource(n)},Solver.RETRYTIME);this.plugin.remote.setSource(n,o),this._pluginConnectionTry=0},Solver.prototype.callQuery=function(n,t){this.onStart(),this.plugin.remote.callQuery(n)},Solver.prototype.killConstraint=function(n){this.plugin.remote.killConstraint(n)},Solver.prototype.continueBreakpoint=function(){this.plugin.remote.continueBreakpoint()},Solver.prototype.getStore=function(n){this.plugin.remote.getStore(function(t){n(t)})},Solver.prototype.setupQueryInput=function(){var n=this;this.queryInput&&this.queryInput.textcomplete([{context:function(n){for(var t=0,o=0;o<n.length;o++)if("("===n[o]?t++:")"===n[o]&&t--,t<0)return!1;return 0===t},match:/(^|[\s,])([a-z][A-z0-9_]*)?$/,index:2,search:function(t,o){for(var e=[],r=0;r<n.info.functors.length;r++)0===n.info.functors[r].indexOf(t)&&e.push(n.info.functors[r]);o(e)},replace:function(n){var t=n.split("/")[0],o=parseInt(n.split("/")[1],10);return o>0?["$1"+t+"(",Array(o).join(",")+")"]:"$1"+t}}])}},{}],5:[function(require,module,exports){function show(e){e.removeClass("inactive")}function hide(e){e.addClass("inactive")}module.exports={},module.exports.show=show,module.exports.hide=hide},{}]},{},[2]);

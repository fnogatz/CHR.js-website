---
layout: playground
title: Playground
css:
  - public/css/vendor/codemirror/codemirror.css
  - public/css/vendor/codemirror/theme/monokai.css
  - public/css/playground.css
  - public/vendor/bootstrap-switch/bootstrap-switch.min.css
  - public/vendor/bootstrap-slider/bootstrap-slider.min.css
js:
  - public/js/vendor/codemirror/codemirror.js
  - public/js/vendor/codemirror/addon/selection/active-line.js
  - public/js/vendor/codemirror/addon/edit/matchbrackets.js
  - public/js/vendor/codemirror/mode/javascript/javascript.js
  - public/js/vendor/codemirror/mode/chr/chr.js
  - public/js/vendor/jailed/jailed.js
  - public/js/vendor/codemirror/codemirror.js
  - public/vendor/bootstrap-switch/bootstrap-switch.min.js
  - public/vendor/bootstrap-slider/bootstrap-slider.min.js
  - public/js/vendor/gister.min.js
jsEnd:
  - public/js/vendor/jquery.textcomplete.min.js
  - public/js/playground/index.js
---

<div class="page">
  <div id="playground">
    <div id="source-col" class="col">
      <div id="source-control">
        <span class="switches">
          <input type="checkbox" data-type="switch" name="cb-live-compilation" data-size="mini" data-label-text="Autocompilation" checked="checked">
          <input type="checkbox" data-type="switch" name="cb-persistent-store" data-size="mini" data-label-text="Persistence" checked="checked">
          <input type="checkbox" data-type="switch" name="cb-tracing" data-size="mini" data-label-text="Tracing">
        </span>

        <span id="buttons">
          <a href="#" class="btn btn-primary btn-xs" id="compile-button">Compile</a>
        </span>

        <div style="clear:both;"></div>
      </div>

      <textarea class="code" id="source" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" disabled></textarea>
    </div>

    <div id="actions-col" class="col">
      <div class="page-header" id="add-constraints-header">        
        <h2>Add Constraints</h2>
      </div>

      <div class="input-group" id="query">
        <input class="form-control" type="text">
        <span class="input-group-btn">
          <button class="btn btn-primary" type="button">Add</button>
        </span>
      </div>

      <div class="alert alert-dismissible alert-danger" id="constraintAddAlert" style="margin-top:10px; display:none;"></div>

      <div id="trace-log" style="display:none;">
        <div class="page-header">
          <h2>Trace Log</h2>
        </div>

        <div class="panel panel-default">
          <div class="panel-heading">
            <div class="btn-group">
              <button type="button" class="btn btn-primary btn-sm" id="tracer-play" title="Start Autoplay" disabled="disabled"><span class="glyphicon glyphicon-play" aria-hidden="true"></span></button>
              <button type="button" class="btn btn-primary btn-sm" id="tracer-pause" title="Pause Autoplay" style="display:none;" disabled="disabled"><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></button>
              <button type="button" class="btn btn-primary btn-sm" id="tracer-continue" title="Continue Execution" disabled="disabled"><span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span></button>
              <button type="button" class="btn btn-primary btn-sm" id="tracer-end" title="Finish Execution" disabled="disabled"><span class="glyphicon glyphicon-fast-forward" aria-hidden="true"></span></button>
              <button type="button" class="btn btn-primary btn-sm" id="tracer-abort" title="Abort Execution" disabled="disabled"><span class="glyphicon glyphicon-stop" aria-hidden="true"></span></button>
            </div>

            <div id="tracer-settings" class="btn-group pull-right">
              <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Tracing Settings">
                <span class="glyphicon glyphicon-cog"></span> <span class="caret"></span>
              </button>
              <ul class="dropdown-menu">
                <li><p>Autoplay Speed:</p></li>
                <li><a href="#" class="small" data-value="option1" tabIndex="-1"><input type="text" value="2" id="tracer-speed" />seconds pause per step</a></li>
                <li role="separator" class="divider"></li>
                <li><p>Use Breakpoints:</p></li>
                <li><a href="#" class="small" data-value="rule-try" tabIndex="-1"><input data-event="rule:try" type="checkbox" checked="checked" />On Rule Try</a></li>
                <li><a href="#" class="small" data-value="occurrence-try" tabIndex="-1"><input data-event="rule:try-occurrence" type="checkbox" checked="checked" />On Occurrence Try</a></li>
                <li role="separator" class="divider"></li>
                <li><p>Trace Events:</p></li>
                <li><a href="#" class="small" data-value="store-add" tabIndex="-1"><input data-event="store:add" type="checkbox" checked="checked" />Store: <code>add</code></a></li>
                <li><a href="#" class="small" data-value="store-remove" tabIndex="-1"><input data-event="store:remove" type="checkbox" checked="checked" />Store: <code>remove</code></a></li>
              </ul>
            </div>
          </div>

          <div class="panel-body" style="position:relative;">
            <!-- empty -->
          </div>
        </div>
      </div>

      <div class="page-header">
        <button type="button" class="btn btn-info" id="clear-store" title="Clear Constraint Store" style="display:none;float:right">Clear</button>
        <h2>Constraint Store</h2>
      </div>
      
      <table class="table table-striped table-hover" id="store">
        <thead>
          <tr>
            <th>ID</th>
            <th>Constraint</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td>(empty)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

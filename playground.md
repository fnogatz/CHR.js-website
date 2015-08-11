---
layout: playground
title: Playground
css:
  - public/css/vendor/codemirror/codemirror.css
  - public/css/vendor/codemirror/theme/monokai.css
  - public/css/playground.css
  - public/vendor/bootstrap-switch/bootstrap-switch.min.css
js:
  - public/js/vendor/codemirror/codemirror.js
  - public/js/vendor/codemirror/addon/selection/active-line.js
  - public/js/vendor/codemirror/addon/edit/matchbrackets.js
  - public/js/vendor/codemirror/mode/javascript/javascript.js
  - public/js/vendor/codemirror/mode/chr/chr.js
  - public/js/vendor/jailed/jailed.js
  - public/js/vendor/codemirror/codemirror.js
  - public/vendor/bootstrap-switch/bootstrap-switch.min.js
  - public/js/vendor/gister.min.js
jsEnd:
  - public/js/vendor/jquery.textcomplete.min.js
  - public/js/playground/index.js
---

<div class="page">
  <div id="playground">
    <div id="source-col" class="col">
      <div id="source-control">
        <span id="switches">
          <input type="checkbox" data-type="switch" name="cb-live-compilation" data-size="mini" data-label-text="Autocompilation" checked="checked">
          <input type="checkbox" data-type="switch" name="cb-persistent-store" data-size="mini" data-label-text="Persistence" checked="checked">
        </span>

        <span id="buttons">
          <a href="#" class="btn btn-primary btn-xs" id="compile-button">Compile</a>
        </span>

        <div style="clear:both;"></div>
      </div>
      <textarea class="code" id="source" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" disabled></textarea>
    </div>
    <div id="actions-col" class="col">
      <div class="page-header">
        <h2>Add Constraints</h2>
      </div>

      <div class="input-group" id="query">  
        <input class="form-control" type="text">
        <span class="input-group-btn">
          <button class="btn btn-default" type="button">Add</button>
        </span>
      </div>

      <div class="alert alert-dismissible alert-danger" id="constraintAddAlert" style="margin-top:10px; display:none;"></div>

      <div class="page-header">
        <a href="#" class="btn btn-info" id="clearStore" style="display:none;float:right">Clear</a>
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

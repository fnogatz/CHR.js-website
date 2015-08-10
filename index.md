---
layout: default
title: Index
css:
  - public/css/vendor/codemirror/codemirror.css
  - public/css/vendor/codemirror/theme/monokai.css
js:
  - public/js/vendor/codemirror/codemirror.js
---

<div class="row">
  <div class="col-lg-7 col-md-7">
    <div class="page-header">
      <h2><span class="btn btn-primary step-no">1</span> Write your Constraint Handling Rules</h2>
    </div>

    <textarea class="code" id="source" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" disabled></textarea>

    <div class="alert alert-dismissible alert-danger" id="sourceAlert" style="margin-top:10px; display:none;"></div>

    <div class="page-header">
      <h4>Examples</h4>
    </div>

    <div class="list-group" id="examples">
      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Greatest Common Divisor</h4>
        <p class="list-group-item-text">Computes greatest common divisor by Euclidean algorithm.</p>
        <p class="list-group-item-text usage">Add <code>gcd(12)</code> and <code>gcd(8)</code></p>
        <pre style="display:none" data-example-id="gcd">cleanup @ gcd(0) &lt;=&gt; true;
gcd(N) \ gcd(M) &lt;=&gt; 0 &lt; N, N &lt;= M | gcd(M % N);</pre>
      </a>

      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Fibonacci (Bottom-Up)</h4>
        <p class="list-group-item-text">Computes Fibonacci numbers by Bottom-Up Evaluation.</p>
        <p class="list-group-item-text usage">Add <code>fib(1,1)</code>, <code>fib(2,1)</code> and <code>upto(10)</code></p>
        <pre style="display:none" data-example-id="fib">upto(N), fib(A,AV), fib(B,BV) ==&gt; B === A+1, B &lt; N | fib(B+1,AV+BV);</pre>
      </a>

      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Primes</h4>
        <p class="list-group-item-text">Generate prime numbers by Sieve of Eratosthenes.</p>
        <p class="list-group-item-text usage">Add <code>upto(12)</code> to generate all primes upto 12.</p>
        <pre style="display:none" data-example-id="primes">gen   @ upto(N) &lt;=&gt; N > 1 | upto(N-1), prime(N);
sift  @ prime(X) \ prime(Y) &lt;=&gt; Y % X === 0 | true;</pre>
      </a>

      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Shortest Paths</h4>
        <p class="list-group-item-text">Computes for a directed graph the shortest length for each path.</p>
        <p class="list-group-item-text usage">Add some <code>edge/2</code>  constraints or simply call the <code>example/0</code></p>
        <pre style="display:none" data-example-id="shortest-paths">rem_long @ path(X,Y,L1) \ path(X,Y,L2) &lt;=&gt; L1 &lt;= L2 | true;
path_add @ path(X,Y,L1), path(Y,Z,L2) ==> X !== Z | path(X,Z,L1+L2);

example &lt;=&gt;
path('London','Berlin',1100),
path('Berlin','Vienna',650),
path('Vienna','London',1500),
path('Vienna','Paris',1200),
path('Ulm','Vienna',600),
path('Paris','Ulm',700);</pre>
      </a>

      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Hamming Sequence</h4>
        <p class="list-group-item-text">Solves the Hamming Problem which is to build the infinite ascending sequence of positive numbers containing no prime factors other than 2, 3 and 5.</p>
        <p class="list-group-item-text usage">Add <code>succ(0,1)</code>, <code>hamming(0)</code> and <code>upto(100)</code> to produce the beginning of the Hamming sequence.</p>
        <pre style="display:none" data-example-id="hamming">succ(A,A) &lt;=&gt; true;
succ(A,B) \ succ(A,C) &lt;=&gt; A &lt; B, B &lt;= C | succ(B,C);

upto(N), succ(S,X) \ hamming(S) &lt;=&gt; X &lt; N |  
succ(X,2*X),
succ(X,3*X),
succ(X,5*X),
hamming(X);</pre>
      </a>

      <a href="#" class="list-group-item">
        <h4 class="list-group-item-heading">Family Relations</h4>
        <p class="list-group-item-text">This is an example how CHR could be used as a deductive database, i.e., the information is deduced from facts and rules.</p>
        <p class="list-group-item-text usage">Add <code>facts/0</code> to create example constraints</p>
        <pre style="display:none" data-example-id="db_family">sibling(X,Y) \ sibling(X,Y) &lt;=&gt; true;
cousin(X,Y) \ cousin(X,Y) &lt;=&gt; true;

mother(M1,C) \ mother(M2,C) &lt;=&gt; M1 === M2;
father(F1,C) \ father(F2,C) &lt;=&gt; F1 === F2;

parent(X,Y), gender(X,'f') ==&gt; mother(X,Y);
parent(X,Y), gender(X,'m') ==&gt; father(X,Y);

parent(G,P), parent(P,C) ==&gt; grandparent(G,C);

parent(X,Y) ==&gt; ancestor(X,Y);
parent(X,Y), ancestor(Y,Z) ==&gt; ancestor(X,Z);

parent(P,X), parent(P,Y) ==&gt; X !== Y | sibling(X,Y);

grandparent(G,X), grandparent(G,Y) ==&gt; X !== Y | cousin(X,Y);

gender(A,'f'), sibling(A,P), parent(P,C) ==&gt; aunt(A,C);
gender(U,'m'), sibling(U,P), parent(P,C) ==&gt; uncle(U,C);

facts &lt;=&gt;
gender('lucille','f'), gender('michael','m'), gender('lindsay','f'),
gender('george_michael','m'), gender('maeby','f'), gender('buster','m'),
parent('lucille', 'michael'),
parent('lucille', 'lindsay'),
parent('lucille', 'buster'),
parent('michael', 'george_michael'), 
parent('lindsay', 'maeby');</pre>
      </a>
    </div>
  </div>

  <div class="col-lg-4 col-lg-offset-1 col-md-4 col-md-offset-1">
    <div class="page-header">
      <h2><span class="btn btn-primary step-no">2</span> Add Constraints</h2>
    </div>

    <div class="input-group" id="addConstraint">  
      <input class="form-control" type="text">
      <span class="input-group-btn">
        <button class="btn btn-default" type="button">Add</button>
      </span>
    </div>

    <div class="alert alert-dismissible alert-danger" id="constraintAddAlert" style="margin-top:10px; display:none;"></div>

    <div class="page-header">
      <a href="#" class="btn btn-info" id="clearStore" style="display:none;float:right">Clear</a>
      <h2><span class="btn btn-primary step-no">3</span> Inspect Store</h2>
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

    <div class="page-header">
      <h2><span class="btn btn-primary step-no">4</span> Download Solver</h2>
    </div>

    <div class="list-group" id="download-links">
      <a href="#" class="list-group-item" data-download-format="node">
        <h5 class="list-group-item-heading">As Node.js Module</h5>
        <!--<p class="list-group-item-text">Usage:</p>
        <ol>
          <li><code>npm install chr</code></li>
          <li><code>var CHR = require('./chr.js')</code></li>
          <li>Call your constraint by using the <code>CHR.</code>-prefix, e.g. <code>CHR.gcd(12)</code></li>
        </ol>-->
      </a>
      <a href="#" class="list-group-item" data-download-format="browser">
        <h5 class="list-group-item-heading">As Browser Script</h5>
        <!--<p class="list-group-item-text">Usage:</p>
        <ol>
          <li>Include the <code>chr.runtime.js</code></li>
          <li>Include the downloaded <code>chr.js</code></li>
          <li>Call your constraint by using the <code>CHR.</code>-prefix, e.g. <code>CHR.gcd(12)</code></li>
        </ol>-->
      </a>
    </div>
  </div>
</div>
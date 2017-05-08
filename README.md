# CHR.js Website

[![Greenkeeper badge](https://badges.greenkeeper.io/fnogatz/CHR.js-website.svg)](https://greenkeeper.io/)

The static site that is [chrjs.net](http://chrjs.net/). Just enter your Constraint Handling Rules, try adding some constraints, and download the generated solver code. Based on [CHR.js](https://github.com/fnogatz/CHR.js).

## Notation

Rules follow the [CHR.js](https://github.com/fnogatz/CHR.js) syntax. Additionally, the specification of a preamble containing native JavaScript is allowed:

    {
      // preamble
      // code in this block can be used in the rules' guards and bodies

      function print (v) {
        console.log(v)
      }

      function pred (v) {
        return v < 5
      }
    }

    print_num     @ num(v) ==> ${ (v) => print(v) }
    generate_nums @ num(v) ==> ${ (v) => pred(v) } | num(v+1)

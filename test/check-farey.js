

function continuedFractions(n, denominatorLimit){
  let p0 = 0, q0 = 1, p1 = 1, q1 = 0
  let af = n;
  const quotients = []
  for(let i = 0; i < 20; ++i){
    let a = Math.floor(af)
    const q2 = q0 + a*q1;
    if(q2 > denominatorLimit){
      break;
    }
    const p2 = p0 + a * p1;
    p0 = p1;
    q0 = q1;
    p1 = p2;
    q1 = q2;
    console.log(`${p1}/${q1}`)
    af = 1/(af - a)
  }
  const k = Math.floor((denominatorLimit-q0)/q1)
  const b1 = (p0 + k*p1) / (q0+k*q1)
  const b2 = p1/q1;
  if(Math.abs(n - b2) < Math.abs(b1 - n)){
    const denominator = q1;
    const numerator = p1 % q1;
    const intPart = Math.floor(n)
    return {intPart, numerator, denominator}
  }else{
    const denominator = q0 + k*q1;
    const numerator = (p1 + k*p1) % denominator;
    const intPart = Math.floor(n)
    return {intPart, numerator, denominator}
  }
  
}



function fareyTree(n, denominatorLimit){
  if(n < 0){
    const r = fareyTree(-n, denominatorLimit)
    r.numerator *= -1;
    r.intpart *= -1;
    return r;
  }
  const intPart = Math.floor(n)
  const fracPart = n - intPart;
  
  // Use Farey sequence to find the best fraction
  // approximation within the denominator limit
  let ln=0, ld=1, hn=1, hd=1;
  let numerator = 0, denominator = 1, err = fracPart;
  let iterations = 0
  const trace = []
  for(;;){
    ++iterations;
    let mn = ln + hn;
    let md = ld + hd;
    trace.push([iterations, ln, ld, mn, md, hn, hd])
    if(md > denominatorLimit){
      // The denominator exceeded the specified limit
      break;
    }
    let residual = mn / md - fracPart
    if(residual < 0){
      ln = mn;
      ld = md;
      residual = -residual;
    }else{
      hn = mn;
      hd = md;
    }
    if(residual < err){
      console.log(`${mn}/${md}`)
      numerator = mn;
      denominator = md;
      err = residual;
      if(residual == 0){
        break; // no reason to keep searching
      }
    }
  }
  if(numerator == denominator){
    return {intPart:intPart + 1, numerator: 0, denominator: 1}
  }
  return {intPart, numerator, denominator}
}

console.log(fareyTree(Math.PI-3, 1e6-1))
console.log(continuedFractions(Math.PI-3, 1e6-1))

console.log(continuedFractions(Math.SQRT1_2, 1e6-1))
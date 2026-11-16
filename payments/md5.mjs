// PayFast's protocol requires MD5; this is not used for passwords or order tokens.
export function md5(value) {
  const input=new TextEncoder().encode(value), length=Math.ceil((input.length+9)/64)*64;
  const bytes=new Uint8Array(length); bytes.set(input); bytes[input.length]=128;
  const view=new DataView(bytes.buffer);view.setUint32(length-8,input.length*8,true);
  let a=0x67452301,b=0xefcdab89,c=0x98badcfe,d=0x10325476;
  const shifts=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  for(let offset=0;offset<length;offset+=64){
    let A=a,B=b,C=c,D=d;
    for(let i=0;i<64;i++){
      let f,g;
      if(i<16){f=(B&C)|(~B&D);g=i;}
      else if(i<32){f=(D&B)|(~D&C);g=(5*i+1)%16;}
      else if(i<48){f=B^C^D;g=(3*i+5)%16;}
      else {f=C^(B|~D);g=(7*i)%16;}
      const sum=(A+f+Math.floor(Math.abs(Math.sin(i+1))*4294967296)+view.getUint32(offset+g*4,true))|0;
      const shift=shifts[Math.floor(i/16)*4+i%4];
      A=D;D=C;C=B;B=(B+((sum<<shift)|(sum>>>(32-shift))))|0;
    }
    a=(a+A)|0;b=(b+B)|0;c=(c+C)|0;d=(d+D)|0;
  }
  return [a,b,c,d].map(n=>[0,8,16,24].map(s=>((n>>>s)&255).toString(16).padStart(2,'0')).join('')).join('');
}

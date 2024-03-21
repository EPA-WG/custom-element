/**
 * node xslDtd2Ide.cjs
 * would get xsl 1.0 schema and populate InjelliJ and VS Code IDE custom elements definitions
 *
 * This is one time use script as XSLT 1.0 schema is not changing.
 */

(async function () {


    const dtdText = await fetch('https://www.w3.org/1999/11/xslt10.dtd')
        .then((response) => response.text())
        .then((body) => {
            return body;
        });
    const matches = dtdText.match(/<([^>]*)>/g );

    const chopOff = (s, begin=1, end=1) => s.substring(begin,s.length-end);
    const trim = s=> s?.trim ? s.trim() : s;

    let lastComment =''
    const dtdObj = {ENTITY:{},ELEMENT:{}}
    for (const match of matches)
    {
        if( match.startsWith('<!--')){ lastComment = match; continue; }
        const body = chopOff(match,2);
        const arr = body.split(/\s/ );
        const name = arr[1].trim();
        const resolveRef = s => s? (s.startsWith ? (s.startsWith('%')? dtdObj.ENTITY[chopOff(s,1,0).replace(';','')] : s):s ):s;
        const attrObj = a =>
        {   if( !a || Array.isArray(a) || !a.trim)
                return a;
            const as = a.trim();
            if( 'CDATA,#PCDATA,NMTOKEN,NMTOKENS,'.includes(as+','))
                return as;
            const ar = as.split(';')
            const aa = ar[0].split(' ');
            return { name: aa[0], type: resolveRef(aa[1]), defValue: aa[2], required: ar[1]}
        };
        switch(arr[0])
        {
            case 'ENTITY':
            {   let key = arr[2];
                let val = body.substring( body.indexOf(key) + key.length ).trim();
                if( 'instructions' === key){debugger}

                let ss;
                if( val.startsWith('"') || val.startsWith("'") )
                {
                    val = chopOff(val);
                    if( val.includes('(#PCDATA') )
                    {   val = val.replace( '(#PCDATA','').replace(')*','').trim();
                        ss = ['#PCDATA',...val.split('\n').map(s=>s.trim()).map(resolveRef).flat()];
                    }else
                        ss = val.split(/[\n]/ ).map(s=>s.replace('|','').trim()).filter(s=>s);
                }else
                {
                    ss = val.split(/[|\n]/ );
                }
                try {
                    const v = ss.map(trim).filter(s => s).map(resolveRef).map(attrObj).flat().filter(s=>s);
                    dtdObj.ENTITY[key] = !v.length ? '' : v.length === 1 ? v[0] : v;
                }catch (err){debugger}
                break;
            }
            case 'ELEMENT': dtdObj.ELEMENT[name] = {values:arr[2], attributes:[]}; break;
            case 'ATTLIST':
            {   const attrStr = body.split(name)[1].trim();
                if( 'xsl:fallback' === name){debugger}
                const attrs = attrStr.split('\n').map(s=>s.trim());
                const elementAttrs = dtdObj.ELEMENT[name].attributes;
                for( let a of attrs )
                {
                    if( a.startsWith('%'))
                    {   const v = dtdObj.ENTITY[chopOff(a.split(';')[0],1,0)];
                        if(!v){debugger;}
                        Array.isArray(v)
                            ? elementAttrs.push(...v)
                            : elementAttrs.push(v);
                    }else
                        elementAttrs.push(attrObj(a));
                }

                break;
            }
        }
    }
    console.log(dtdObj)
})();
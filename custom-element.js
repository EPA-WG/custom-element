const XSL_NS_URL  = 'http://www.w3.org/1999/XSL/Transform'
,     HTML_NS_URL = 'http://www.w3.org/1999/xhtml'
,     EXSL_NS_URL = 'http://exslt.org/common'
,     DCE_NS_URL  ="urn:schemas-epa-wg:dce";

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const attr = (el, attr)=> el?.getAttribute?.(attr)
,   isText = e => e.nodeType === 3
,   isString = s => typeof s === 'string'
,   isNode = e => e && typeof e.nodeType === 'number'
,   createText = ( d, t) => (d.ownerDocument || d ).createTextNode( t )
,   removeChildren = n => { while(n.firstChild) n.firstChild.remove(); return n; }
,   emptyNode = n => {  n.getAttributeNames().map( a => n.removeAttribute(a) ); return removeChildren(n); }
,   xslNs = x => ( x?.setAttribute('xmlns:xsl', XSL_NS_URL ), x )
,   xslHtmlNs = x => ( x?.setAttribute('xmlns:xhtml', HTML_NS_URL ), xslNs(x) )
,   isValidTagName = tag=> ( /^[_a-zA-Z][-_:a-zA-Z0-9]*$/ .test(tag) )
,   mix = (o,kv) => { Object.keys(kv).map(k=> o[k] = kv[k] ) ; return o}
,   create = ( tag, t = '', d=document ) =>
{
    const create = tag => ( e => ((t && e.append(createText(d.ownerDocument||d, t))),e) )((d.ownerDocument || d ).createElement( tag ))

    if( isValidTagName(tag) )
        return  create(tag)
    const e = create('dce-object');
    e.setAttribute('dce-object-name',tag)
    return e;
}
,   cloneAs = (p,tag) =>
{   const px = p.ownerDocument.createElementNS(p.namespaceURI,tag);
    for( let a of p.attributes)
        px.setAttribute(a.name, a.value);
    for( let c of p.childNodes )
        px.append(c.cloneNode(true));
    return px;
};

export {cloneAs,mix};

    function
ASSERT(x)
{
    // if(!x)
    //     debugger
}
    export function
xml2dom( xmlString )
{
    return new DOMParser().parseFromString( xmlString, "application/xml" )
}
    export function
xmlString(doc){ return new XMLSerializer().serializeToString( doc ) }
function x(doc) { return xmlString(doc) }

    function
injectData( root, sectionName, arr, cb )
{   const create = ( tag ) => root.ownerDocument.createElement( tag );
    const inject = ( tag, parent, s ) =>
    {   parent.append( s = create( tag ) );
        return s;
    };
    const l = inject( sectionName, root );
    [ ...arr ].forEach( e => l.append( cb( e ) ) );
    return l;
}

    function
assureSlot( e )
{
    if( !e.slot )
    {
        if( !e.setAttribute )
            e = create( 'span', e.textContent.replaceAll( '\n', '' ) );
        e.setAttribute( 'slot', '' )
    }
    return e;
}
    function
keepAttributes(e, aNames)
    {   e.getAttributeNames().forEach( n=> aNames.includes(n) || e.removeAttribute(n) ); }

    export const
sanitizeBlankText = payload=> [...payload].filter(e=>!(e.nodeType===3 && e.data.trim() ==='' ));

    export function
obj2node( o, tag, doc )
{   const t = typeof o;
    if( t === 'string' )
        return create(tag,o,doc);
    if( t === 'number' )
        return create(tag,''+o,doc);
    if( isNode(o) )
    {
        const el = create(tag);
        el.append(o);
        return el;
    }
    if( o instanceof Array )
    {   const ret = create('array','',doc);
        o.map( ae => ret.append( obj2node(ae,tag,doc)) );
        return ret
    }
    if( o instanceof FormData )
    {   const ret = create('form-data','',doc);
        for( const p of o )
            ret.append( obj2node(p[1],p[0],doc) );
        return ret
    }
    const ret = create(tag,'',doc);
    for( let k in o )
    {
        if( typeof o[ k ] === 'function' || o[ k ] instanceof Window )
            continue
        if( isNode( o[ k ] ) )
        {   if( k === 'data' || k==='value' )
                ;
            else
                continue
        }
        if( typeof o[ k ] !== "object" && isValidTagName( k ) )
            ret.setAttribute( k, o[ k ] )
        else
            ret.append( obj2node( o[ k ], k, doc ) )
    }
    return ret;
}
    export function
tagUid( node )
{   // {} to xsl:value-of
    forEach$(node,'*',d => [...d.childNodes]
        .filter( e => e.nodeType === 3 && e.parentNode.localName !== 'style' && e.data )
        .forEach( e=>
    {   const s = e.data,
              m = s.matchAll( /{([^}]*)}/g );
        if(m)
        {   let l = 0
            , txt = t => createText(e,t)
            ,  tt = [];
            [...m].forEach(t=>
            {   if( t.index > l )
                    tt.push( txt( t.input.substring( l, t.index ) ))
                const v = node.querySelector('value-of').cloneNode();
                v.setAttribute('select', t[1] );
                tt.push(v);
                l = t.index+t[0].length;
            })
            if( l < s.length)
                tt.push( txt( s.substring(l,s.length) ));
            if( tt.length )
            {   for( let t of tt )
                    d.insertBefore(t,e);
                d.removeChild(e);
            }
        }
    }));

    if( 'all' in node ) {
        let i= 1;
        for( let e of node.all )
            e.setAttribute && !e.tagName.startsWith('xsl:') && e.setAttribute('data-dce-id', '' + i++)
    }
    return node
}
    export function
createXsltFromDom( templateNode, S = 'xsl:stylesheet' )
{
    const declaredAttributes = []
    , hardcodedAttributes = {}
    , exposedAttributes={};

    if( templateNode.tagName === S || templateNode.documentElement?.tagName === S )
        return tagUid(mix( templateNode, { declaredAttributes, hardcodedAttributes, exposedAttributes } ));

    const sanitizeXsl = xml2dom(`<xsl:stylesheet version="1.0" xmlns:xsl="${ XSL_NS_URL }" xmlns:xhtml="${ HTML_NS_URL }" xmlns:exsl="${EXSL_NS_URL}" exclude-result-prefixes="exsl" >
    <xsl:output method="xml"/>
        <xsl:template match="/"><dce-root xmlns="${ HTML_NS_URL }"><xsl:apply-templates select="*" /></dce-root></xsl:template>
    <xsl:template match="*[name()='template']">
        <xsl:apply-templates mode="sanitize" select="*|text()"/>
    </xsl:template>
    <xsl:template match="*">
        <xsl:apply-templates mode="sanitize" select="*|text()"/>
    </xsl:template>
    <xsl:template match="*[name()='svg']|*[name()='math']">
        <xsl:apply-templates mode="sanitize" select="."/>
    </xsl:template>
    <xsl:template mode="sanitize" match="*[count(text())=1 and count(*)=0]">
        <xsl:copy>
            <xsl:apply-templates mode="sanitize" select="@*"/>
            <xsl:value-of select="text()"></xsl:value-of>
        </xsl:copy>
    </xsl:template>
    <xsl:template mode="sanitize" match="xhtml:*[count(text())=1 and count(*)=0]">
        <xsl:element name="{local-name()}">
            <xsl:apply-templates mode="sanitize" select="@*"/>
            <xsl:value-of select="text()"></xsl:value-of>
        </xsl:element>
    </xsl:template>
    <xsl:template mode="sanitize" match="*|@*">
        <xsl:copy>
            <xsl:apply-templates mode="sanitize" select="*|@*|text()"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template mode="sanitize" match="text()[normalize-space(.) = '']"/>
    <xsl:template mode="sanitize" match="text()">
        <dce-text>
            <xsl:copy/>
        </dce-text>
    </xsl:template>
    <xsl:template mode="sanitize" match="xsl:value-of|*[name()='slot']">
        <xsl:copy>
            <xsl:apply-templates mode="sanitize" select="*|@*|text()"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template mode="sanitize" match="xhtml:*">
        <xsl:element name="{local-name()}">
            <xsl:apply-templates mode="sanitize" select="*|@*|text()"/>
        </xsl:element>
    </xsl:template>
    <xsl:template mode="sanitize" match="xhtml:input">
        <xsl:element name="{local-name()}">
            <xsl:apply-templates mode="sanitize" select="*[not(name()='slice')]|@*|text()"/>
        </xsl:element>
        <xsl:for-each select="slice">
            <xsl:copy>
                <xsl:attribute name="for" >^</xsl:attribute>
                <xsl:apply-templates mode="sanitize" select="*|@*|text()"/>
            </xsl:copy>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>`)
    const sanitizeProcessor = new XSLTProcessor()
    ,   tc = (n =>
        {
            forEach$(n,'custom-element', ce=>{
                if( 'template' === ce.firstElementChild.localName )
                {
                    [...ce.firstElementChild.content.childNodes].forEach(n=>ce.append(n));
                    ce.firstElementChild.remove();
                }
            })
            forEach$(n,'script', s=> s.remove() );
            const xslRoot = n.content ?? n.firstElementChild?.content ?? n.body ?? n;
            xslTags.forEach( tag => forEach$( xslRoot, tag, el=>toXsl(el,xslRoot) ) );
            const e = n.firstElementChild?.content || n.content
            , asXmlNode = r => {
                const d = xml2dom( '<xhtml/>' )
                ,     n = d.importNode(r, true);
                d.replaceChild(n,d.documentElement);
                if( n.namespaceURI === HTML_NS_URL && !attr(n,'xmlns'))
                    n.setAttribute('xmlns',HTML_NS_URL);
                return xslHtmlNs(n);
            };
            if( e )
            {   const t = create('div');
                [ ...e.childNodes ].map( c => t.append(c.cloneNode(true)) )
                return asXmlNode(t)
            }
            return  asXmlNode(n.documentElement || n.body || n)
        })(templateNode)
    ,   xslDom = xml2dom(
        `<xsl:stylesheet version="1.0"
        xmlns:xsl="${ XSL_NS_URL }"
        xmlns:xhtml="${ HTML_NS_URL }"
        xmlns:dce="urn:schemas-epa-wg:dce"
        xmlns:exsl="http://exslt.org/common"
        exclude-result-prefixes="exsl"
    >
    <xsl:template match="ignore">
        <xsl:choose>
            <xsl:when test="//attr">{//attr}</xsl:when>
            <xsl:otherwise>{def}</xsl:otherwise>
        </xsl:choose><xsl:value-of select="."></xsl:value-of></xsl:template>
    <xsl:template mode="payload"  match="attributes"></xsl:template>
    <xsl:template match="/">
        <xsl:apply-templates mode="payload" select="/datadom/attributes"/>
    </xsl:template>
    <xsl:template name="slot" >
        <xsl:param name="slotname" />
        <xsl:param name="defaultvalue" />
        <xsl:choose>
            <xsl:when test="//payload/*[@slot=$slotname]">
               <xsl:copy-of select="//payload/*[@slot=$slotname]"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:copy-of select="$defaultvalue"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:variable name="js-injected-body">
        <xsl:call-template name="slot" >
            <xsl:with-param name="slotname" select="''"/>
            <xsl:with-param name="defaultvalue"/>
        </xsl:call-template>
    </xsl:variable>
</xsl:stylesheet>`
        );

    sanitizeProcessor.importStylesheet( sanitizeXsl );

    const fr = sanitizeProcessor.transformToFragment(tc, document)
    ,   $ = (e,css) => e.querySelector(css)
    ,   payload = $( xslDom, 'template[mode="payload"]');
    if( !fr )
        return console.error("transformation error",{ xml:tc.outerHTML, xsl: xmlString( sanitizeXsl ) });
    if( 'dce-root'!==fr.firstElementChild.localName )
    {   const r = fr.ownerDocument.createElement('dce-root');
        [...fr.childNodes].forEach(n=>r.append(n));
        fr.append(r)
    }

    [...fr.querySelectorAll('[test]')].forEach( n=>{
        const t = attr(n,'test')
        ,     r = t.replace(/hasBoolAttribute\((.*?)\)/g,
            (match, p1, p2,p3,p4)=>
            {   const a = p1.substring(1);
                return `(not($${a} = \'false\') and ($${a} = '' or $${a} = '${a}' or $${a} = 'true' ))`
            });
        t!== r && n.setAttribute('test',r);
    });

    [...fr.querySelectorAll('dce-root>attribute')].forEach( a=>
    {
        keepAttributes(a,'namespace,name,select');
        const p = cloneAs(a,'xsl:param')
        ,  name = attr(a,'name');

        declaredAttributes.push(name);
        if( a.childNodes.length )
            hardcodedAttributes[name] = a.textContent;

        payload.append(p);

        if( a.hasAttribute('select') )
        {
            exposedAttributes[ name ] = attr( a, 'select' );
            keepAttributes( p, 'select,name' );

            let select = attr(a,'select').split('??');

            let val;
            if( select?.length>1 )
            {   p.removeAttribute('select');
                const c = $( xslDom, 'template[match="ignore"]>choose').cloneNode(true);
                emptyNode(c.firstElementChild).append( createText(c,'{'+select[0]+'}'));
                c.firstElementChild.setAttribute('test',select[0]);
                for( let i=1; i<select.length-1; i++)
                {   const when = c.firstElementChild.cloneNode(true);
                    emptyNode(when).append( createText(c,'{'+select[i]+'}'));
                    when.setAttribute('test',select[i]);
                    c.insertBefore(when, c.lastElementChild);
                }
                emptyNode(c.lastElementChild ).append( createText(c,'{'+select[select.length-1]+'}'));
                p.append(c);
                val = c.cloneNode(true);
            }else
                val = cloneAs(a,'xsl:value-of');
            val.removeAttribute('name');
            a.append(val);
            a.removeAttribute('select');
        }else
        {
            keepAttributes( p, 'name' );
            p.setAttribute('select','/datadom/attributes/'+name)

            if( !hardcodedAttributes[name] )
                a.remove();
        }
    });
    [...fr.querySelectorAll('[value]')].filter(el=>el.getAttribute('value').match( /\{(.*)\?\?(.*)\}/g )).forEach(el=>
    {   const v = attr(el,'value');
        if(v)
            el.setAttribute('value', evalCurly(v));
    });
    for( const c of fr.childNodes )
        payload.append(xslDom.importNode(c,true))

    const embeddedTemplates = [...payload.getElementsByTagName('xsl:template')];
    embeddedTemplates.forEach(t=>payload.ownerDocument.documentElement.append(t));

    const   slotCall = $(xslDom,'call-template[name="slot"]')
    ,       slot2xsl = s =>
    {   const v = slotCall.cloneNode(true)
        ,  name = attr(s,'name');
        name && v.firstElementChild.setAttribute('select',`'${ name }'`)
        for( let c of s.childNodes)
            v.lastElementChild.append(c)
        return v
    };

    forEach$( payload,'slot', s => s.parentNode.replaceChild( slot2xsl(s), s ) )

    const ret = tagUid(xslDom);
    mix( ret, { declaredAttributes, hardcodedAttributes, exposedAttributes } );
    return ret;
}
    export async function
xhrTemplate(src)
{
    const dom = await new Promise((resolve,reject)=>
    {   const xhr = new XMLHttpRequest();
        xhr.open("GET", src);
        xhr.responseType = "document";
        // xhr.overrideMimeType("text/xml");
        xhr.onload = () =>
        {   if( xhr.readyState === xhr.DONE && xhr.status === 200 )
                resolve( xhr.responseXML?.body || xhr.responseXML ||  create('div', xhr.responseText ) )
            else
                reject(`${xhr.statusText} - ${src}`)
        };
        xhr.addEventListener("error", ev=>reject(ev) );

        xhr.send();
    })
    return dom
}
    export function
deepEqual(a, b, O=false)
{
    if( a === b )
        return true;

    if( (typeof a !== "object" || a === null) || (typeof b !== "object" || b === null)
        || Object.keys(a).length !== Object.keys(b).length )
        return O;

    for( let k in a )
        if( !(k in b) || !deepEqual( a[k], b[k] ) )
            return O
    return true;
}
const splitSliceNames = v => v.split('|').map( s=>s.trim() ).filter(s=>s);

    export const
assureSlices = ( root, names) =>
    splitSliceNames(names).map( xp =>
    {   let d = root.ownerDocument
        , append = n=> (root.append(n),n);
        if(xp.includes('/'))
        {   const ret = [], r = d.evaluate( xp, root );
            for( let n; n = r.iterateNext(); )
                ret.push( n )
            return ret
        }
        return [...root.childNodes].find(n=>n.localName === xp) || append( create(xp,'',d) );
    }).flat();

/**
 *
 * @param x slice node
 * @param sliceNames slice name, xPath in /datadom/slice/
 * @param ev Event obj
 * @param dce
 */
    export function
event2slice( x, sliceNames, ev, dce )
{
    if( ev.sliceProcessed )
        return
    ev.sliceProcessed = 1;
    // evaluate slices[]
    // inject @attributes
    // inject event
    // evaluate slice-value
    // slice[i] = slice-value
    return assureSlices( x, sliceNames ?? '' ).map( s =>
    {
        const d = x.ownerDocument
        ,    el = ev.sliceEventSource
        ,   sel = ev.sliceElement
        ,   cleanSliceValue = ()=>[...s.childNodes].filter(n=>n.nodeType===3 || n.localName==='value' || n.localName==='form-data').map(n=>n.remove());
        el.getAttributeNames().map( a => s.setAttribute( a, attr(el,a) ) );
        [...s.childNodes].filter(n=>n.localName==='event').map(n=>n.remove());
        if( 'validationMessage' in el )
            s.setAttribute('validation-message', el.validationMessage);
        ev.type==='init' && cleanSliceValue();
        s.append( obj2node( ev, 'event', d ) );
        const notChecked = ( 'checkbox' === el.type || 'radio' === el.type ) && !el.checked ;
        if( sel.hasAttribute('slice-value') )
        {   if( el.value === undefined)
                s.removeAttribute('value')
            else
                s.setAttribute('value', el.value );
            const v = notChecked? '' : xPath( attr( sel, 'slice-value'),s );
            cleanSliceValue();
            s.append( createText( d, v ) );
        }else
        {   if( 'elements' in el )
            {   cleanSliceValue();
                s.append( obj2node(new FormData(el),'value', s.ownerDocument) )
                return s
            }

            const v = notChecked? '' : el.value ?? attr( el, 'value' );
            cleanSliceValue();
            if( v === null || v === undefined )
            {
                [...s.childNodes].filter(n=>n.localName!=='event').map(n=>n.remove());
                s.removeAttribute('value');
            }
            else
            {   const ve = isString(v) ? createText( d, v) : obj2node(v,'value',s.ownerDocument);
                s.append( ve );
                s.setAttribute('value',v);
            }
        }
        return s
    })
}

function forEach$( el, css, cb){
    if( el.querySelectorAll )
        [...el.querySelectorAll(css)].forEach(cb)
}
const loadTemplateRoots = async ( src, dce )=>
{
    if( !src || !src.trim() )
        return [dce]
    if( src.startsWith('#') )
        return ( n =>
        {   const a = n.querySelectorAll(src)
            return  [...( a.length ? a : n.getRootNode().querySelectorAll(src) )]
        })(dce.parentElement)
    try
    {   const [path, hash] = src.split('#');
        if( '.' === src.charAt(0))
            src = new URL(path, dce.closest('[base]')?.getAttribute('base') || location ).href;
        else
            try
            {   src = import.meta.resolve( path );
                if(hash)
                    src +='#'+hash;
            }
            catch( e )
                {   console.error(e.message) }
        // todo cache
        const dom = await xhrTemplate(src);
        dce.setAttributeNS('xml', 'base', src );

        if( hash )
        {   const ret = dom.querySelectorAll('#'+hash);
            if( ret.length )
                return [...ret];
            console.error('template not found',src+'#'+hash);
            return [dce]
        }
        return [dom]
    }catch (error){ return [dce]}
}
export function mergeAttr( from, to )
{   for( let a of from.attributes)
        try
        {   const name = a.name;
            if( name.startsWith('xmlns') )
                continue;
            if( a.namespaceURI )
            {   if( !to.hasAttributeNS(a.namespaceURI, name) || to.getAttributeNS(a.namespaceURI, name) !== a.value )
                    to.setAttributeNS( a.namespaceURI, name, a.value )
            }else
            {   if( !to.hasAttribute(name) || to.getAttribute(name) !== a.value )
                    to.setAttribute( a.name, a.value )
            }
            if( a.name === 'value')
                to.value = a.value
        }catch(e)
            { console.warn('attribute assignment error',e?.message || e); }
    const ea = to.dceExportedAttributes
        , aa = to.getAttribute('dce-exported-attributes')
        , em = aa ? new Set( aa.split(' ') ) : null;
    for( let a of to.getAttributeNames() )
        if( !from.hasAttribute(a) && !ea?.has(a) && !em?.has(a) )
            to.removeAttribute(a)
}
export function assureUnique(n, id=0)
{
    const m = {}
    for( const e of n.childNodes )
    {
        const a = attr(e,'data-dce-id') || e.dceId || 0;
        if( !m[a] )
        {   if( !a )
            {   m[a] = e.dceId = ++id;
                if( e.setAttribute )
                    e.setAttribute('data-dce-id', e.dceId )
            }else
                m[a] = 1;
        }else
        {   const v = e.dceId = a + '-' + m[a]++;
            if( e.setAttribute )
                e.setAttribute('data-dce-id', v )
        }
        e.childNodes.length && assureUnique(e)
    }
}
export function appendByDceId(parent,e,k)
{
    k = 1*k;
    for( let n of parent.childNodes )
        if( (n.dceId ?? n.getAttribute('data-dce-id')*1) > k )
            return parent.insertBefore(e,n);
    parent.append(e)
}
export function merge( parent, fromArr )
{
    if( 'dce-root' === parent.firstElementChild?.localName && 'dce-root' !== fromArr[0]?.localName)
        return;
    if( !fromArr.length )
        return 'dce-root' !== parent.firstElementChild?.localName && removeChildren(parent);

    const id2old = {};
    for( let c of parent.childNodes)
    {   ASSERT( !id2old[c.dceId] );
        if( isText(c) )
        {   ASSERT( c.data.trim() );
            id2old[c.dceId || 0] = c;
        } else
            id2old[attr(c, 'data-dce-id') || 0] = c;
    }
    for( let e of [...fromArr] )
    {   const k = attr(e, 'data-dce-id') || e.dceId;
        const o = id2old[ k ];
        if( o )
        {   if( isText(e) )
            {   if( o.nodeValue !== e.nodeValue )
                    o.nodeValue = e.nodeValue;
            }else
            {   mergeAttr(e,o)
                if( o.childNodes.length || e.childNodes.length )
                    merge(o, e.childNodes)
            }
            delete id2old[ k ]
        }else
            appendByDceId(parent,e,k)
    }
    for( let v of Object.values(id2old) )
        if( v.localName !== 'dce-root')
           v.remove();
}
export function assureUID(n,attr)
{   if( !n.hasAttribute(attr) )
        n.setAttribute(attr, crypto.randomUUID());
    return n.getAttribute(attr)
}
export const evalCurly = s =>
{   const exp = [...s?.matchAll( /([^{}]*)(\{)([^}]+)}([^{}]*)/g ) ].map(l=>`${l[1]}{${ xPathDefaults(l[3] )}}${l[4]}`);
    return exp.join('');
}
export const xPathDefaults = x=>
{   if(!x.trim())
        return x;
    const xx = x.split('??')
    ,      a = xx.shift()
    ,      b = xPathDefaults(xx.join('??'));

    return xx.length ? `concat( ${a} , substring( ${b} , (1+string-length( ${b} )) * string-length( ${a} ) ) )`: x
    // return xx.length ? `${a}|(${xPathDefaults(xx.join('??'))})[not(${a})]`: a
}
export const xPath = (x,root)=>
{
    const xx = x.split('??');
    if( xx.length > 1 )
        return xPath(xx[0], root) || xPath(xx[1], root);

    x = xPathDefaults(x);

    const it = root.ownerDocument.evaluate(x, root);
    switch( it.resultType )
    {   case XPathResult.NUMBER_TYPE: return it.numberValue;
        case XPathResult.STRING_TYPE: return it.stringValue;
        case XPathResult.BOOLEAN_TYPE: return it.booleanValue;
    }

    let ret = '';
    for( let n ;n=it.iterateNext(); )
        ret += n.textContent;
    return ret
}
export const xslTags = 'stylesheet,transform,import,include,strip-space,preserve-space,output,key,decimal-format,namespace-alias,value-of,copy-of,number,apply-templates,apply-imports,for-each,sort,if,choose,when,otherwise,attribute-set,call-template,with-param,variable,param,text,processing-instruction,element,attribute,comment,copy,message,fallback'.split(',');
export const toXsl = (el, defParent) => {
    const x = create('xsl:'+el.localName);
    for( let a of el.attributes )
        x.setAttribute( a.name, a.value );
    while(el.firstChild)
        x.append(el.firstChild);
    const replacement = el.localName === 'if' || el.localName === 'choose' ? (() => {
        const span = create('span');
        span.append(x);
        return span;
    })() : x;
    if( el.parentElement )
        el.parentElement.replaceChild( replacement, el );
    else
    {  const p = (el.parentElement || defParent)
        ,  arr = [...p.childNodes];
        arr.forEach((n, i) => {
            if (n === el)
                arr[i] = replacement;
        });
        p.replaceChildren(...arr);
    }
};

    export class
CustomElement extends HTMLElement
{
    static observedAttributes = ['src','tag','hidden'];
    async connectedCallback()
    {
        if(this.firstElementChild && this.firstElementChild.localName !== 'template')
            console.log('custom-element used without template wrapping content\n', this.outerHTML);
        const templateRoots = await loadTemplateRoots( attr( this, 'src' ), this )
        ,               tag = attr( this, 'tag' )
        ,           tagName = tag ? tag : 'dce-'+crypto.randomUUID();

        for( const t of templateRoots )
            forEach$(t.templateNode||t.content||t, 'style',s=>{
                const slot = s.closest('slot');
                const sName = slot ? `slot[name="${slot.name}"]`:'';
                s.innerHTML = `${tagName} ${sName}{${s.innerHTML}}`;
                this.append(s);
            })
        const templateDocs = templateRoots.map( n => createXsltFromDom( n ) )
        , xp = templateDocs.map( (td, p) =>
        {   p = new XSLTProcessor();
            try{ p.importStylesheet( td ) }
            catch( e )
                {   console.error(e, xmlString(td)) }
            return p
        })

        Object.defineProperty( this, "xsltString", { get: ()=>templateDocs.map( td => xmlString(td) ).join('\n') });

        const dce = this
        , sliceNodes = [...this.templateNode.querySelectorAll('[slice]')]
        , sliceNames = sliceNodes.map(e=>attr(e,'slice'))
                                .filter(n=>!n.includes('/'))
                                .filter((v, i, a)=>a.indexOf(v) === i)
                                .map(splitSliceNames).flat();

        const { declaredAttributes, hardcodedAttributes, exposedAttributes } = templateDocs[0];
        const dceExportedAttributes = new Set([...Object.keys(hardcodedAttributes), ...Object.keys(exposedAttributes)]);

        class DceElement extends HTMLElement
        {
            static get observedAttributes(){ return declaredAttributes; }
            #inTransform = 0;
            get dceExportedAttributes(){ return dceExportedAttributes; }
            connectedCallback()
            {   let payload = sanitizeBlankText(this.childNodes);
                if( this.firstElementChild?.tagName === 'TEMPLATE' )
                {
                    if( this.firstElementChild !== this.lastElementChild )
                        { console.error('payload should have TEMPLATE as only child', this.outerHTML ) }
                    const t = this.firstElementChild;
                    t.remove();
                    payload = sanitizeBlankText(t.content.childNodes);

                    for( const n of payload )
                        if( n.localName === 'style' ){
                            const id = assureUID(this,'data-dce-style')
                            n.innerHTML= `${tagName}[data-dce-style="${id}"]{${n.innerHTML}}`;
                            t.insertAdjacentElement('beforebegin',n);
                        }else
                            if(n.nodeType===1)
                                t.insertAdjacentElement('beforebegin',n);
                            else if(n.nodeType===3)
                                t.insertAdjacentText('beforebegin',n.data);
                }
                const x = xml2dom( '<datadom/>' ).documentElement;
                const createXmlNode = ( tag, t = '' ) => ( e =>
                {   if( t )
                        e.append( createText( x, t ))
                    return e;
                })(x.ownerDocument.createElement( tag ))
                const payloadNode = injectData( x, 'payload'    , payload , assureSlot );
                xslNs(payloadNode);
                xslHtmlNs(payloadNode);
                this.innerHTML='';
                const attrsRoot = injectData( x, 'attributes' , this.attributes, e => createXmlNode( e.nodeName, e.value ) )
                , inAttrs = a=> this.hasAttribute(a) || [...attrsRoot.children].find(e=>e.localName === a);
                mergeAttr( this, attrsRoot );
                Object.keys(hardcodedAttributes).map(a=> inAttrs(a) || attrsRoot.append(createXmlNode(a,hardcodedAttributes[a])) );
                Object.keys(exposedAttributes).map(a=> inAttrs(a) || attrsRoot.append(createXmlNode(a)) );

                injectData( x, 'dataset', Object.keys( this.dataset ), k => createXmlNode( k, this.dataset[ k ] ) );
                const sliceRoot = injectData( x, 'slice', sliceNames, k => createXmlNode( k, '' ) )
                ,     sliceXPath = x => xPath(x, sliceRoot);
                this.xml = x;

                const sliceEvents=[];
                const applySlices = ()=>
                {   const processed = {}

                    for(let ev; ev = sliceEvents.pop(); )
                    {   const s = attr( ev.sliceElement, 'slice');
                        if( processed[s] )
                            continue;
                        event2slice( sliceRoot, s, ev, this );
                        processed[s] = ev;
                    }
                    Object.keys(processed).length !== 0 && transform();
                }
                let timeoutID;

                this.onSlice = ev=>
                {   sliceEvents.push(ev);
                    if( !timeoutID )
                        timeoutID = setTimeout(()=>
                        {   applySlices();
                            timeoutID =0;
                        },1);
                };
                const transform = this.transform = ()=>
                {   if(this.#inTransform){ debugger }
                    this.#inTransform = 1;
                    const renderModel = ()=>
                    {
                        const ff = xp.map( (p,i) =>
                        {   const f = p.transformToFragment(x.ownerDocument, document)
                            if( !f )
                                console.error( "XSLT transformation error. xsl:\n", xmlString(templateDocs[i]), '\nxml:\n', xmlString(x) );
                            return f
                        });
                        ff.map( f =>
                        {   if( !f )
                                return;
                            assureUnique(f);
                            merge( this, f.childNodes )
                        })
                        let attrChangedCount = 0;
                        Object.entries(hardcodedAttributes).map(( [a,v] )=>
                        {   if( !this.hasAttribute(a) && v !== attr(this,a) )
                            {   this.setAttribute( a, v );
                                this.#applyAttribute( a, v );
                                attrChangedCount++;
                            }
                        });

                        Object.keys(exposedAttributes).map( a =>
                        {   let v = attr(this.firstElementChild,a);
                            if( v !== attr(this,a) )
                            {   this.setAttribute( a, v );
                                this.#applyAttribute( a, v );
                                attrChangedCount++;
                            }
                        });
                        return attrChangedCount;
                    };
                    if( renderModel() )
                        if( renderModel() )
                            console.warn("model update should not be the result of transform more than once");

                    function getSliceTarget(el)
                    {   let r = el;
                        if( el.localName === 'slice')
                        {   const ref= attr(el,'for');
                            if( !ref )
                                r = el.parentElement;
                            if( '^' === ref )
                            {   do r = r.previousElementSibling;
                                while( r.localName === 'slice' )
                            } else
                                r = this.querySelector(ref)

                            if( !r )
                                return console.warn(`can not find selector in "slice for=${ref}" `, el.outerHTML);
                            attr(el,'slice') || el.setAttribute('slice', attr(el,'name'))
                        }
                        return r;
                    }
                    forEach$( this,'[slice],[slice-event]', el =>
                    {   let evs = attr(el,'slice-event');
                        const sVal = el.hasAttribute('slice-value') || el.hasAttribute('value') || el.value;
                        const tgt = getSliceTarget(el);
                        if( !el.dceInitialized )
                        {   el.dceInitialized = 1;
                            if( tgt.hasAttribute('custom-validity') )
                                evs += ' change submit';

                            [...new Set((evs || 'change') .split(' '))]
                                .forEach( t=>
                                    tgt.addEventListener( t, ev=>
                                    {   ev.sliceElement = el;
                                        ev.sliceEventSource = ev.currentTarget || ev.target;
                                        ev.sliceProcessed = 0;
                                        const slices = event2slice( sliceRoot, attr( ev.sliceElement, 'slice'), ev, this );

                                        forEach$(this,'[custom-validity]',el =>
                                        {   if( !el.setCustomValidity )
                                                return;
                                            const x = attr( el, 'custom-validity' );
                                            try
                                            {   const v = x && xPath( x, attrsRoot );
                                                el.setCustomValidity( v === true? '': v === false ? 'invalid' : v );
                                            }catch(err)
                                                { console.error(err, 'xPath', x) }
                                        })
                                        const x = attr(tgt,'custom-validity')
                                        ,     v = x && xPath( x, attrsRoot )
                                        ,   msg = v === true? '' : v;

                                        if( x )
                                        {   el.setCustomValidity ? el.setCustomValidity( msg ) : ( el.validationMessage = msg );
                                            slices.map( s => s.setAttribute('validation-message', msg ) );
                                            if( ev.type === 'submit' )
                                            {   if( v === true )
                                                    return;
                                                setTimeout(transform,1)
                                                if( !!v === v )
                                                {   v || ev.preventDefault();
                                                    return v;
                                                }
                                                if( v )
                                                {   ev.preventDefault();
                                                    return !1
                                                }
                                                return ;
                                            }else
                                                setTimeout(transform,1)
                                        }
                                        this.onSlice(ev);
                                    } ));
                            if( !evs || evs.includes('init') )
                            {   if( sVal )
                                    this.onSlice({type:'init', target: tgt, sliceElement:el, sliceEventSource:tgt })
                                else
                                    el.value = sliceXPath( attr(el,'slice') )
                            }
                        }
                    });
                    this.#inTransform = 0;
                };
                transform();
                applySlices();
            }
            #applyAttribute(name, newValue)
            {   if( 'value' === name )
                    this.value = newValue;
                const attrs = this.xml.querySelector('attributes');
                let a = this.xml.querySelector(`attributes>${name}`);
                if( a )
                    emptyNode(a).append( createText(a,newValue) );
                else
                {   a = create( name, newValue, this.xml );
                    attrs.append( a );
                }
                this.#inTransform || attrs.setAttribute(name,newValue);

                this.dispatchEvent(new CustomEvent('change', { bubbles: true,detail: { [name]: newValue }}))
            }
            attributeChangedCallback(name, oldValue, newValue)
            {   if( !this.xml || this.#inTransform )
                    return;
                this.#applyAttribute(name, newValue);
                this.transform(); // needs throttling
            }

            get dce(){ return dce }
        }
        const registerTag = tag =>
        {
            if( window.customElements.get(tag) !== DceElement )
                window.customElements.define( tag, DceElement);
        };
        if(tag)
            registerTag(tag);
        else
        {   const t = tagName;
            this.setAttribute('tag', t );
            registerTag(t);
            const el = document.createElement(t);
            this.getAttributeNames().forEach(a=>el.setAttribute(a,this.getAttribute(a)));
            el.append(...[...this.childNodes].filter( e => e.localName!=='style') );
            this.append(el);
        }
    }
    get templateNode(){ return this.firstElementChild?.tagName === 'TEMPLATE'? this.firstElementChild.content : this }
    get dce(){ return this }

    get xslt(){ return xml2dom( this.xsltString ) }
}

window.customElements.define( 'custom-element', CustomElement );
export default CustomElement;

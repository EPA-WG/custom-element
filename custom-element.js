const XSL_NS_URL  = 'http://www.w3.org/1999/XSL/Transform'
,     HTML_NS_URL = 'http://www.w3.org/1999/xhtml'
,     EXSL_NS_URL = 'http://exslt.org/common'
,     DCE_NS_URL  ="urn:schemas-epa-wg:dce";

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const attr = (el, attr)=> el.getAttribute?.(attr)
,   isText = e => e.nodeType === 3
,   isString = s => typeof s === 'string'
,   isNode = e => e && typeof e.nodeType === 'number'
,   create = ( tag, t = '', d=document ) => ( e => ((t && e.append(createText(d.ownerDocument||d, t))),e) )((d.ownerDocument || d ).createElement( tag ))
,   createText = ( d, t) => (d.ownerDocument || d ).createTextNode( t )
,   removeChildren = n => { while(n.firstChild) n.firstChild.remove(); return n; }
,   emptyNode = n => {  n.getAttributeNames().map( a => n.removeAttribute(a) ); return removeChildren(n); }
,   createNS = ( ns, tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElementNS( ns, tag ))
,   xslNs = x => ( x?.setAttribute('xmlns:xsl', XSL_NS_URL ), x )
,   xslHtmlNs = x => ( x?.setAttribute('xmlns:xhtml', HTML_NS_URL ), xslNs(x) )
,   cloneAs = (p,tag) =>
{   const px = p.ownerDocument.createElementNS(p.namespaceURI,tag);
    for( let a of p.attributes)
        px.setAttribute(a.name, a.value);
    while( p.firstChild )
        px.append(p.firstChild);
    return px;
}

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

    export function
Json2Xml( o, tag )
{
    if( typeof o === 'string' )
        return o;

    const noTag = "string" != typeof tag;

    if( o instanceof Array )
    {   noTag &&  (tag = 'array');
        return "<"+tag+">"+o.map(function(el){ return Json2Xml(el,tag); }).join()+"</"+tag+">";
    }
    noTag &&  (tag = 'r');
    tag=tag.replace( /[^a-z0-9\-]/gi,'_' );
    var oo  = {}
        ,   ret = [ "<"+tag+" "];
    for( let k in o )
        if( typeof o[k] == "object" )
            oo[k] = o[k];
        else
            ret.push( k.replace( /[^a-z0-9\-]/gi,'_' ) + '="'+o[k].toString().replace(/&/gi,'&#38;')+'"');
    if( oo )
    {   ret.push(">");
        for( let k in oo )
            ret.push( Json2Xml( oo[k], k ) );
        ret.push("</"+tag+">");
    }else
        ret.push("/>");
    return ret.join('\n');
}

    export function
obj2node( o, tag, doc )
{   const t = typeof o;
    if( t === 'function'){debugger}
    if( t === 'string' )
        return create(tag,o,doc);
    if( t === 'number' )
        return create(tag,''+o,doc);

    if( o instanceof Array )
    {   const ret = create('array');
        o.map( ae => ret.append( obj2node(ae,tag,doc)) );
        return ret
    }
    const ret = create(tag,'',doc);
    for( let k in o )
        if( isNode(o[k]) || typeof o[k] ==='function' || o[k] instanceof Window )
            continue
        else
            if( typeof o[k] !== "object" )
                ret.setAttribute(k, o[k] );
            else
                ret.append(obj2node(o[k], k, doc))
    return ret;
}
    export function
tagUid( node )
{   // {} to xsl:value-of
    forEach$(node,'*',d => [...d.childNodes].filter( e=>e.nodeType === 3 ).forEach( e=>
    {   if( e.parentNode.localName === 'style' )
            return;
        const m = e.data.matchAll( /{([^}]*)}/g );
        if(m)
        {   let l = 0
            , txt = t => createText(e,t||'')
            ,  tt = [];
            [...m].forEach(t=>
            {   if( t.index > l )
                    tt.push( txt( t.input.substring( l, t.index ) ))
                const v = node.querySelector('value-of').cloneNode();
                v.setAttribute('select', t[1] );
                tt.push(v);
                l = t.index+t[0].length;
            })
            if( l < e.data.length)
                tt.push( txt( e.data.substring(l,e.data.length) ));
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
    if( templateNode.tagName === S || templateNode.documentElement?.tagName === S )
        return tagUid(templateNode)
    const sanitizeXsl = xml2dom(`<xsl:stylesheet version="1.0" xmlns:xsl="${ XSL_NS_URL }" xmlns:xhtml="${ HTML_NS_URL }" xmlns:exsl="${EXSL_NS_URL}" exclude-result-prefixes="exsl" >
        <xsl:output method="xml" />
        <xsl:template match="/"><dce-root xmlns="${ HTML_NS_URL }"><xsl:apply-templates select="*"/></dce-root></xsl:template>
        <xsl:template match="*[name()='template']"><xsl:apply-templates mode="sanitize" select="*|text()"/></xsl:template>
        <xsl:template match="*"><xsl:apply-templates mode="sanitize" select="*|text()"/></xsl:template>
        <xsl:template match="*[name()='svg']|*[name()='math']"><xsl:apply-templates mode="sanitize" select="."/></xsl:template>
        <xsl:template mode="sanitize" match="*[count(text())=1 and count(*)=0]"><xsl:copy><xsl:apply-templates mode="sanitize" select="@*"/><xsl:value-of select="text()"></xsl:value-of></xsl:copy></xsl:template>
        <xsl:template mode="sanitize" match="xhtml:*[count(text())=1 and count(*)=0]"><xsl:element name="{local-name()}"><xsl:apply-templates mode="sanitize" select="@*"/><xsl:value-of select="text()"></xsl:value-of></xsl:element></xsl:template>
        <xsl:template mode="sanitize" match="*|@*"><xsl:copy><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:copy></xsl:template>
        <xsl:template mode="sanitize" match="text()[normalize-space(.) = '']"/>
        <xsl:template mode="sanitize" match="text()"><dce-text><xsl:copy/></dce-text></xsl:template>
        <xsl:template mode="sanitize" match="xsl:value-of|*[name()='slot']"><dce-text><xsl:copy><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:copy></dce-text></xsl:template>
        <xsl:template mode="sanitize" match="xhtml:*"><xsl:element name="{local-name()}"><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:element></xsl:template>
    </xsl:stylesheet>`)
    const sanitizeProcessor = new XSLTProcessor()
    ,   tc = (n =>
        {
            forEach$(n,'script', s=> s.remove() );
            const xslRoot = n.content ?? n.firstElementChild?.content ?? n.body ?? n;
            xslTags.forEach( tag => forEach$( xslRoot, tag, el=>toXsl(el,xslRoot) ) );
            const e = n.firstElementChild?.content || n.content
            , asXmlNode = r => {
                const d = xml2dom( '<xhtml/>' )
                ,     n = d.importNode(r, true);
                d.replaceChild(n,d.documentElement);
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
    const params = [];
    [...fr.querySelectorAll('dce-root>attribute')].forEach( a=>
    {
        const p = cloneAs(a,'xsl:param')
        ,  name = attr(a,'name');
        payload.append(p);
        let select = attr(p,'select')?.split('??')
        if( !select)
        {   select = ['//'+name, `'${p.textContent}'`];
            emptyNode(p);
            p.setAttribute('name',name);
        }
        let val;
        if( select?.length>1 ){
            p.removeAttribute('select');
            const c = $( xslDom, 'template[match="ignore"]>choose').cloneNode(true);
            emptyNode(c.firstElementChild).append( createText(c,'{'+select[0]+'}'));
            emptyNode(c.lastElementChild ).append( createText(c,'{'+select[1]+'}'));
            c.firstElementChild.setAttribute('test',select[0]);
            p.append(c);
            val = c.cloneNode(true);
        }else
            val=cloneAs(a,'xsl:value-of');
        val.removeAttribute('name');
        a.append(val);
        a.removeAttribute('select');
        params.push(p)
    });
    [...fr.querySelectorAll('[value]')].filter(el=>el.getAttribute('value').match( /\{(.*)\?\?(.*)\}/g )).forEach(el=>
    {   const v = attr(el,'value');
        if(v)
            el.setAttribute('value', evalCurly(v));
    });
    for( const c of fr.childNodes )
        payload.append(xslDom.importNode(c,true))

    const embeddedTemplates = [...payload.querySelectorAll('template')];
    embeddedTemplates.forEach(t=>payload.ownerDocument.documentElement.append(t));

    const   slotCall = $(xslDom,'call-template[name="slot"]')
    ,       slot2xsl = s =>
    {   const v = slotCall.cloneNode(true)
        ,  name = attr(s,'name') || '';
        name && v.firstElementChild.setAttribute('select',`'${ name }'`)
        for( let c of s.childNodes)
            v.lastElementChild.append(c)
        return v
    }

    forEach$( payload,'slot', s => s.parentNode.replaceChild( slot2xsl(s), s ) )

    const ret = tagUid(xslDom)
    ret.params = params;
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
                resolve( xhr.responseXML ||  create('div', xhr.responseText ) )
            reject(xhr.statusText)
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
    export const
assureSlices = ( root, names) =>
    names.split('|').map(n=>n.trim()).map( xp =>
    {   if(xp.includes('/'))
        {   const ret = [], r = root.ownerDocument.evaluate( xp, root );
            for( let n; n = r.iterateNext(); )
                ret.push( n )
            return ret
        }
        return [...root.childNodes].find(n=>n.localName === xp) || create(xp);
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
    // evaluate slices[]
    // inject @attributes
    // inject event
    // evaluate slice-value
    // slice[i] = slice-value
    assureSlices(x,sliceNames).map( s =>
    {
        const d = x.ownerDocument
        ,    el = ev.sliceEventSource
        ,   sel = ev.sliceElement
        ,   cleanSliceValue = ()=>[...s.childNodes].filter(n=>n.nodeType===3 || n.localName==='value').map(n=>n.remove());
        el.getAttributeNames().map( a => s.setAttribute( a, attr(el,a) ) );
        [...s.childNodes].filter(n=>n.localName==='event').map(n=>n.remove());
        ev.type==='init' && cleanSliceValue();
        s.append( obj2node( ev, 'event', d ) );
        if( sel.hasAttribute('slice-value') )
        {   if( el.value === undefined)
                s.removeAttribute('value')
            else
                s.setAttribute('value', el.value );
            const v = xPath( attr( sel, 'slice-value'),s );
            cleanSliceValue();
            s.append( createText( d, v ) );
        }else
        {   const v = el.value ?? attr( sel, 'value' ) ;
            cleanSliceValue();
            if( v === null || v === undefined )
                [...s.childNodes].filter(n=>n.localName!=='event').map(n=>n.remove());
            else
                if( isString(v) )
                    s.append( createText( d, v) );
                else
                    s.append( obj2node(v,'value',s.ownerDocument) )
        }
    })
}

function forEach$( el, css, cb){
    if( el.querySelectorAll )
        [...el.querySelectorAll(css)].forEach(cb)
}
const getByHashId = ( n, id )=> ( p => n===p? null: (p && ( p.querySelector(id) || getByHashId(p,id) ) ))( n.getRootNode() )
const loadTemplateRoots = async ( src, dce )=>
{
    if( !src || !src.trim() )
        return [dce]
    if( src.startsWith('#') )
        return ( n =>
        {   if(!n) return []
            const a = n.querySelectorAll(src)
            if( a.length )
                return [...a]
            const r = n.getRootNode();
            return r===n ? []: getByHashId(r)
        })(dce.parentElement)
    try
    {   // todo cache
        const dom = await xhrTemplate(src)
        const hash = new URL(src, location).hash
        if( hash )
        {   const ret = dom.querySelectorAll(hash);
            if( ret.length )
                return [...ret]
            return [dce]
        }
        return [dom]
    }catch (error){ return [dce]}
}
export function mergeAttr( from, to )
{   if( isText(from) )
    {
        if( !isText(to) ){ debugger }
        return
    }
    for( let a of from.attributes)
    {   a.namespaceURI? to.setAttributeNS( a.namespaceURI, a.name, a.value ) : to.setAttribute( a.name, a.value )
        if( a.name === 'value')
            to.value = a.value
    }
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
export function merge( parent, fromArr )
{
    if(!fromArr.length)
        return removeChildren(parent);
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
            parent.append( e )
    }
    for( let v of Object.values(id2old) )
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
{   x = xPathDefaults(x);

    const it = root.ownerDocument.evaluate(x, root);
    switch( it.resultType )
    {   case XPathResult.NUMBER_TYPE: return it.numberValue;
        case XPathResult.STRING_TYPE: return it.stringValue;
    }

    let ret = '';
    for( let n ;n=it.iterateNext(); )
        ret += n.textContent;
    return ret
}
export const xslTags = 'stylesheet,transform,import,include,strip-space,preserve-space,output,key,decimal-format,namespace-alias,template,value-of,copy-of,number,apply-templates,apply-imports,for-each,sort,if,choose,when,otherwise,attribute-set,call-template,with-param,variable,param,text,processing-instruction,element,attribute,comment,copy,message,fallback'.split(',');
export const toXsl = (el, defParent) => {
    const x = create('xsl:'+el.localName);
    for( let a of el.attributes )
        x.setAttribute( a.name, a.value );
    while(el.firstChild)
        x.append(el.firstChild);
    if( el.parentElement )
        el.parentElement.replaceChild( x, el );
    else
    {  const p = (el.parentElement || defParent)
        ,  arr = [...p.childNodes];
        arr.forEach((n, i) => {
            if (n === el)
                arr[i] = x;
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
        , xp = templateDocs.map( (td, p) =>{ p = new XSLTProcessor(); p.importStylesheet( td ); return p })

        Object.defineProperty( this, "xsltString", { get: ()=>templateDocs.map( td => xmlString(td) ).join('\n') });

        const dce = this
        , sliceNodes = [...this.templateNode.querySelectorAll('[slice]')]
        , sliceNames = sliceNodes.map(e=>attr(e,'slice')).filter(n=>!n.includes('/')).filter((v, i, a)=>a.indexOf(v) === i)
        , declaredAttributes = templateDocs.reduce( (ret,t) => { if( t.params ) ret.push( ...t.params ); return ret; }, [] );

        class DceElement extends HTMLElement
        {
            static get observedAttributes(){ return declaredAttributes.map( a=>attr(a,'name')); }
            #inTransform = 0;
            connectedCallback()
            {   let payload = this.childNodes;
                if( this.firstElementChild?.tagName === 'TEMPLATE' )
                {
                    const t = this.firstElementChild;
                    t.remove();
                    payload = t.content.childNodes;

                    for( const n of [...t.content.childNodes] )
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
                injectData( x, 'payload'    , payload , assureSlot );
                this.innerHTML='';
                injectData( x, 'attributes' , this.attributes, e => createXmlNode( e.nodeName, e.value ) );
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
                {   ev.stopPropagation?.();
                    ev.sliceEventSource = ev.currentTarget || ev.target;
                    sliceEvents.push(ev);
                    if( !timeoutID )
                        timeoutID = setTimeout(()=>
                        {   applySlices();
                            timeoutID =0;
                        },10);
                };
                const transform = this.transform = ()=>
                {   if(this.#inTransform){ debugger }
                    this.#inTransform = 1;

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

                    DceElement.observedAttributes.map( a =>
                    {   let v = attr(this.firstElementChild,a);
                        if( v !== attr(this,a) )
                        {   this.setAttribute( a, v );
                            this.#applyAttribute( a, v );
                        }
                    })

                    forEach$( this,'[slice]', el =>
                    {   if( !el.dceInitialized )
                        {   el.dceInitialized = 1;
                            const evs = attr(el,'slice-event');
                            (evs || 'change')
                                .split(' ')
                                .forEach( t=> (el.localName==='slice'? el.parentElement : el)
                                                .addEventListener( t, ev=>
                                                {   ev.sliceElement = el;
                                                    this.onSlice(ev)
                                                } ));
                            if( !evs || evs.includes('init') )
                            {   if( el.hasAttribute('slice-value') || el.hasAttribute('value') || el.value )
                                    this.onSlice({type:'init', target: el, sliceElement:el })
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
            {   let a = this.xml.querySelector(`attributes>${name}`);
                if( a )
                    emptyNode(a).append( createText(a,newValue) );
                else
                {   a = create( name, newValue, this.xml );
                    this.xml.querySelector('attributes').append( a );
                }
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

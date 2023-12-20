const XSL_NS_URL  = 'http://www.w3.org/1999/XSL/Transform'
,     HTML_NS_URL = 'http://www.w3.org/1999/xhtml'
,     DCE_NS_URL  ="urn:schemas-epa-wg:dce";

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const attr = (el, attr)=> el.getAttribute?.(attr)
,   create = ( tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElement( tag ))
,   createNS = ( ns, tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElementNS( ns, tag ))
,   xslNs = x => ( x?.setAttribute('xmlns:xsl', XSL_NS_URL ), x )
,   xslHtmlNs = x => ( x?.setAttribute('xmlns:xhtml', HTML_NS_URL ), xslNs(x) );

    function
xml2dom( xmlString )
{
    return new DOMParser().parseFromString( xmlString, "application/xml" )
}
    function
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
tagUid( node )
{
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
    const sanitizeXsl = xml2dom(`<xsl:stylesheet version="1.0" xmlns:xsl="${ XSL_NS_URL }" xmlns:xhtml="${ HTML_NS_URL }" exclude-result-prefixes="exsl" >   
        <xsl:output method="xml" />
        <xsl:template match="/"><xsl:apply-templates select="*"/></xsl:template>
        <xsl:template match="*[name()='template']"><xsl:apply-templates mode="sanitize" select="*|text()"/></xsl:template>
        <xsl:template match="*"><xsl:apply-templates mode="sanitize" select="*|text()"/></xsl:template>
        <xsl:template match="*[name()='svg']|*[name()='math']"><xsl:apply-templates mode="sanitize" select="."/></xsl:template>
        <xsl:template mode="sanitize" match="*[count(text())=1 and count(*)=0]"><xsl:copy><xsl:apply-templates mode="sanitize" select="@*"/><xsl:value-of select="text()"/></xsl:copy></xsl:template>
        <xsl:template mode="sanitize" match="*|@*"><xsl:copy><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:copy></xsl:template>
        <xsl:template mode="sanitize" match="text()[normalize-space(.) = '']"></xsl:template>
        <xsl:template mode="sanitize" match="text()"><dce-text><xsl:copy/></dce-text></xsl:template>
        <xsl:template mode="sanitize" match="xsl:value-of|*[name()='slot']"><dce-text><xsl:copy><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:copy></dce-text></xsl:template>
        <xsl:template mode="sanitize" match="xhtml:*"><xsl:element name="{local-name()}"><xsl:apply-templates mode="sanitize" select="*|@*|text()"/></xsl:element></xsl:template>
    </xsl:stylesheet>`)
    const sanitizeProcessor = new XSLTProcessor()
    ,   tc = (n =>
        {   const e = n.firstElementChild?.content || n.content;
            if( e )
            {   const t = create('div');
                [ ...e.childNodes ].map( c => t.append(c.cloneNode(true)) )
                return xslHtmlNs(t)
            }
            return  xslHtmlNs(n.documentElement || n.body || n)
        })(templateNode)
    ,   dom = xml2dom(
        `<xsl:stylesheet version="1.0"
        xmlns:xsl="${ XSL_NS_URL }"
        xmlns:dce="urn:schemas-epa-wg:dce"
        xmlns:exsl="http://exslt.org/common"
        exclude-result-prefixes="exsl"
    >
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
    ,   payload = $( dom, 'template[mode="payload"]');
    if( !fr )
        return console.error("transformation error",{ xml:tc.outerHTML, xsl: xmlString( sanitizeXsl ) });

    for( const c of fr.childNodes )
        payload.append(dom.importNode(c,true))

    const   slotCall = $(dom,'call-template[name="slot"]')
    ,       slot2xsl = s =>
    {   const v = slotCall.cloneNode(true)
        ,  name = attr(s,'name') || '';
        name && v.firstElementChild.setAttribute('select',`'${ name }'`)
        for( let c of s.childNodes)
            v.lastElementChild.append(c)
        return v
    }

    forEach$( payload,'slot', s => s.parentNode.replaceChild( slot2xsl(s), s ) )

    return tagUid(dom)
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

    export function
injectSlice( x, s, data )
{
    const isString = typeof data === 'string' ;
    const createXmlNode = ( tag, t = '' ) => ( e => ((e.append( x.ownerDocument.createTextNode(t||''))),e) )(x.ownerDocument.createElement( tag ))
    const el = isString
        ? createXmlNode(s, data)
        : document.adoptNode( xml2dom( Json2Xml( data, s ) ).documentElement);
    [...x.children].filter( e=>e.localName === s ).map( el=>el.remove() );
    el.data = data
        x.append(el);
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
{
    for( let a of from.attributes)
        a.namespaceURI? to.setAttributeNS( a.namespaceURI, a.name, a.value ) : to.setAttribute( a.name, a.value )
}
export function assureUnique(n, id=0)
{
    const m = {}
    for( const e of n.childNodes )
    {   const a = attr(e,'data-dce-id') || e.dceId || 0;
        if( !m[a] )
            m[a] = e.dceId = ++id;
        else {
            const v = a + '-' + m[a]++;
            if( e.setAttribute )
                e.setAttribute('data-dce-id', v )
            else
                e.dceId = v
        }
        assureUnique(e)
    }
}
export function merge( parent, fromArr )
{
    const id2old = {};
    for( let c of parent.childNodes)
        id2old[ attr(c,'data-dce-id') || c.dceId || 0 ] = c;

    for( let e of [...fromArr] )
    {   const o = id2old[ attr(e, 'data-dce-id') || e.dceId ];
        if( o )
        {   if( e.setAttribute )
            {   mergeAttr(o,e)
                if( o.childNodes.length || e.childNodes.length )
                    merge(o, e.childNodes)
            }else // text
                if( o.nodeValue !== e.nodeValue )
                    o.nodeValue = e.nodeValue;
        }else
            parent.append( e )
    }
}

    export class
CustomElement extends HTMLElement
{
    async connectedCallback()
    {
        const templateRoots = await loadTemplateRoots( attr( this, 'src' ), this )
        , templateDocs = templateRoots.map( n => createXsltFromDom( n ) )
        , xp = templateDocs.map( (td, p) =>{ p = new XSLTProcessor(); p.importStylesheet( td ); return p })

        Object.defineProperty( this, "xsltString", { get: ()=>templateDocs.map( td => xmlString(td) ).join('\n') });

        const tag = attr( this, 'tag' );
        const dce = this;
        const sliceNames = [...this.templateNode.querySelectorAll('[slice]')].map(e=>attr(e,'slice'));
        class DceElement extends HTMLElement
        {
            connectedCallback()
            {   const x = xml2dom( '<datadom/>' ).documentElement;
                const createXmlNode = ( tag, t = '' ) => ( e =>
                {   if( t )
                        e.append(x.ownerDocument.createTextNode( t ))
                    return e;
                })(x.ownerDocument.createElement( tag ))
                injectData( x, 'payload'    , this.childNodes, assureSlot );
                this.innerHTML='';
                injectData( x, 'attributes' , this.attributes, e => createXmlNode( e.nodeName, e.value ) );
                injectData( x, 'dataset', Object.keys( this.dataset ), k => createXmlNode( k, this.dataset[ k ] ) );
                const sliceRoot = injectData( x, 'slice', sliceNames, k => createXmlNode( k, '' ) );
                this.xml = x;

                const sliceEvents=[];
                const applySlices = ()=>
                {   const processed = {}

                    for(let ev; ev =  sliceEvents.pop(); )
                    {   const s = attr( ev.target, 'slice');
                        if( processed[s] )
                            continue;
                        injectSlice( sliceRoot, s, ev.detail );
                        processed[s] = ev;
                    }
                    Object.keys(processed).length !== 0 && transform();
                }
                let timeoutID;

                this.onSlice = ev=>
                {   ev.stopPropagation?.();
                    const s = attr( ev.target, 'slice')
                    if( deepEqual( ev.detail, [...sliceRoot.children].find( e=>e.localName === s )?.data ) )
                        return

                    sliceEvents.push(ev);
                    if( !timeoutID )
                        timeoutID = setTimeout(()=>
                        {   applySlices();
                            timeoutID =0;
                        },10);
                };
                const transform = ()=>
                {
                    const ff = xp.map( (p,i) =>
                    {   const f = p.transformToFragment(x, document)
                        if( !f )
                            console.error( "XSLT transformation error. xsl:\n", xmlString(templateDocs[i]), '\nxml:\n', xmlString(x) );
                        return f
                    });
                    ff.map( f =>
                    {   if( !f )
                            return;
                        assureUnique(f)
                        merge( this, f.childNodes )
                    })
                    const changeCb = el=>this.onSlice({ detail: el[attr(el,'slice-prop') || 'value'], target: el })
                    , hasInitValue = el => el.hasAttribute('slice-prop') || el.hasAttribute('value') || el.value;

                    forEach$( this,'[slice]', el =>
                    {   if( !el.dceInitialized )
                        {   el.dceInitialized = 1;
                            el.addEventListener( attr(el,'slice-update')|| 'change', ()=>changeCb(el) )
                            if( hasInitValue(el) )
                                changeCb(el)
                        }
                    })
                };
                transform();
                applySlices();
            }
            get dce(){ return dce }
        }
        if(tag)
            window.customElements.define( tag, DceElement);
        else
        {   const t = 'dce-'+crypto.randomUUID()
            window.customElements.define( t, DceElement);
            const el = document.createElement(t);
            this.getAttributeNames().forEach(a=>el.setAttribute(a,this.getAttribute(a)));
            el.append(...this.childNodes)
            this.append(el);
        }
    }
    get templateNode(){ return this.firstElementChild?.tagName === 'TEMPLATE'? this.firstElementChild.content : this }
    get dce(){ return this }

    get xslt(){ return xml2dom( this.xsltString ) }
}

window.customElements.define( 'custom-element', CustomElement );
export default CustomElement;

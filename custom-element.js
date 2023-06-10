const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
,          XSL_NS_URL = 'http://www.w3.org/1999/XSL/Transform'
,          DCE_NS_URL ="urn:schemas-epa-wg:dce";

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const attr = (el, attr)=> el.getAttribute(attr)
,   create = ( tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElement( tag ))
,   createNS = ( ns, tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElementNS( ns, tag ));

    function
xml2dom( xmlString )
{
    return new DOMParser().parseFromString( XML_DECLARATION + xmlString, "application/xml" )
}
    function
xmlString(doc){ return new XMLSerializer().serializeToString( doc ) }

    function
injectData( root, sectionName, arr, cb )
{
    const inject = ( tag, parent, s ) =>
    {
        parent.append( s = createNS( DCE_NS_URL, tag ) );
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
createXsltFromDom(templateNode, hash, dce)
{
    if( templateNode.documentElement?.tagName === 'xsl:stylesheet' )
        return templateNode
    const dom = xml2dom(
`<xsl:stylesheet version="1.0"
    xmlns:xsl="${ XSL_NS_URL }"
    >
    <xsl:output method="html" />

    <xsl:template match="/">
        <xsl:for-each select="//attributes">
            <xsl:call-template name="attributes"/>\t
        </xsl:for-each>
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
    <xsl:template name="attributes"></xsl:template>
    <xsl:variable name="slottemplate">
        <xsl:call-template name="slot" >
            <xsl:with-param name="slotname" select="''"/>
            <xsl:with-param name="defaultvalue"/>
        </xsl:call-template>
    </xsl:variable>
</xsl:stylesheet>`
    );

    const attrsTemplate = dom.documentElement.lastElementChild.previousElementSibling
    , getTemplateRoot = n => n?.firstElementChild?.content || n.content || n.body || n
    , tc = getTemplateRoot(templateNode)
    , cc = ( n =>
        {   if( hash && tc.querySelector)
            {   if( n = tc.querySelector(hash) )
                    return [n]
                return getTemplateRoot(dce) ?.childNodes || []
            }
        })() || tc?.childNodes || [];

    for( let c of cc )
        attrsTemplate.appendChild(dom.importNode(c,true))

    const slot2xsl = s =>
    {   const v = dom.firstElementChild.lastElementChild.lastElementChild.cloneNode(true);
        v.firstElementChild.setAttribute('select',`'${s.name}'`)
        for( let c of s.childNodes)
            v.lastElementChild.appendChild(c)
        return v
    }

    for( const s of attrsTemplate.querySelectorAll('slot') )
        s.parentNode.replaceChild( slot2xsl(s), s )

    // apply bodyXml changes
    return dom
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

    const el = isString
        ? create(s, data)
        : document.adoptNode( xml2dom( Json2Xml( data, s ) ).documentElement);
    [...x.children].filter( e=>e.localName === s ).map( el=>el.remove() );
    el.data = data
        x.append(el);
}

function forEach$( el, css, cb){
    if( el.querySelectorAll )
        for( let n of el.querySelectorAll(css) )
            cb(n)
}
const getByHashId = ( n, id )=> ( p => n===p? null: (p && ( p.querySelector(id) || getByHashId(p,id) ) ))( n.getRootNode() )


    export class
CustomElement extends HTMLElement
{
    async connectedCallback()
    {
        let src = attr( this, 'src' )
        , hash =  src.startsWith('#') ? '' : src?.substring && src.substring( src.indexOf('#') )
        , getTemplateDom = async ()=>
            {   try{ return await xhrTemplate(src) }
                catch(e){ hash = '' }
                return this
            }
        ,  xslDom = src
                ? ( src.startsWith('#')
                    ? getByHashId( this, src)
                    : await getTemplateDom() )
                : ( this.children.length===1 && this.firstElementChild.tagName ==='TEMPLATE'
                    ? this.firstElementChild
                    : this)
        , templateDoc = createXsltFromDom( xslDom, hash, this );

        Object.defineProperty( this, "xsltString", { get: ()=>xmlString(templateDoc) });

        const p = new XSLTProcessor();
        p.importStylesheet( templateDoc );
        const tag = attr( this, 'tag' );
        const dce = this;
        const sliceNames = [...this.templateNode.querySelectorAll('[slice]')].map(e=>attr(e,'slice'));
        class DceElement extends HTMLElement
        {
            connectedCallback()
            {   const x = createNS( DCE_NS_URL,'datadom' );
                injectData( x, 'payload'    , this.childNodes, assureSlot );
                injectData( x, 'attributes' , this.attributes, e => create( e.nodeName, e.value ) );
                injectData( x, 'dataset', Object.keys( this.dataset ), k => create( k, this.dataset[ k ] ) );
                const sliceRoot = injectData( x, 'slice', sliceNames, k => create( k, '' ) );
                this.xml = x;
                const slices = {};


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
                    const f = p.transformToFragment( x, document );
                    this.innerHTML = '';
                    [ ...f.childNodes ].forEach( e => this.appendChild( e ) );

                    forEach$(this,'[slice]', el=>
                    {   if( 'function' === typeof el.sliceInit )
                        {   const s = attr(el,'slice');
                            slices[s] = el.sliceInit( slices[s] );
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

            [ ...this.childNodes ].forEach( e => el.appendChild( e ) );
            this.appendChild(el);
        }
    }
    get templateNode(){ return this.firstElementChild?.tagName === 'TEMPLATE'? this.firstElementChild.content : this }
    get dce(){ return this }

    get xslt(){ return xml2dom( this.xsltString ) }
}

window.customElements.define( 'custom-element', CustomElement );
export default CustomElement;

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
,     XSL_NS_URL      = 'http://www.w3.org/1999/XSL/Transform';

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const attr = (el, attr)=> el.getAttribute(attr)
,   create = ( tag, t = '' ) => ( e => ((e.innerText = t||''),e) )(document.createElement( tag ));

    function
xml2dom( xmlString )
{
    return new DOMParser().parseFromString( XML_DECLARATION + xmlString, "application/xml" )
}

    function
bodyXml( dce )
{
    const t = dce.firstElementChild
    , sanitize = s => s.replaceAll("<html:","<")
                       .replaceAll("</html:","</")
                       .replaceAll( />\s*<\/xsl:value-of>/g ,"/>")
                       .replaceAll( />\s*<\/(br|hr|img|area|base|col|embed|input|link|meta|param|source|track|wbr)>/g ,"/>");
    if( t?.tagName === 'TEMPLATE')
        return sanitize( new XMLSerializer().serializeToString( t.content ) );

    const s = new XMLSerializer().serializeToString( dce );
    return sanitize( s.substring( s.indexOf( '>' ) + 1, s.lastIndexOf( '<' ) ) );
}

    function
slot2xsl( s )
{
    const v = document.createElementNS( XSL_NS_URL, 'value-of' );
    v.setAttribute( 'select', `//*[@slot="${ s.name }"]` );
    s.parentNode.replaceChild( v, s );
}

    function
injectData( root, sectionName, arr, cb )
{
    const inject = ( tag, parent, s ) =>
    {
        parent.append( s = create( tag ) );
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

    function
injectSlice( x, s, data )
{
    const isString = typeof data === 'string' ;

    const el = isString
        ? create(s, data)
        : document.adoptNode( xml2dom( Json2Xml( data, s ) ).documentElement);
    [...x.children].filter( e=>e.localName === s ).map( el=>el.remove() );
        x.append(el);
}

    export class
CustomElement extends HTMLElement
{
    constructor()
    {
        super();

        [ ...this.templateNode.querySelectorAll('slot') ].forEach( slot2xsl );
        const p = new XSLTProcessor();
        p.importStylesheet( this.xslt );
        const tag = attr( this, 'tag' );
        const dce = this;
        const sliceNames = [...this.templateNode.querySelectorAll('[slice]')].map(e=>attr(e,'slice'));
        tag && window.customElements.define( tag, class extends HTMLElement
        {
            constructor()
            {
                super();
                const x = create( 'div' );
                injectData( x, 'payload', this.childNodes, assureSlot );
                injectData( x, 'attributes', this.attributes, e => create( e.nodeName, e.value ) );
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

                    for( let el of this.querySelectorAll('[slice]') )
                        if( 'function' === typeof el.sliceInit )
                        {   const s = attr(el,'slice');
                            slices[s] = el.sliceInit( slices[s] );
                        }
                };
                transform();
                applySlices();
            }
            get dce(){ return dce;}
        } );
    }
    get templateNode(){ return this.firstElementChild?.tagName === 'TEMPLATE'? this.firstElementChild.content : this }
    get dce(){ return this;}
    get xsltString()
    {
        return (
`<xsl:stylesheet version="1.0"
    xmlns:xsl="${ XSL_NS_URL }">
  <xsl:output method="html" />

  <xsl:template match="/">
    <xsl:apply-templates select="//attributes"/>
  </xsl:template>
  <xsl:template match="attributes">
    ${ bodyXml( this ) }
  </xsl:template>

</xsl:stylesheet>` );
    }
    get xslt(){ return xml2dom( this.xsltString ); }
}

window.customElements.define( 'custom-element', CustomElement );
export default CustomElement;

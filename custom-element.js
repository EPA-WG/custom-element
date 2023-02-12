const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
    , XSL_NS_URL      = 'http://www.w3.org/1999/XSL/Transform';

// const log = x => console.debug( new XMLSerializer().serializeToString( x ) );

const create = ( tag, t = '' ) =>
{
    const e = document.createElement( tag );
    if( t ) e.innerText = t;
    return e;
}
const attr = (el, attr)=> el.getAttribute(attr);

function xml2dom( xmlString )
{
    return new DOMParser().parseFromString( XML_DECLARATION + xmlString, "application/xml" )
}

function bodyXml( dce )
{
    const s = new XMLSerializer().serializeToString( dce );
    return s.substring( s.indexOf( '>' ) + 1, s.lastIndexOf( '<' ) )
        .replaceAll("<html:","<")
        .replaceAll("</html:","</");
}

function slot2xsl( s )
{
    const v = document.createElementNS( XSL_NS_URL, 'value-of' );
    v.setAttribute( 'select', `//*[@slot="${ s.name }"]` );
    s.parentNode.replaceChild( v, s );
}

function injectData( root, sectionName, arr, cb )
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

function assureSlot( e )
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
    tag=tag.replace( /[^a-z0-9]/gi,'_' );
    var oo  = {}
        ,   ret = [ "<"+tag+" "];
    for( var k in o )
        if( typeof o[k] == "object" )
            oo[k] = o[k];
        else
            ret.push( k.replace( /[^a-z0-9]/gi,'_' ) + '="'+o[k].toString().replace(/&/gi,'&#38;')+'"');
    if( oo )
    {   ret.push(">");
        for( var k in oo )
            ret.push( Json2Xml( oo[k], k ) );
        ret.push("</"+tag+">");
    }else
        ret.push("/>");
    return ret.join('\n');
}
function injectSlice( x, s, data )
{
    const   el = create(s)
    , isString = typeof data === 'string' ;
    el.innerHTML = isString? data : Json2Xml( data, s );
    const slice = isString? el : el.firstChild;
    const d = [...x.children].find( e=>e.localName === s )?.remove();
    if( d )
        d.replaceWith( slice );
    else
        x.append(slice);
}

export class CustomElement extends HTMLElement
{
    constructor()
    {
        super();

        [ ...this.getElementsByTagName( 'slot' ) ].forEach( slot2xsl );
        const p = new XSLTProcessor();
        p.importStylesheet( this.xslt );
        const tag = attr( this, 'tag' );
        const dce = this;
        const sliceNames = [...this.querySelectorAll('[slice]')].map(e=>attr(e,'slice'));
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
                {   if( sliceEvents.length )
                    {   sliceEvents.forEach( ev=> injectSlice( sliceRoot, attr( ev.target, 'slice'), ev.detail ) );
                        transform();
                        sliceEvents.length = 0;
                    }
                }
                let timeoutID;
                this.addEventListener('loadend', ev=>
                {   ev.stopPropagation();
                    sliceEvents.push(ev);

                    if( !timeoutID )
                        timeoutID = setTimeout(()=>
                        {   applySlices();
                            timeoutID =0;
                        })
                });
                const transform = ()=>
                {
                    const f = p.transformToFragment( x, document );
                    this.innerHTML = '';
                    [ ...f.childNodes ].forEach( e => this.appendChild( e ) );
                };
                transform();
                for( let el of this.querySelectorAll('[slice]') )
                    if( 'function' === typeof el.sliceInit )
                    {   const s = attr(el,'slice');
                        slices[s] = el.sliceInit( slices[s] );
                    }
                applySlices();
            }
            get dce(){ return dce;}
        } );
    }
    get dce(){ return this;}
    get xslt()
    {
        return xml2dom(
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
}

window.customElements.define( 'custom-element', CustomElement );
export default CustomElement;

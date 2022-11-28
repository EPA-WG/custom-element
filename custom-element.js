const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
, XSL_NS_URL = 'http://www.w3.org/1999/XSL/Transform';

export const log =
{   string: s => console.debug( s ),
    xml: x => console.debug( x, { xml: new XMLSerializer().serializeToString( x ) } )
};
const create = ( tag, t='' ) =>
{
    const e = document.createElement( tag );
    if(t) e.innerText = t;
    return e;
}
function xml2dom( xmlString )
{
    return new DOMParser().parseFromString( XML_DECLARATION + xmlString, "application/xml" )
}
function bodyXml( dce )
{   const s = new XMLSerializer().serializeToString( dce );
    return s.substring( s.indexOf( '>' ) + 1, s.lastIndexOf( '<' ) );
}
function slot2xsl( s )
{   const v = document.createElementNS( XSL_NS_URL, 'value-of' );
    v.setAttribute( 'select', `//*[@slot="${ s.name }"]` );
    s.parentNode.replaceChild( v, s );
}
function injectData( root, sectionName, arr, cb  )
{
    const create = tag => document.createElement( tag );
    const inject = ( tag, parent, s ) =>
                {
                    parent.append( s = create( tag ) );
                    return s;
                };
    const l = inject( sectionName, root );
    [ ...arr ].forEach( e => l.append( cb(e) ) );
}

class CustomElement extends HTMLElement
{
    constructor()
    {   super();

        [ ...this.getElementsByTagName( 'slot' ) ].forEach( slot2xsl );
        const p = new XSLTProcessor();
        p.importStylesheet( xml2dom( `<xsl:stylesheet version="1.0"
    xmlns:xsl="${XSL_NS_URL}">
  <xsl:output method="html" />

  <xsl:template match="/">
    <xsl:apply-templates select="//attributes"/>
  </xsl:template>
  <xsl:template match="attributes">
    ${ bodyXml(this) }
  </xsl:template>

</xsl:stylesheet>` ) );

        class CustomTag extends HTMLElement
        {
            constructor()
            {
                super();
                const x = create( 'div' );
                injectData( x, 'payload'    , this.childNodes, e=>e  );
                injectData( x, 'attributes' , this.attributes, e=>create( e.nodeName, e.value ) );
                injectData( x, 'dataset'    , Object.keys( this.dataset ), k=>create( k, this.dataset[ k ] )  );
                const f = p.transformToFragment( x, document );
                this.innerHTML = '';
                [...f.childNodes].forEach(e=>this.appendChild(e));
            }
        }

        window.customElements.define( this.getAttribute( 'tag' ), CustomTag );
    }
}

window.customElements.define( 'custom-element', CustomElement );

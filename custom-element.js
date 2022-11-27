const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

export const log = { string: s=>console.debug(s), xml: x=>console.debug(x, {xml:new XMLSerializer().serializeToString(x)}) };

function xml2dom( xmlString )
{
    log.string({xmlString});
    return new DOMParser().parseFromString( XML_DECLARATION+xmlString, "application/xml" )
}
class CustomElement extends HTMLElement
{
    constructor()
    {   super();
        const tag = this.getAttribute('tag');
        [...this.getElementsByTagName('slot')].forEach( s=>
        {   const v= document.createElementNS("http://www.w3.org/1999/XSL/Transform",'value-of');
            v.setAttribute('select',`/*/payload/*[@slot="${s.name}"]`);
            s.parentNode.replaceChild(v,s);
        });
        const p = new XSLTProcessor();
        const body = new XMLSerializer().serializeToString(this);
        let inset = body.substring( body.indexOf('>')+1, body.lastIndexOf('<') );
        p.importStylesheet(xml2dom( `<xsl:stylesheet version="1.0"
                   xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" />

  <xsl:template match="/">
    <xsl:apply-templates select="//attributes"/>
  </xsl:template>
  <xsl:template match="attributes">
    ${inset}
  </xsl:template>

  <xsl:template match="@*|node()">
      <xsl:copy>
        <xsl:apply-templates select="@*|node()"/>
      </xsl:copy>
  </xsl:template>
</xsl:stylesheet>` ));

        class CustomTag extends HTMLElement
        {
            constructor()
            {
                super();
                const create = tag=> document.createElement(tag);
                const text = (tag,t)=>{
                    const e = create(tag);
                    e.innerText = t;
                    return e;
                }
                const inject = (tag, parent,s) =>
                {   parent.append(s = create(tag));
                    return s;
                };
                const s = create('div');
                const l = inject('payload',s);
                [...this.childNodes].forEach( e=>l.append(e));
                const a = inject('attributes',s);
                [...this.attributes].forEach( e=>a.append(text(e.nodeName,e.value)));
                const d = inject('dataset',s);
                Object.keys(this.dataset).forEach( k=>d.append(text( k,this.dataset[k] )));

                log.xml( s);
                const fragment = p.transformToFragment(s, document);
                this.innerHTML='';
                this.appendChild(fragment);
            }
        }
        window.customElements.define( tag, CustomTag);
    }
}
window.customElements.define( 'custom-element', CustomElement);

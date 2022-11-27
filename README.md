# custom-element
`Declarative Custom Element` proof of concept as a part of [WCCG in Declarative custom elements](https://github.com/w3c/webcomponents-cg/issues/32#issuecomment-1321037301) 
discussion.

# Implementation notes
## Life cycle
### `custom-element` declaration
* constructor injects payload into XSL template
* creates a class for custom element extending HTMLElement
* registers element by `tag` attribute

NOTE: attempt to register custom element with already registered tag name would fail due to w3c standard limitations. 
The scoped custom element registry is still a proposal.

### custom element instance
constructor creates XML with 
* root matching the tag 
* payload
  * dom nodes with `slot` attribute stay inside
* attributes
* ?dataset

DOM content is replaced with results of instance XML transformation by declaration XSLT.

# template syntax
## Attributes
curly braces `{}` in attributes implemented as [attribute value template](https://www.w3.org/TR/xslt20/#attribute-value-templates)

The names in curly braces are matching the instance attributes. I.e. in XML node `/my-component/attributes/`.

To access payload XPath could start with `/*/payload/`. I.e. `{/*/payload//label}` refers to all `label` tags in payload. 

## Slots
`<slot name="xxx">` is replaced by payload top elements with `slot` attribute matching the name, 
i.e.  slot `xxx` is matching `<i slot="xxx">...</i>` in payload.
```html
<custom-element tag="with-description" >
    <slot name="description">description is not available</slot>
    <!-- same as 
        <xsl:value-of select='/*/payload/*[@slot="description"]'/>
    -->
</custom-element>
<with-description>
    <p slot="description">Bulbasaur is a cute Pokémon ...</p>
</with-description>
```

## loops, variables
Loop implemented via [xsl:for-each](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/for-each)

[Variables in XSLT](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/variable) 

## [XPath](https://developer.mozilla.org/en-US/docs/Web/XSLT/Transforming_XML_with_XSLT/The_Netscape_XSLT_XPath_Reference)
is available in `{}` in attributes, in `xsl:for-each`, `xsl:if`, `xsl:value-of`, and other XSL tags.

XPath is a selector language to navigate over custom element instance data, attributes, and payload.

# troubleshooting
## `{}` does not give a value
* try to add as attribute you could observe and put the value of node name or text to identify the current location in data 
within template
```xml
<b title="{name(*)} : {text()}">xml tag name:<xsl:value-of select='name()'/></b>
```
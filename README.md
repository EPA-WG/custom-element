# custom-element
Declarative Custom Element 

# Implementation notes
## Life cycle
### `custom-element` declaration
* constructor loads template as XSL dom
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

To access payload XPath could start with `../payload/`. I.e. `{../payload//label}` refers to all `label` tags in payload. 

## Slots
`<slot name="xxx">` is replaced by payload top elements with `slot` attribute matching the name, 
i.e.  slot `xxx` is matching `<i slot="xxx">...</i>` in payload.

## loops, variables
Loop implemented via [xsl:for-each](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/for-each)

[Variables in XSLT](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/variable) 

## [XPath](https://developer.mozilla.org/en-US/docs/Web/XSLT/Transforming_XML_with_XSLT/The_Netscape_XSLT_XPath_Reference)
is available in `{}` in attributes, in `xsl:for-each`, `xsl:if`, `xsl:value-of`, and other XSL tags.

XPath is a selector language to navigate over custom element instance data, attributes, and payload.

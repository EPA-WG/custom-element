# custom-element
`Declarative Custom Element` is a part of pure `Declarative Web Application` stack. A proof of concept as a part of 
[WCCG in Declarative custom elements](https://github.com/w3c/webcomponents-cg/issues/32#issuecomment-1321037301) 
discussion. The functionality of DCE and its data access does not require programming using JavaScript. 

It allows to define custom HTML tag with template filled from slots, attributes and data `slice` as of now from  
[local-storage][local-storage-demo],  [http-request][http-request-demo], [location][location-demo].
UI is re-rendered on each data slice change.

[![git][github-image] GitHub][git-url]
| Live demo: [custom-element][demo-url]
| Try in [Sandbox][sandbox-url]
| [tests project][git-test-url]
| [Chrome devtools pugin][plugin-url]

[![NPM version][npm-image]][npm-url] 
[![coverage][coverage-image]][coverage-url] 
[![Published on webcomponents.org][webcomponents-img]][webcomponents-url]

# use
## install
use via CDN
```html
<script type="module" src="https://unpkg.com/@epa-wg/custom-element@0.0/custom-element.js"></script>
```
NPM, yarn
```shell
npm i -P @epa-wg/custom-element
yarn add @epa-wg/custom-element
```

## [Live demo 🔗][demo-url]
```html
<custom-element tag="pokemon-tile" hidden>
    <h3><xsl:value-of select="title"/></h3> <!-- title is an attribute in instance
                                                 mapped into /*/attributes/title -->
    <xsl:if test="//smile">                 <!-- data-smile DCE instance attribute,
                                                 mapped into /*/dataset/smile
                                                 used in condition -->
                                            <!-- data-smile DCE instance attribute, used as HTML -->
        <div>Smile as: <xsl:value-of select='//smile'/></div>
    </xsl:if>
    <!-- image would not be visible in sandbox, see live demo -->
    <img src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/{pokemon-id}.svg"
         alt="{title} image"/>
                                            <!-- image-src and title are DCE instance attributes,
                                                 mapped into /*/attributes/
                                                 used within output attribute via curly brackets -->

                                            <!-- `slot name=xxx` replaced with elements with `slot=xxx` attribute -->
    <p><slot name="description"><i>description is not available</i></slot></p>
</custom-element>

<pokemon-tile title="bulbasaur" data-smile="👼" pokemon-id="1" >
    <p slot="description">Bulbasaur is a cute Pokémon born with a large seed firmly affixed to its back;
        the seed grows in size as the Pokémon  does.</p>
</pokemon-tile>

<pokemon-tile title="ninetales" pokemon-id="38" ></pokemon-tile>        
```
generates HTML
```html
<pokemon-tile title="bulbasaur" data-smile="👼" 
              image-src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/1.svg"
    >
    <h3>bulbasaur</h3>
    <div>Smile as: 👼</div>
    <img src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/1.svg" alt="bulbasaur">
    <p>Bulbasaur is a cute Pokémon born with a large seed firmly affixed to its back;
                the seed grows in size as the Pokémon  does.</p>
</pokemon-tile>
<pokemon-tile title="ninetales" 
              image-src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/38.svg"
    >
    <h3>ninetales</h3>
    <img src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/38.svg" alt="ninetales">
    <p></p>
</pokemon-tile>
```

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

## XSLT 1.0
The in-browser native implementation as of now supports [XSLT 1.0](https://www.w3.org/TR/xslt-10/). 
File the [change request](https://github.com/EPA-WG/custom-element/issues) for support of another XSLT version or 
template engine.

# troubleshooting
## HTML parser is not compatible with templates
On many tags like `table`, or link `a` the attempt to use XSLT operations could lead to DOM order missmatch to given 
in template. In such cases the `html:` prefix in front of troubled tag would solve the parsing.

```html
<custom-element tag="dce-2" hidden>
    <local-storage key="basket" slice="basket"></local-storage>
    <html:table>
        <xsl:for-each select="//slice/basket/@*">
            <html:tr>
                <html:th><xsl:value-of select="name()"/></html:th>
                <html:td><xsl:value-of select="."/></html:td>
            </html:tr>
        </xsl:for-each>
    </html:table>
    count:<xsl:value-of select="count(//slice/basket/@*)"/>
</custom-element>
```
See [demo source](demo/local-storage.html) for detailed sample.

## Chrome devtools plugin
[@epa-wg/custom-element plugin][plugin-url] gives the view into

* `current` selected in DOM inspector node
* Parent `customElement`
* Declarative Custom Element `dce` for custom element ^^

* `datadom` for easier inspection
* `xml` as a string
* `xslt` as a string

## template debugging
`xml` and `xslt` can be saved to file via for "_copy string contents_" into clipboard.

The XSLT debugger from your favorite IDE can set the breakpoints withing those files and 
run transformation under debugger.


## `{}` does not give a value
* try to add as attribute you could observe and put the value of node name or text to identify the current location in data 
within template
```xml
<b title="{name(*)} : {text()}">xml tag name:<xsl:value-of select='name()'/></b>
```

[git-url]:        https://github.com/EPA-WG/custom-element
[git-test-url]:   https://github.com/EPA-WG/custom-element-test
[demo-url]:       https://unpkg.com/@epa-wg/custom-element@0.0/index.html
[local-storage-demo]: https://unpkg.com/@epa-wg/custom-element@0.0/demo/local-storage.html
[http-request-demo]:  https://unpkg.com/@epa-wg/custom-element@0.0/demo/http-request.html
[location-demo]:  https://unpkg.com/@epa-wg/custom-element@0.0/demo/location.html
[github-image]:   https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/mark-github.svg
[npm-image]:      https://img.shields.io/npm/v/@epa-wg/custom-element.svg
[npm-url]:        https://npmjs.org/package/@epa-wg/custom-element
[coverage-image]: https://unpkg.com/@epa-wg/custom-element-test@0.0.10/coverage/coverage.svg
[coverage-url]:   https://unpkg.com/@epa-wg/custom-element-test@0.0.10/coverage/lcov-report/index.html
[storybook-url]:  https://unpkg.com/@epa-wg/custom-element-test@0.0.10/storybook-static/index.html?path=/story/welcome--introduction
[sandbox-url]:    https://stackblitz.com/github/EPA-WG/custom-element?file=index.html
[webcomponents-url]: https://www.webcomponents.org/element/@epa-wg/custom-element
[webcomponents-img]: https://img.shields.io/badge/webcomponents.org-published-blue.svg
[plugin-url]:     https://chrome.google.com/webstore/detail/epa-wgcustom-element/hiofgpmmkdembdogjpagmbbbmefefhbl

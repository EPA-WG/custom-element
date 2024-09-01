# custom-element
`Declarative Custom Element` (DCE) is a part of pure `Declarative Web Application` stack. A proof of concept as a part of
[WCCG in Declarative custom elements](https://github.com/w3c/webcomponents-cg/issues/32#issuecomment-1321037301) and [Declarative Web Application](https://github.com/EPA-WG/dwa#readme)
discussion. **NO-JS** The functionality of DCE and its data access does not require programming using JavaScript.

It allows to define custom HTML tag with template filled from slots, attributes and data `slice` as of now from
[local-storage][local-storage-demo],  [http-request][http-request-demo], [location][location-demo].
UI is re-rendered on each data slice change triggered by initialization or DOM event.

[![git][github-image] GitHub][git-url]
| Live demo: [custom-element][demo-url]
| Try in [Sandbox][sandbox-url]
| [tests project][git-test-url]
| [Chrome devtools pugin][plugin-url]

[![NPM version][npm-image]][npm-url]
[![coverage][coverage-image]][coverage-url]
[![Published on webcomponents.org][webcomponents-img]][webcomponents-url]



<details>
<summary> What is DCE? </summary>
DCE provides the next level of abstraction in HTML - native composition. With native implementation which is
streaming parser, streaming transformation, multithreading. native assumes the C/Rust compiled code.
There is no place for JavaScript except of polyfill and ability to extend DCE, which otherwise has to be native.

The composition assumes the fully functional template and ability to call the template with parameters( custom tag + attributes) .

As the next to HTML abstraction layer - **composition**, it provides:
* ability to use dependencies as from withing the page as from external file/lib via src attribute and # in URL
* ability to treat external content via content-type like html, SVG, images, video with own template rendering
* provide styles and embedded DCE declarations in own and named(lib) scope, sharing the scoped registry.

After composition the layer of **functional component** provides
* data layer with access to attributes/payload(+slots), dataset, data bound slice
* means in template to use the data selector for condition/enumeration/text injection into attributes and DOM
* Set of native primitives to support browser APIs declaratively: location,storage, http request which bonded to slice and as result to reactive UI.
* support the data change trigger over events

While DCE is no-JS concept, DCE provides the basic declarative constructs to build most of simple apps. Assuming the extending via custom elements and JS.  The evolution goal is to adopt most demanded APIs/construct natively into DCE stack over time.

DCE is compatible with closed/open/named root. Enabling as site-scoped styling and registry as encapsulated anonymous scopes in shadow root.

This project is a POC( Proof of Concept ) targeting to become a base for native DCE implementation polyfill.
</details>

# use

Use the [bootstrap project](https://github.com/EPA-WG/custom-element-bootstrap) with all pre-configured or
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

## Enable IDE support
[IDE.md](ide/IDE.md)



## [Live demo 🔗][demo-url]

### Interactivity via data `slice` triggered by events
```html
<custom-element>
      <input slice="typed"> //slice/typed : {//slice/typed}
</custom-element>

<custom-element>
    <template>
        <button slice="clickcount"
                slice-event="click"
                slice-value="//clickcount + 1" > + </button>
        <input slice="clickcount" type="number" value="{//clickcount ?? 0}">
        Click count: { //clickcount }
    </template>
</custom-element>
```
More on `slice` concept in [slice and events demo page][slice-demo-url]

### Templating power
comes from XSLT and XPath. Which is natively implemented in all current browsers, globally tested and well documented.
```html

<custom-element tag="pokemon-tile" hidden>
    <h3>{title}</h3> <!-- title is an attribute in instance
                                                 mapped into /*/attributes/title -->
    <if test="//smile">                 <!-- data-smile DCE instance attribute,
                                                 mapped into /*/dataset/smile
                                                 used in condition -->
                                            <!-- data-smile DCE instance attribute, used as HTML -->
        <div>Smile as: {//smile} </div>
    </if>
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

[![responsive hex grid demo][hex-grid-image] responsive hex-grid demo][hex-grid-url]
, look into sources for samples of CSS encapsulation and external template use.


# Implementation notes
## Life cycle
### `custom-element` declaration
* constructor injects payload into XSL template
* creates a class for custom element extending HTMLElement
* registers element by `tag` attribute

NOTE: attempt to register custom element with already registered tag name would fail due to w3c standard limitations.
The scoped custom element registry is still a proposal.

### omitting `tag` leads to template instantiation
Whether template is inline or given by `src` attribute, the `custom-element` would be instantiated inline if no `tag`
attribute is given.

### custom element instance
constructor creates XML with
* root matching the tag
* payload
  * dom nodes with `slot` attribute stay inside
* attributes
* ?dataset

DOM content is replaced with results of instance XML transformation by declaration XSLT.

# `tag` attribute
allows to define the Custom Element tag registered by `window.customElements.define()`.

If omitted, the tag is auto-generated and the content is rendered inline.
```html
<custom-element> my tag is {tag} </custom-element>
```
See [demo](https://unpkg.com/@epa-wg/custom-element@0.0/demo/external-template.html) for `tag` attribute use.

# `src` attribute
allows to refer either external template or template within external library by `#id` hash in URL.

See [demo](https://unpkg.com/@epa-wg/custom-element@0.0/demo/external-template.html) with various samples.

## types of template
* HTML with DCE syntax ( slots, data slices, xslt operators, etc. )
* SVG image, MathML, etc.
* XSLT template. The `datadom` is the XML payload for transformation. In order to be embedded into external document,
this document has to have XML syntax like XHTML. Attempt of including XSLT within HTML file would break the template
integrity by parser.


## `#id` Local reference
allows to refer the template withing same document

## `url`
allows to use the external document as template

## `url#id`
allows to refer the template withing external document


# template syntax
[Scoped CSS][css-demo-url] live demo
## styles encapsulation
DCE can have the own styles which would be scoped to the instances.
In order to prevent the style leaking, it has to be defined withing `template` tag:
```html
<custom-element>
  <template>
    <style>
        color: green;
        button{ color: blue; }
    </style>
    <label> green <button>blue</button> </label>
  </template>
</custom-element>
```
<fieldset>
  <label style="color: green"> green <button style="color: blue">blue</button> </label>
</fieldset>

### override style for instance
In same way as in DCE itself:
```html
        <custom-element tag="dce-2">
            <template><!-- template needed to avoid styles leaking into global HTML -->
                <style>
                    button{ border: 0.2rem dashed blue; }
                </style>
                <button><slot>Blue borders</slot></button>
            </template>
        </custom-element>
        <dce-2>dashed blue</dce-2>
        <dce-2>
            <template> <!-- template needed to avoid styles leaking into global HTML -->
                <style>button{border-color:red;}</style>
                Red border
            </template>
        </dce-2>
```
## Attributes
To be served by IDE and to track the attributes changes, they have to be declared via `attribute`:
```html
    <custom-element tag="dce-with-attrs" hidden>
        <attribute name="p1" >default_P1                </attribute>
        <attribute name="p2" select="'always_p2'"       ></attribute>
        <attribute name="p3" select="//p3 ?? 'def_P3' " ></attribute>
        p1: {$p1} <br/> p2: {$p2} <br/> p3: {$p3}
    </custom-element>
    <dce-with-attrs p1="123" p3="qwe"></dce-with-attrs>
```

The curly braces `{}` in attributes implemented as [attribute value template](https://www.w3.org/TR/xslt20/#attribute-value-templates)

The names in curly braces are matching the instance attributes. I.e. in XML node `/my-component/attributes/`.

To access payload XPath could start with `/*/payload/`. I.e. `{/*/payload//label}` refers to all `label` tags in payload.

## Slots
`<slot name="xxx">` is replaced by payload top elements with `slot` attribute matching the name,
i.e.  slot `xxx` is matching `<i slot="xxx">...</i>` in payload.
```html
<custom-element tag="with-description" >
    <slot name="description">description is not available</slot>
    <!-- same as
        <value-of select='/*/payload/*[@slot="description"]'/>
    -->
</custom-element>
<with-description>
    <p slot="description">Bulbasaur is a cute Pokémon ...</p>
</with-description>
```

## loops, variables
Loop implemented via [for-each](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/for-each)

[Variables in XSLT](https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/variable)

## [XPath](https://developer.mozilla.org/en-US/docs/Web/XSLT/Transforming_XML_with_XSLT/The_Netscape_XSLT_XPath_Reference)
is available in `{}` in attributes, in `for-each`, `if`, `value-of`, and other XSL tags.

XPath is a selector language to navigate over custom element instance data, attributes, and payload.

## XSLT 1.0
The in-browser native implementation as of now supports [XSLT 1.0](https://www.w3.org/TR/xslt-10/).
File the [change request](https://github.com/EPA-WG/custom-element/issues) for support of another XSLT version or
template engine.

# troubleshooting
## HTML parser is not compatible with templates
On many tags like `table`, or link `a` the attempt to use XSLT operations could lead to DOM order mismatch to given
in template. In such cases the `xhtml:` prefix in front of troubled tag would solve the parsing.

```html
<custom-element tag="dce-2" hidden>
  <local-storage key="basket" slice="basket" live type="json"></local-storage>
  <xhtml:table xmlns:xhtml="http://www.w3.org/1999/xhtml"  >
    <xhtml:tbody>
      <for-each select="//basket/@*">
        <xhtml:tr>
          <xhtml:th> {name()} </xhtml:th>
          <xhtml:td> {.}      </xhtml:td>
        </xhtml:tr>
      </for-each>
    </xhtml:tbody>
    <xhtml:tfoot>
      <xhtml:tr>
        <xhtml:td><slot>🤔</slot></xhtml:td>
        <xhtml:th> {sum(//slice/basket/@*)} </xhtml:th>
      </xhtml:tr>
    </xhtml:tfoot>
  </xhtml:table>
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
<b title="{name(*)} : {text()}">xml tag name: <value-of select='name()'/></b>
```

[git-url]:        https://github.com/EPA-WG/custom-element
[git-test-url]:   https://github.com/EPA-WG/custom-element-dist
[demo-url]:       https://unpkg.com/@epa-wg/custom-element@0.0/index.html
[css-demo-url]:   https://unpkg.com/@epa-wg/custom-element@0.0/demo/scoped-css.html
[slice-demo-url]:   https://unpkg.com/@epa-wg/custom-element@0.0/demo/data-slices.html
[hex-grid-url]:   https://unpkg.com/@epa-wg/custom-element@0.0/demo/hex-grid.html
[hex-grid-image]: demo/hex-grid-transform.png
[local-storage-demo]: https://unpkg.com/@epa-wg/custom-element@0.0/demo/local-storage.html
[http-request-demo]:  https://unpkg.com/@epa-wg/custom-element@0.0/demo/http-request.html
[location-demo]:  https://unpkg.com/@epa-wg/custom-element@0.0/demo/location.html
[github-image]:   https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/mark-github.svg
[npm-image]:      https://img.shields.io/npm/v/@epa-wg/custom-element.svg
[npm-url]:        https://npmjs.org/package/@epa-wg/custom-element
[coverage-image]: https://unpkg.com/@epa-wg/custom-element-dist@0.0.26/coverage/src/custom-element/coverage.svg
[coverage-url]:   https://unpkg.com/@epa-wg/custom-element-dist@0.0.26/coverage/src/custom-element/index.html
[storybook-url]:  https://unpkg.com/@epa-wg/custom-element-dist@0.0.26/storybook-static/index.html?path=/story/welcome--introduction
[sandbox-url]:    https://stackblitz.com/github/EPA-WG/custom-element?file=index.html
[webcomponents-url]: https://www.webcomponents.org/element/@epa-wg/custom-element
[webcomponents-img]: https://img.shields.io/badge/webcomponents.org-published-blue.svg
[plugin-url]:     https://chrome.google.com/webstore/detail/epa-wgcustom-element/hiofgpmmkdembdogjpagmbbbmefefhbl

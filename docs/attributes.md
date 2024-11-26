# Attributes in `custom-element`

# Declaring
In order to have access to attributes and expose them back as `custom-element` attributes in runtime, they have to be 
declared as list of direct children in CE `template` body:
```html
<custom-element tag="sample-el">
    <template>
        <attribute name="p1"></attribute>
        <attribute name="p2">DEFAULT VALUE</attribute>
        <attribute name="p3" select="//from-input"></attribute>
        <input slot="from-input" />
        { $p1 } { $p2 } { $p3 }
    </template>
</custom-element>
```
## Unassigned attribute value
The `p1` attribute meant to reflect the value of attribute passed from `sample-1` use.
```html
<sample-el p1="abc"></sample-el>
```
The value inside of CE rendered by `{ $p1 }` would be `abc` string. 
It does not change as there is no dynamic selector is set. 

## Fixed value
```html
<sample-el></sample-el>
<sample-el p2="DEFAULT VALUE"></sample-el>
```
In given example both instances would have same value for `p2` attribute. 
The missing attribute on 1st `sample-element` would be filled in runtime by CE.

## `select` expression
used for dynamic attribute propagation from within CE. For `sample-el` `p3` would be in sync with input value.

# Implementation details
The source of truth for internal attributes collection is `/datadom/attributes`, an internal instance xml dom model.
As a "state" object, any change to it would be reflected in
* CE instance attributes
* rendered by template DOM, the attributed in template are referenced as 
  * XSLT variables, a name prefixed with `$`, like `$p1`. Recommended syntax. 
  * as `/datadom/attributes/*` XPath in template.
  * as name, i.e. `p1` in XPath. The current data scope for XPath in template matches `/datadom/attributes` node. 

## Declaring 
`custom-element` resolves template body and reads all its direct `attribute` children. 
* All attributes are stored in template-associated  `declaredAttributes` collection.
* The attributes with text value (p2), are stored in template-associated `hardcodedAttributes` key:value collection.
* The attributes with text value or `select` (as p2,p3), are stored in template-associated `exposedAttributes` collection.
* Template is translated into XSL where all attributes are replaced by 
```html
<xsl:param name="p1" select="/datadom/attributes/p1"></xsl:param>
<xsl:param name="p2" select="/datadom/attributes/p2"></xsl:param>
<xsl:param name="p3" select="//from-input"></xsl:param>
```
The `select` is directly copied from `attribute` (p3), otherwise when `select` is missing (p2,p3), the values are taken from model.

## Instance initialization
* keys from declaredAttributes saved into `/datadom/attributes`
* value from `hardcodedAttributes` saved into model
* all attributes with value from instance populated into model

## 1st and all renders
happen initially `onConnectedCallback` and on each model change ( triggered by slot events, etc. ).

Before render, `exposedAttributes` collection is synced with DCE attributes by assigning the values from attribute 
`select` XPath. Same value is propagated into matching `/datadom/attributes`.

The `attributeChangedCallback` would be triggered and invoke the render on each changed attribute.
`this.#inTransform` flag prevents the recursive render calls. 

## Attribute changes from outside
* Would trigger the `attributeChangedCallback`
* which would set the `/datadom/attributes`
* and trigger render cycle

Recursive attribute cycle from render is prevented by comparing the value.

WARNING: the infinite loop is possible by
* making one attribute depend on another which depends on first, possibly over multiple indirect dependencies.
* changing the attribute by `select` and forced to change again from outside by overriding attribute value on CE instance.

Such patterns are unlikely. Detection mechanism TBD.
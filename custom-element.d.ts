export function log(x: any): void;
export function deepEqual(a: any, b:any): boolean|0;
export function xml2dom(xmlString:string): Document;
export function xmlString(doc:Node|Document): string;

/**
 * @summary Declarative Custom Element as W3C proposal PoC with native(XSLT) based templating
 * ```html
 * <custom-element tag="my-element">
 *             <template>
 *                 <attribute name="p1" >default_P1</attribute>
 *                 <style>
 *                     color:green;
 *                     b{ color: blue;}
 *                     input:checked+b{ color: darkblue; text-shadow: 0 0 4px springgreen;}
 *                 </style>
 *                 <label>
 *                     green
 *                     <input type="checkbox" value="Glowing Blue" checked/><b>blue</b>
 *                 </label>
 *                 p1:{$p1}
 *             </template>
 *         </custom-element>
 * <my-element p1="abc"></my-element>
 * ```
 *
 * @extends HTMLElement
 * @tag custom-element
 * @tag-name custom-element
 * @attr {boolean} hidden - hides DCE definition to prevent visual appearance of content. Wrap the payload into template tag to prevent applying the inline CSS in global scope.
 * @attr {string} tag - HTML tag for Custom Element. Used for window.customElements.define(). If not set, would be generated and DCE instance rendered inline.
 * @attr {string} src - full, relative, or hash URL to DCE template.
 *
 */
export class CustomElement extends HTMLElement {
    static observedAttributes : string[];
}
export default CustomElement;

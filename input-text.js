export class InputTextElement extends HTMLElement
{
    constructor()
    {
        super();
        const i = this.ownerDocument.createElement('input');
        for(let a of this.attributes)
            a.namespaceURI ? i.setAttributeNS(a.namespaceURI,a.name,a.value) : i.setAttribute(a.name,a.value)
        this.append(i)
    }
    get value(){ return this.firstChild.value }
    set value(v){ return this.firstChild.value = v }
    disconnectedCallback(){ }
}

window.customElements.define( 'input-text', InputTextElement );
export default InputTextElement;
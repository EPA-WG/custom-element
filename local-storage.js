const     string2value = (type, v) =>
{   if( type === 'text')
        return v;
    if( type === 'json')
        return JSON.parse( v );
    const el = document.createElement('input');
    el.setAttribute('type',type);
    el.setAttribute('value', v );
    return type==='number'? el.valueAsNumber : 'date|time|dateTimeLocal'.includes(type)? el.valueAsDate: el.value;
};

export function localStorageSetItem(key, value)
{   localStorage.setItem(key, value);
    window.dispatchEvent( new CustomEvent('local-storage',{detail:{key,value}}) );
}
export class LocalStorageElement extends HTMLElement
{
    static get observedAttributes() {
        return  [   'value' // populated from localStorage, if defined initially, sets the value in storage
                ,   'slice'
                ,   'key'
                ,   'type' // `text|json`, defaults to text, other types are compatible with INPUT field
                ,   'live' // monitors localStorage change
                ];
    }

    async connectedCallback()
    {
        const    attr = attr => this.getAttribute(attr)
            , fromStorage = ()=>
        {   this.value = string2value( attr('type'), localStorage.getItem( attr( 'key' ) ) );
            this.dispatchEvent( new Event('change') )
        }
        // todo apply type
        if( this.hasAttribute('value'))
            localStorageSetItem( attr( this, 'key' ) )
        else
            fromStorage()

        if( this.hasAttribute('live') )
        {   const listener = (e => e.detail.key === attr( 'key' ) && fromStorage());
            window.addEventListener( 'local-storage', listener );
            this._destroy = ()=> window.removeEventListener('local-storage', listener );
        }
    }
    disconnectedCallback(){ this._destroy?.(); }
}

window.customElements.define( 'local-storage', LocalStorageElement );
export default LocalStorageElement;
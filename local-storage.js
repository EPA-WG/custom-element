const     string2value = (type, v) =>
{   if( type === 'text')
        return v;
    if( type === 'json')
        try{ return JSON.parse( v );}
        catch(err){ return null }
    const el = document.createElement('input');
    el.setAttribute('type',type);
    if( 'number' === type )
    {   el.value = v;
        return el.valueAsNumber;
    }
    if( 'date' === type )
    {   if(!v) return null;
        el.valueAsDate = new Date( v );
        return el.value;
    }
    el.value = v;
    return el.value;
};

let originalSetItem,originalRemoveItem,originalClear;

export function localStorage_setItem( key, value )
{   originalSetItem.call(localStorage, key, value);
    window.dispatchEvent( new CustomEvent('local-storage',{detail:{key,value}}) );
}
export function localStorage_removeItem( key )
{   originalRemoveItem.call(localStorage, key);
    window.dispatchEvent( new CustomEvent('local-storage',{detail:{key}}) );
}

export function localStorage_clear()
{   originalClear.call(localStorage);
    window.dispatchEvent( new CustomEvent('local-storage',{detail:{}}) );
}

function ensureTrackLocalStorage()
{   if( originalSetItem )
        return;
    originalSetItem = localStorage.setItem;
    localStorage.setItem = localStorage_setItem;
    originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = localStorage_removeItem;
    originalClear = localStorage.clear;
    localStorage.clear = localStorage_clear;
}
ensureTrackLocalStorage();

export function localStorageSetItem(key, value)
{   localStorage_setItem(key, value);
}
export class LocalStorageElement extends HTMLElement
{
    static observedAttributes=
                [   'value' // populated from localStorage, if defined initially, sets the value in storage
                ,   'slice'
                ,   'key'
                ,   'type' // `text|json`, defaults to text, other types are compatible with INPUT field
                ,   'live' // monitors localStorage change
                ];

    #value;
    get value(){ return this.#value ===null ? undefined: this.#value }
    set value(o){ return this.#value = o; }

    async connectedCallback()
    {
        const    attr = attr => this.getAttribute(attr)
        , fromStorage = ()=>
        {   this.#value = string2value( attr('type'), localStorage.getItem( attr( 'key' ) ) );
            this.dispatchEvent( new Event('change') )
        }
        this.#value = string2value( attr('type'), localStorage.getItem( attr( 'key' ) ) );

        if( this.hasAttribute('value'))
            localStorageSetItem( attr( 'key' ), this.#value = attr( 'value' )  )
        else
            fromStorage()

        if( this.hasAttribute('live') )
        {   const listener = (e => (e.detail.key === attr( 'key' ) || !e.detail.key ) && fromStorage());
            window.addEventListener( 'local-storage', listener );
            ensureTrackLocalStorage();
            this._destroy = ()=> window.removeEventListener('local-storage', listener );
        }
    }
    disconnectedCallback(){ this._destroy?.(); }
}

window.customElements.define( 'local-storage', LocalStorageElement );
export default LocalStorageElement;

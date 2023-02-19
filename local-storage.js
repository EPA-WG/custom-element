const     attr = (el, attr)=> el.getAttribute(attr)
, string2value = (type, v) =>
{   if( type === 'text')
        return v;
    if( type === 'json')
        return JSON.parse( v );
    const el = document.createElement('input');
    el.setAttribute('type',type);
    el.setAttribute('value', v );
    return type==='number'? el.valueAsNumber : 'date|time|dateTimeLocal'.includes(type)? el.valueAsDate: el.value;
};

let originalSetItem;

function ensureTrackLocalStorage()
{   if( originalSetItem )
        return;
    originalSetItem = localStorage.setItem;
    localStorage.setItem = function( key, value, ...rest )
        {   originalSetItem.apply(this, [ key, value, ...rest ]);
            window.dispatchEvent( new CustomEvent('local-storage',{detail:{key,value}}) );
        };
}

export class LocalStorageElement extends HTMLElement
{
    // @attribute live - monitors localStorage change
    // @attribute type - `text|json`, defaults to text, other types are compatible with INPUT field
    constructor()
    {
        super();
        const      state = {}
        ,           type = attr(this, 'type') || 'text'
        ,       listener = e=> e.detail.key === attr( this,'key' ) && propagateSlice()
        , propagateSlice = ()=>
        {   for( let parent = this.parentElement; parent; parent = parent.parentElement)
                if( parent.onSlice )
                    return parent.onSlice(
                        {     detail: string2value( type, localStorage.getItem( attr( this, 'key' ) ) )
                        ,     target: this
                        } );
                console.error(`${this.localName} used outside of custom-element`)
                debugger;
        };
        this.sliceInit = s =>
        {   if( !state.listener && this.hasAttribute('live') )
            {   state.listener = 1;
                window.addEventListener( 'local-storage', listener );
                ensureTrackLocalStorage();
            }
            propagateSlice();
            return s || {}
        }
        this._destroy = ()=>
        {
            if( !state.listener )
                return;
            state.listener && window.removeEventListener('local-storage', listener );
            delete state.listener;
        };
    }
    disconnectedCallback(){ this._destroy(); }
}

window.customElements.define( 'local-storage', LocalStorageElement );
export default LocalStorageElement;
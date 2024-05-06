const attr = ( el, attr )=> el.getAttribute( attr );


let originalHistory;

function ensureTrackLocationChange()
{   if( originalHistory )
        return;
    originalHistory = {};
    'back,forward,go,pushState,replaceState'.split(',').forEach( k =>
    {
        originalHistory[ k ] = history[ k ];
        history[ k ] = function(...rest )
        {
            originalHistory[k].apply( history, rest );
            window.dispatchEvent( new CustomEvent('dce-location',{detail:{ k }}) );
        }
    });
}

export class LocationElement extends HTMLElement
{
    static observedAttributes=
            [   'value' // populated from history, if defined initially, sets the value in storage
            ,   'slice'
            ,   'key'
            ,   'type' // `text|json`, defaults to text, other types are compatible with INPUT field
            ,   'live' // monitors history change
            ];

    constructor()
    {
        super();
        const      state = {}
        ,       listener = e => setTimeout( propagateSlice,1 )
        , propagateSlice = ()=>
        {   const urlStr = attr(this,'src')
            if(!urlStr)
                ensureTrackLocationChange();
            const url = urlStr? new URL(urlStr) : window.location;

            const params= {}
            const search = new URLSearchParams(url.search);
            for (const key of search.keys())
                params[key] = search.getAll(key)

            const detail = {params}
            for( const k in url )
            {   if ('string' === typeof url[k])
                    detail[k] = url[k]
            }
            this.value = detail;
            this.dispatchEvent( new Event('change') );
        };
        this.sliceInit = s =>
        {
            if( !state.listener && this.hasAttribute('live') )
            {   state.listener = 1;
                window.navigation?.addEventListener("navigate", listener );
                window.addEventListener( 'popstate'      , listener );
                window.addEventListener( 'hashchange'    , listener );
                window.addEventListener( 'dce-location'  , listener );
            }
            propagateSlice();
            return s || {}
        }
        this._destroy = ()=>
        {
            if( !state.listener )
                return;
            if(state.listener)
            {   window.removeEventListener('popstate'    , listener);
                window.removeEventListener('hashchange'  , listener);
                window.removeEventListener('dce-location', listener);
            }
            delete state.listener;
        };

    }
    connectedCallback(){ this.sliceInit() }
    disconnectedCallback(){ this._destroy() }
}

window.customElements.define( 'location-element', LocationElement );
export default LocationElement;
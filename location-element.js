const     attr = (el, attr)=> el.getAttribute(attr);

export class LocationElement extends HTMLElement
{
    static get observedAttributes()
    {   return  [   'value' // populated from localStorage, if defined initially, sets the valiue in storage
                ,   'slice'
                ,   'live' // monitors location change
                ,   'src'  // URL to be parsed, defaults to `window.location`
                ];
    }

    constructor()
    {
        super();
        const      state = {}
        ,       listener = e=> propagateSlice(e)
        , propagateSlice = ()=>
        {   const urlStr = attr(this,'src')
            const url = urlStr? new URL(urlStr) : window.location

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
                window.addEventListener( 'popstate'  , listener );
                window.addEventListener( 'hashchange', listener );
            }
            propagateSlice();
            return s || {}
        }
        this._destroy = ()=>
        {
            if( !state.listener )
                return;
            if(state.listener)
            {   window.removeEventListener('popstate'  , listener);
                window.removeEventListener('hashchange', listener);
            }
            delete state.listener;
        };

    }
    connectedCallback(){ this.sliceInit() }
    disconnectedCallback(){ this._destroy() }
}

window.customElements.define( 'location-element', LocationElement );
export default LocationElement;
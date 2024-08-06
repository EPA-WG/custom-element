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
const methods =
{   'location.href'         : src => window.location.href = src
,   'location.hash'         : src => window.location.hash = src
,   'location.assign'       : src => window.location.assign( src )
,   'location.replace'      : src => window.location.replace( src )
,   'history.pushState'     : src => window.history.pushState( {}, "", src )
,   'history.replaceState'  : src => window.history.replaceState( {}, "", src )
};


export class LocationElement extends HTMLElement
{
    static observedAttributes=
            [   'value' // populated from url
            ,   'slice'
            ,   'href'  // url to be parsed. When omitted window.location is used.
            ,   'type' // `text|json`, defaults to text, other types are compatible with INPUT field
            ,   'live' // monitors history change, applicable only when href is omitted.
            ,   'src' // sets the URL
            ,   'method' // when defined, changes URL by one of predefined methods.
            ];

    constructor()
    {
        super();
        const      state = {}
        ,       listener = () => setTimeout( propagateSlice,1 )
        , propagateSlice = ()=>
        {   const urlStr = attr(this,'href')
            if(!urlStr)
                ensureTrackLocationChange();
            const url = urlStr? new URL(urlStr, window.location) : window.location;

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
            if( this.hasAttribute('method') )
            {
                const method = this.getAttribute('method');
                const src = this.getAttribute('src');
                if( method && src )
                    if( method === 'location.hash' )
                    {   if( src !== window.location.hash )
                            methods[ method ]?.( src );
                    }else if( window.location.href !== new URL(src, window.location).href )
                        methods[method]?.(src);
            }
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
            window.removeEventListener('popstate'    , listener);
            window.removeEventListener('hashchange'  , listener);
            window.removeEventListener('dce-location', listener);
            delete state.listener;
        };

    }
    attributeChangedCallback(name, oldValue, newValue)
    {
        if('href'!== name && 'method' !== name && 'src' )
            if( !['method','src','href'].includes(name) )
                return;
        this.sliceInit && this.sliceInit();
    }

    connectedCallback(){ this.sliceInit() }
    disconnectedCallback(){ this._destroy() }
}

window.customElements.define( 'location-element', LocationElement );
export default LocationElement;